/**
 * Cria tabela configuracoes_planos no Supabase.
 * Uso: node scripts/apply-migration-planos.mjs
 */
import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRef = 'spcfdnembnywrjwptolc';
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error('Defina SUPABASE_DB_PASSWORD no .env');
  process.exit(1);
}

const sql = readFileSync(
  path.join(__dirname, '../supabase/migrations/002_configuracoes_planos.sql'),
  'utf8',
);

const connectionStrings = [
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
];

async function main() {
  let lastError;
  for (const connStr of connectionStrings) {
    const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      await client.query(sql);
      const r = await client.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = 'configuracoes_planos'",
      );
      console.log('OK — configuracoes_planos:', r.rows.length ? 'criada' : 'não encontrada');
      await client.end();
      return;
    } catch (err) {
      lastError = err;
      try { await client.end(); } catch { /* ignore */ }
      console.warn(`Tentativa falhou: ${err.message}`);
    }
  }
  throw lastError;
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
