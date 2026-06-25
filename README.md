# Personal Fit Up

Sistema de gestão para personal trainers — migrado do Base44 para **Supabase** + **Vercel**.

## Stack

- **Frontend:** React + Vite + Tailwind
- **Banco:** Supabase (PostgreSQL)
- **Hospedagem:** Vercel
- **Pagamentos:** Stripe (API serverless na Vercel)

## Configuração rápida

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No **SQL Editor**, execute o arquivo `supabase/migrations/001_initial_schema.sql`
3. Copie a **URL** e a **anon key** do projeto

### 2. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_URL=https://personalfitup.com.br
```

### 3. Rodar localmente

```bash
npm install
npm run dev
```

### 4. Deploy na Vercel

1. Importe o repositório na [Vercel](https://vercel.com)
2. Adicione as variáveis de ambiente (incluindo `SUPABASE_SERVICE_ROLE_KEY` e `STRIPE_SECRET_KEY` para as API routes)
3. Configure o domínio `personalfitup.com.br` nas configurações do projeto

### 5. Migrar dados do Base44 (opcional)

Enquanto o app Base44 ainda estiver ativo:

```bash
# No .env, adicione também:
BASE44_APP_ID=69ea31515b70bc9ef16762b9
BASE44_APP_BASE_URL=https://SEU_APP.base44.app
SUPABASE_SERVICE_ROLE_KEY=eyJ...

npm run migrate:from-base44
```

## Credenciais padrão (após migration SQL)

| Perfil    | E-mail               | Senha    |
|-----------|----------------------|----------|
| Admin     | admin@fitpro.com     | admin123 |
| Professor | professor@fitpro.com | prof123  |
| Aluno     | aluno@fitpro.com     | aluno123 |

## Webhook PagBank / Stripe

URL do webhook (configure no painel PagBank):

```
https://personalfitup.com.br/api/pagbank-webhook
```
