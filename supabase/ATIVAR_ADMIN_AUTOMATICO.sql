-- Execute uma única vez no SQL Editor do Supabase.
-- A conta yamauthigaragem@gmail.com será administradora automaticamente.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Cliente'),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    case when lower(coalesce(new.email, '')) = 'yamauthigaragem@gmail.com'
      then 'admin'::public.user_role
      else 'customer'::public.user_role
    end
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    role = excluded.role;
  return new;
end;
$$;

update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(coalesce(u.email, '')) = 'yamauthigaragem@gmail.com';
