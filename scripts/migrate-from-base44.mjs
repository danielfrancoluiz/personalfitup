/**
 * Exporta dados do Base44 e importa no Supabase.
 *
 * Uso:
 *   1. Preencha BASE44_* e SUPABASE_* no .env
 *   2. npm run migrate:from-base44
 *
 * Requer acesso ao app Base44 ainda ativo. Se o app já foi desligado,
 * exporte manualmente pelo painel Base44 antes de cancelar.
 */
import 'dotenv/config';
import { createClient as createBase44Client } from '@base44/sdk';
import { createClient } from '@supabase/supabase-js';

const ENTITIES = {
  Aluno: 'alunos',
  Professor: 'professores',
  Avaliacao: 'avaliacoes',
  PlanoTreino: 'planos_treino',
  Periodizacao: 'periodizacoes',
  Especialista: 'especialistas',
  ExercicioBiblioteca: 'exercicios_biblioteca',
  Produto: 'produtos',
  Transacao: 'transacoes',
  PlanoCorrida: 'planos_corrida',
  Agenda: 'agenda',
  BibliotecaTreino: 'biblioteca_treinos',
  Credencial: 'credenciais',
  FeedbackTreino: 'feedbacks_treino',
  PARQResposta: 'parq_respostas',
  SolicitacaoVinculo: 'solicitacoes_vinculo',
  ConfiguracaoPagBank: 'configuracoes_pagbank',
};

const base44 = createBase44Client({
  appId: process.env.BASE44_APP_ID,
  requiresAuth: false,
  appBaseUrl: process.env.BASE44_APP_BASE_URL,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function entityToRow(entity) {
  const { id, createdAt, updatedAt, created_at, updated_at, ...data } = entity;
  if (!id) throw new Error('Entidade sem id');
  return {
    id,
    data,
    ...(createdAt ? { created_at: createdAt } : {}),
    ...(updatedAt ? { updated_at: updatedAt } : {}),
  };
}

async function migrateEntity(name, table) {
  console.log(`\n→ ${name}...`);
  const rows = await base44.entities[name].list();
  console.log(`  ${rows.length} registros encontrados`);

  if (rows.length === 0) return { name, count: 0 };

  const payload = rows.map(entityToRow);
  const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' });
  if (error) throw new Error(`${name}: ${error.message}`);

  return { name, count: rows.length };
}

async function main() {
  const required = ['BASE44_APP_ID', 'BASE44_APP_BASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter((k) => !process.env[k] && !(k === 'SUPABASE_SERVICE_ROLE_KEY' && process.env.VITE_SUPABASE_URL));
  if (!process.env.VITE_SUPABASE_URL && !process.env.SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
  if (missing.length) {
    console.error('Variáveis ausentes no .env:', missing.join(', '));
    process.exit(1);
  }

  console.log('Iniciando migração Base44 → Supabase');
  console.log('App Base44:', process.env.BASE44_APP_ID);

  const results = [];
  for (const [name, table] of Object.entries(ENTITIES)) {
    try {
      results.push(await migrateEntity(name, table));
    } catch (err) {
      console.error(`  ERRO em ${name}:`, err.message);
      results.push({ name, count: 0, error: err.message });
    }
  }

  console.log('\n── Resumo ──');
  for (const r of results) {
    console.log(`  ${r.name}: ${r.count}${r.error ? ` (erro: ${r.error})` : ''}`);
  }
  console.log('\nMigração concluída.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
