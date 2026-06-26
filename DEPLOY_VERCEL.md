# Deploy — conta danielfrancoluiz

Repositório: https://github.com/danielfrancoluiz/personalfitup  
Vercel: https://vercel.com/danielfrancoluiz-1626s-projects

## 1. Enviar código para o GitHub

O Git precisa estar autenticado como **danielfrancoluiz** (não Dionesoares).

```powershell
cd "d:\Pessoal\Projetos\personalnexus-main\personalnexus-main"

# Se pedir login, use a conta danielfrancoluiz no navegador
git push -u origin main
```

## 2. Vercel — importar do GitHub (recomendado)

1. Acesse https://vercel.com/danielfrancoluiz-1626s-projects
2. **Add New** → **Project**
3. Importe `danielfrancoluiz/personalfitup`
4. Framework: **Vite** (detectado automaticamente)
5. Environment Variables:

| Variável | Valor |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://spcfdnembnywrjwptolc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (do `.env` local) |
| `SUPABASE_URL` | igual acima |
| `SUPABASE_SERVICE_ROLE_KEY` | (do `.env` local) |
| `VITE_APP_URL` | `https://personalfitup.com.br` |

6. **Deploy**

## 3. Domínio

Settings → Domains → `personalfitup.com.br`  
DNS: registro **A** `@` e `www` → `76.76.21.21`

## Time separado (opcional)

Create Team → **Personal Fit Up** (Hobby grátis) → importe o mesmo repo no time.
