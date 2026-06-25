/**
 * Aplica o schema SQL no Supabase via conexão PostgreSQL direta.
 * Uso: node scripts/apply-schema.mjs
 */
import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRef = 'spcfdnembnywrjwptolc';
const password = process.env.SUPABASE_DB_PASSWORD || 'personalfitup2026!';

const connectionStrings = [
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
];

const sql = readFileSync(
  path.join(__dirname, '../supabase/migrations/001_initial_schema.sql'),
  'utf8',
);

async function main() {
  let lastError;
  for (const connStr of connectionStrings) {
    const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
    try {
      console.log('Conectando ao banco...');
      await client.connect();
      console.log('Aplicando schema...');
      await client.query(sql);
      await client.end();
      console.log('Schema aplicado com sucesso.');
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
