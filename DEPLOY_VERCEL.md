# Deploy na Vercel — conta separada (Personal Fit Up)

Este projeto **não deve** ficar na mesma conta Vercel de outras empresas.

## Opção recomendada: conta Vercel nova

1. Crie uma conta em [vercel.com/signup](https://vercel.com/signup) com e-mail da empresa Personal Fit Up
2. No terminal, na pasta do projeto:

```powershell
cd "d:\Pessoal\Projetos\personalnexus-main\personalnexus-main"

# Sair da conta atual (se estiver logado em outra empresa)
npx vercel logout

# Entrar na conta NOVA da Personal Fit Up
npx vercel login

# Criar projeto novo (nome sugerido: personalfitup)
npx vercel link
# → Set up and deploy? No (só vincular)
# → Which scope? escolha a conta/team da Personal Fit Up
# → Link to existing project? No
# → Project name: personalfitup
```

## Variáveis de ambiente (obrigatórias)

No painel [vercel.com](https://vercel.com) → projeto **personalfitup** → Settings → Environment Variables:

| Nome | Valor | Ambientes |
|------|-------|-----------|
| `VITE_SUPABASE_URL` | `https://spcfdnembnywrjwptolc.supabase.co` | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | sua chave `sb_publishable_...` | Production, Preview |
| `SUPABASE_URL` | igual ao VITE_SUPABASE_URL | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | sua chave `sb_secret_...` | Production, Preview |
| `VITE_APP_URL` | `https://personalfitup.com.br` | Production, Preview |

Ou via CLI (na conta correta):

```powershell
echo "https://spcfdnembnywrjwptolc.supabase.co" | npx vercel env add VITE_SUPABASE_URL production
echo "https://spcfdnembnywrjwptolc.supabase.co" | npx vercel env add SUPABASE_URL production
echo "SUA_ANON_KEY" | npx vercel env add VITE_SUPABASE_ANON_KEY production
echo "SUA_SERVICE_KEY" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "https://personalfitup.com.br" | npx vercel env add VITE_APP_URL production
```

## Deploy

```powershell
npx vercel deploy --prod
```

## Domínio personalfitup.com.br

No painel Vercel → projeto → **Domains** → Add `personalfitup.com.br` e `www.personalfitup.com.br`.

No registrador do domínio (.br), configure:

| Tipo | Nome | Valor |
|------|------|-------|
| A | `@` | `76.76.21.21` |
| A | `www` | `76.76.21.21` |

Ou aponte os nameservers para a Vercel (`ns1.vercel-dns.com` e `ns2.vercel-dns.com`).

## Limpeza da conta antiga (opcional)

O deploy de teste foi feito por engano na conta `abelmirabel-8179`. Você pode apagar o projeto `personalnexus-main` nessa conta:

```powershell
npx vercel logout
npx vercel login   # conta antiga
npx vercel project rm personalnexus-main
```

O domínio `personalfitup.com.br` já foi removido dessa conta para não conflitar.
