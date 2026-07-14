# Personal Fit Up

Sistema de gestão para personal trainers — **Supabase** + **Vercel**.

## Ambientes (Git + Vercel)

| Ambiente | Branch | Deploy Vercel | Banco (hoje) | URL típica |
|----------|--------|---------------|--------------|------------|
| **PRD** | `main` | Production | Supabase atual | https://personalfitup.com.br |
| **DEV** | `dev` | Preview | **mesmo** Supabase (temporário) | URL `*.vercel.app` do preview |

Hoje Production, Preview e Development usam as **mesmas** variáveis (ambiente de teste único). Depois:

1. Crie um segundo projeto no Supabase (ex.: `personalfitup-dev`)
2. Rode `supabase/migrations/001_initial_schema.sql` nele
3. No Vercel → Settings → Environment Variables, troque só as vars de **Preview** (e Development) para o projeto DEV
4. Deixe **Production** apontando para o Supabase de PRD

Fluxo de trabalho:

```text
feature → merge em dev → testa no preview
dev estável → PR / merge em main → sobe em produção
```

Não use tabela `*_teste`. Separe banco por projeto Supabase + vars do Vercel.

## Stack

- **Frontend:** React + Vite + Tailwind
- **Banco:** Supabase (PostgreSQL)
- **Hospedagem:** Vercel
- **Pagamentos:** Stripe (API serverless na Vercel)

## Configuração rápida

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No **SQL Editor**, execute `supabase/migrations/001_initial_schema.sql`
3. Copie a **URL** e a **anon key**

### 2. Variáveis de ambiente

```bash
cp .env.example .env
```

Ou puxe do Vercel:

```bash
npx vercel env pull .env.local --environment=development
```

### 3. Rodar localmente

```bash
npm install
npm run dev
```

Trabalhe na branch `dev`:

```bash
git checkout dev
git pull
```

### 4. Deploy na Vercel

- Push em `main` → Production (`personalfitup.com.br`)
- Push em `dev` → Preview (ambiente de desenvolvimento)
- Variáveis: Production / Preview / Development (hoje iguais; depois Preview = Supabase DEV)

### 5. Migrar dados do Base44 (opcional)

```bash
# No .env:
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

## Webhook Stripe

```
https://personalfitup.com.br/api/stripe-webhook
```

Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`.

Defina `STRIPE_WEBHOOK_SECRET` na Vercel (`whsec_...`).
