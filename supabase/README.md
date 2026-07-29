# Como ligar o Supabase

1. Crie um projeto gratuito em [Supabase](https://supabase.com/).
2. Abra o **SQL Editor**, cole e execute `schema.sql`.
3. Em **Authentication > Providers**, habilite o acesso por e-mail e senha.
4. Em **Project Settings > API**, copie a Project URL e a Publishable Key.
5. Copie `.env.example` para `.env.local` e preencha os dois valores.
6. Instale as dependências e inicie o projeto:

```bash
corepack enable
pnpm install
pnpm dev
```

7. Após criar a sua própria conta, transforme-a em administradora no SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = 'ID_DO_USUARIO';
```

O arquivo `.env.local` não deve ser enviado para ninguém. A chave pública pode ficar
no aplicativo somente porque as regras de segurança (RLS) do banco protegem cada dado.
Nunca use ou exponha uma chave `service_role` no navegador.
