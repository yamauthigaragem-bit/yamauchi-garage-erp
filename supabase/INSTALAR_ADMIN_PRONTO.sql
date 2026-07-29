-- YAMAUCHI GARAGE — ATIVAÇÃO SEGURA DO ADMINISTRADOR
-- Execute TODO este arquivo uma única vez no SQL Editor do Supabase.
-- Administrador oficial: yamauthigaragem@gmail.com

-- 1) Garante que novos usuários recebam perfil automaticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, 'Cliente'), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    case
      when lower(coalesce(new.email, '')) = 'yamauthigaragem@gmail.com' then 'admin'::public.user_role
      else 'customer'::public.user_role
    end
  )
  on conflict (id) do update set
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    phone = coalesce(nullif(excluded.phone, ''), public.profiles.phone),
    role = case
      when lower(coalesce(new.email, '')) = 'yamauthigaragem@gmail.com' then 'admin'::public.user_role
      else public.profiles.role
    end;
  return new;
end;
$$;

-- 2) Recria o gatilho sem duplicar.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 3) Cria o perfil, caso o usuário administrador já exista no Auth mas ainda não tenha perfil.
insert into public.profiles (id, full_name, phone, role)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), 'Administrador Yamauchi Garage'),
  coalesce(u.raw_user_meta_data ->> 'phone', ''),
  'admin'::public.user_role
from auth.users u
where lower(coalesce(u.email, '')) = 'yamauthigaragem@gmail.com'
on conflict (id) do update set role = 'admin'::public.user_role;

-- 4) Confirma o resultado. Deve aparecer role = admin.
select u.email, p.full_name, p.phone, p.role
from auth.users u
left join public.profiles p on p.id = u.id
where lower(coalesce(u.email, '')) = 'yamauthigaragem@gmail.com';
