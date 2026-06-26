/**
 * Aplica migration 002 (rename configuracoes_pagbank → configuracoes_stripe)
 * Uso: node scripts/apply-migration-002.mjs
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
  path.join(__dirname, '../supabase/migrations/002_rename_stripe.sql'),
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
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'configuracoes_%'",
      );
      console.log('OK — tabelas:', r.rows.map((x) => x.table_name).join(', '));
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
