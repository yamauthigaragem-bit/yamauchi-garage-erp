# Publicação para clientes reais

## O que a versão atual já entrega

O aplicativo já possui as telas e fluxos para cadastro de cliente, serviços,
fotos, pedidos, produtos, formas de pagamento, documentos e administração.

## O que precisa ser conectado antes de publicar

### 1. Login, cadastro e banco de dados

Use um serviço de autenticação e banco de dados, como Supabase, para armazenar:

- contas de clientes e administradores;
- veículos e histórico de cada cliente;
- solicitações de orçamento e suas fotos;
- produtos, estoque, carrinhos e pedidos;
- orçamentos, Seikyusho e pagamentos;
- notificações enviadas e lidas.

As regras devem garantir que o cliente só consiga ver os próprios dados e que os
administradores vejam a operação da oficina.

### 2. Fotos

As fotos devem ficar em armazenamento em nuvem, não dentro do navegador. Configure
limite de tamanho, tipos permitidos (JPG, PNG e WEBP) e links privados para fotos de
danos de veículos.

### 3. WhatsApp

Para uma notificação automática — sem depender de alguém clicar no botão — é preciso
uma conta do WhatsApp Business Platform/Meta, número comercial aprovado e modelos de
mensagem aprovados. O servidor então envia notificações de novo orçamento e novo
pedido para todos os telefones administrativos cadastrados.

Os botões atuais já abrem uma conversa do WhatsApp com a mensagem preenchida; isso é
útil durante a demonstração e para respostas manuais da equipe.

### 4. Pagamentos

Escolha pelo menos um provedor que opere para sua empresa no Japão. As opções na tela
(cartão, PayPay, transferência e pagamento na retirada) devem ser conectadas ao
provedor escolhido. Nunca armazene números de cartão no aplicativo.

### 5. Segurança e operação

- Remover a conta de demonstração e usar senhas com hash.
- Criar recuperação de senha e confirmação de e-mail/telefone.
- Registrar alterações de status, pagamentos e documentos.
- Fazer cópias de segurança do banco de dados.
- Definir quem pode adicionar administradores e alterar contas bancárias.

## Informações necessárias para a próxima etapa

1. Nome legal da empresa, endereço, dados bancários e política de impostos.
2. Logo final e carimbo, se diferente do documento de referência.
3. Telefones do WhatsApp dos administradores.
4. Lista inicial de produtos, preços, estoque e fotos.
5. Provedor de pagamento escolhido.
