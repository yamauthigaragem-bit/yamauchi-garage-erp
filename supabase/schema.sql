-- Yamauchi Garage: execute este arquivo no SQL Editor do Supabase.
-- Ele cria um banco compartilhado e impede que um cliente veja dados de outro.

create type public.user_role as enum ('customer', 'admin');
create type public.request_status as enum ('pre_evaluation', 'reviewing', 'approved', 'in_service', 'completed', 'cancelled');
create type public.order_status as enum ('pending', 'confirmed', 'paid', 'ready', 'completed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  price_yen integer not null check (price_yen >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text unique not null,
  customer_id uuid not null references public.profiles(id),
  vehicle text not null,
  service text not null,
  description text not null,
  status public.request_status not null default 'pre_evaluation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_request_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  customer_id uuid not null references public.profiles(id),
  payment_method text not null,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text not null,
  unit_price_yen integer not null check (unit_price_yen >= 0),
  quantity integer not null check (quantity > 0)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Cria automaticamente o perfil básico quando um usuário se cadastra pelo Supabase Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Cliente'),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    case when lower(coalesce(new.email, '')) = 'yamauthigaragem@gmail.com' then 'admin'::public.user_role else 'customer'::public.user_role end
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.service_requests enable row level security;
alter table public.service_request_photos enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.notifications enable row level security;

create policy "profile visible to owner or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profile updated by owner" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "products are public" on public.products for select using (active or public.is_admin());
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "customers read own service requests" on public.service_requests for select using (customer_id = auth.uid() or public.is_admin());
create policy "customers create own service requests" on public.service_requests for insert with check (customer_id = auth.uid());
create policy "admins update service requests" on public.service_requests for update using (public.is_admin()) with check (public.is_admin());
create policy "service photos follow request access" on public.service_request_photos for select using (exists (select 1 from public.service_requests r where r.id = request_id and (r.customer_id = auth.uid() or public.is_admin())));
create policy "customers add own service photos" on public.service_request_photos for insert with check (exists (select 1 from public.service_requests r where r.id = request_id and r.customer_id = auth.uid()));

create policy "customers read own orders" on public.orders for select using (customer_id = auth.uid() or public.is_admin());
create policy "customers create own orders" on public.orders for insert with check (customer_id = auth.uid());
create policy "admins update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "items follow order access" on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin())));
create policy "customers add own order items" on public.order_items for insert with check (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));

create policy "users read own notifications" on public.notifications for select using (recipient_id = auth.uid() or public.is_admin());
create policy "users mark own notifications read" on public.notifications for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "admins create notifications" on public.notifications for insert with check (public.is_admin());

-- Bucket privado para fotos de danos. Faça upload apenas pela API do Storage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-damage', 'vehicle-damage', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "customers upload own damage photos" on storage.objects for insert to authenticated with check (
  bucket_id = 'vehicle-damage' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "customers read own damage photos" on storage.objects for select to authenticated using (
  bucket_id = 'vehicle-damage' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
create policy "customers delete own damage photos" on storage.objects for delete to authenticated using (
  bucket_id = 'vehicle-damage' and (storage.foldername(name))[1] = auth.uid()::text
);


-- Corrige automaticamente uma conta do proprietário que já tenha sido criada antes.
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(coalesce(u.email, '')) = 'yamauthigaragem@gmail.com';
