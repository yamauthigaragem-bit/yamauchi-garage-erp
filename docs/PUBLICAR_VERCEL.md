# Publicar a Yamauchi Garage na Vercel

## Publicação de demonstração

Esta modalidade serve para apresentar o visual e testar os fluxos. Os dados ficam
salvos apenas no navegador de cada aparelho e não são compartilhados.

1. Crie um novo projeto na Vercel e envie esta pasta para um repositório GitHub.
2. Na Vercel, importe o repositório.
3. Framework: Next.js. Build command: `pnpm build`.
4. Não configure `NEXT_PUBLIC_ENABLE_DEMO_ADMIN` no site público.
5. Publique e teste pelo celular.

Para liberar temporariamente a conta administrativa de demonstração, configure:

```text
NEXT_PUBLIC_ENABLE_DEMO_ADMIN=true
```

Não use essa opção para clientes reais.

## Publicação para clientes reais

Antes de divulgar o aplicativo como sistema oficial:

1. Crie um projeto no Supabase.
2. Execute `supabase/schema.sql` no SQL Editor.
3. Configure na Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

4. Substitua os fluxos locais de cadastro, login, pedidos e orçamentos pelas operações
   do Supabase. O cliente Supabase já existe em `lib/supabase/client.ts`, mas a tela
   atual ainda usa `localStorage`.
5. Crie o primeiro usuário pelo Supabase Auth e altere seu perfil para administrador:

```sql
update public.profiles
set role = 'admin'
where id = 'UUID_DO_USUARIO';
```

6. Teste as políticas de segurança com duas contas de cliente diferentes.
7. Configure domínio próprio, recuperação de senha, política de privacidade e os
   canais oficiais de atendimento.

## Segurança

Nunca coloque a chave `service_role` em variáveis iniciadas por `NEXT_PUBLIC_`.
Somente a chave pública/publishable pode ir para o navegador.
