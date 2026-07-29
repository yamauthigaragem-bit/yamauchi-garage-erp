# Yamauchi Garage

Aplicativo da Yamauchi Garage para clientes, serviços, orçamentos, loja de
peças/acessórios e documentos de venda.

## O que já funciona

- Cadastro de cliente com ID individual e área privada.
- Histórico particular de solicitações de serviço e compras.
- Pré-avaliação com múltiplas fotos dos danos no veículo.
- Loja virtual de peças, acessórios, limpeza e manutenção, com carrinho.
- Escolha de forma de pagamento: cartão, PayPay, transferência ou retirada.
- Painel administrativo com clientes, pedidos, orçamentos e telefones da equipe.
- Resposta pelo WhatsApp e notificações dentro do aplicativo.
- Orçamento/fatura (Seikyusho) imprimível ou salvável como PDF, baseado no
  modelo visual da Yamauchi Garage.

## Como abrir no computador

1. Instale o Node.js (versão LTS) em [nodejs.org](https://nodejs.org/).
2. Abra esta pasta em um editor, como o VS Code.
3. No terminal da pasta, execute:

```bash
corepack enable
pnpm install
pnpm dev
```

4. Abra `http://localhost:3000` no navegador.

## Versão demonstrável e publicação real

Esta versão guarda os dados no navegador em que foi aberta. Ela permite testar todos
os fluxos, mas os cadastros não são compartilhados entre aparelhos e não deve ser
publicada assim.

Para colocar o aplicativo no ar para clientes reais, siga o roteiro em
`docs/PRODUCAO.md`. Ele adiciona login seguro, banco de dados, fotos em nuvem,
notificações e pagamento online.

## Banco de dados Supabase

A estrutura segura do banco já está em `supabase/schema.sql`, incluindo clientes,
produtos, pedidos, orçamentos, fotos privadas e notificações. Para ativá-la, siga
`supabase/README.md`: crie o projeto gratuito, execute o SQL e preencha `.env.local`
com a URL e chave pública do seu projeto.

Administrador oficial:

- E-mail: `yamauthigaragem@gmail.com`
- A senha é criada no Supabase e nunca fica gravada no código.

Execute `supabase/INSTALAR_ADMIN_PRONTO.sql` para ativar o painel administrativo.

## Onde personalizar

- Dados iniciais da empresa e veículos: `app/page.tsx`.
- Cores e aparência geral: `app/globals.css`.
- Imagens dos veículos: `public/cars/`.

## Próxima evolução sugerida

1. Conectar Supabase (ou outro banco de dados) para login, clientes e imagens.
2. Conectar a API oficial do WhatsApp Business para mensagens automáticas.
3. Contratar e conectar o meio de pagamento escolhido.
4. Publicar em domínio próprio.
