import { Zap, Star, Crown, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export const PLANOS_CONFIG_ID = 'planos_global';
const STORAGE_KEY = 'fitpro_planos';

export const PLANOS_DEFAULT = [
  { id: 'basico', nome: 'Básico', preco: 0, desc: 'Até 5 alunos — Gratuito', icon: Zap, color: '#60a5fa', recursos: ['Até 5 alunos', 'Treinos básicos', 'Avaliações físicas', 'Acesso ao app'] },
  { id: 'profissional', nome: 'Profissional', preco: 99.90, desc: 'Até 50 alunos, todos os recursos', icon: Star, color: '#34d399', recursos: ['Até 50 alunos', 'Todos os treinos', 'Periodização', 'Agenda', 'Financeiro básico'] },
  { id: 'premium', nome: 'Premium', preco: 179.90, desc: 'Alunos ilimitados e relatórios avançados', icon: Crown, color: '#fbbf24', recursos: ['Alunos ilimitados', 'Relatórios avançados', 'Financeiro completo', 'Biblioteca exclusiva', 'Suporte prioritário'] },
  { id: 'enterprise', nome: 'Enterprise', preco: 299.90, desc: 'Multi-professor, API e suporte dedicado', icon: Building2, color: '#a78bfa', recursos: ['Multi-professor', 'API de integração', 'White-label', 'Suporte dedicado', 'Treinamento incluído'] },
];

export const PLANO_COLOR = { basico: '#60a5fa', profissional: '#34d399', premium: '#fbbf24', enterprise: '#a78bfa' };

const LIMITES_ALUNOS = {
  basico: 5,
  profissional: 50,
  premium: Infinity,
  enterprise: Infinity,
};

function mergePlanos(saved) {
  if (!saved || !Array.isArray(saved) || saved.length < 4) return [...PLANOS_DEFAULT];
  return PLANOS_DEFAULT.map(def => {
    const s = saved.find(p => p.id === def.id);
    const merged = s ? { ...def, ...s } : def;
    return merged.id === 'basico' ? { ...merged, preco: 0 } : merged;
  });
}

export function loadPlanos() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return mergePlanos(saved);
  } catch {
    return [...PLANOS_DEFAULT];
  }
}

export function savePlanos(planos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(planos));
}

export async function loadPlanosAsync() {
  try {
    const rows = await base44.entities.ConfiguracaoPlano.list();
    const row = rows.find(r => r.id === PLANOS_CONFIG_ID) || rows[0];
    if (row?.planos?.length >= 4) {
      const merged = mergePlanos(row.planos);
      savePlanos(merged);
      return merged;
    }
  } catch (e) {
    console.warn('[planos] loadPlanosAsync:', e.message);
  }
  return loadPlanos();
}

export async function savePlanosAsync(planos) {
  savePlanos(planos);
  try {
    const payload = { planos };
    const rows = await base44.entities.ConfiguracaoPlano.list();
    const existing = rows.find(r => r.id === PLANOS_CONFIG_ID);
    if (existing) {
      await base44.entities.ConfiguracaoPlano.update(PLANOS_CONFIG_ID, payload);
    } else {
      await base44.entities.ConfiguracaoPlano.create({ id: PLANOS_CONFIG_ID, ...payload });
    }
  } catch (e) {
    console.warn('[planos] savePlanosAsync:', e.message);
  }
}

export function getPrecoPlanoAtual(planoId) {
  const plano = loadPlanos().find(p => p.id === planoId);
  return plano?.preco ?? 0;
}

/** Contrato com preço travado ainda vigente */
export function contratoPrecoVigente(professor) {
  if (!professor || isPlanoGratuito(professor.planoCobranca)) return false;
  const preco = professor.precoPlanoContratado;
  if (preco == null || preco === '') return false;
  const fim = professor.dataFimContrato;
  if (!fim) return Number(preco) > 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(`${fim}T23:59:59`) >= hoje;
}

/** Preço a cobrar: contratado se vigente, senão tabela atual */
export function getPrecoCobrancaProfessor(professor, planoId) {
  const id = planoId || professor?.planoCobranca || 'basico';
  if (isPlanoGratuito(id)) return 0;
  if (professor && contratoPrecoVigente(professor)) {
    return Number(professor.precoPlanoContratado);
  }
  return getPrecoPlanoAtual(id);
}

export function limparContratoPlano() {
  return {
    precoPlanoContratado: '',
    periodoContrato: '',
    dataFimContrato: '',
  };
}

export function getLimiteAlunos(planoId) {
  return LIMITES_ALUNOS[planoId] ?? LIMITES_ALUNOS.basico;
}

export function isPlanoGratuito(planoId) {
  const plano = loadPlanos().find(p => p.id === planoId);
  return !plano || plano.preco === 0 || planoId === 'basico';
}

export function calcularDataVencimento(meses = 1, fromDate = new Date()) {
  const d = new Date(fromDate);
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().split('T')[0];
}

/** Dados ao ativar plano pago — trava preço pelo período contratado */
export function dadosVigenciaPlanoPago(planoId, planoNome, opts = {}) {
  const inicio = opts.inicio ? new Date(opts.inicio) : new Date();
  const hoje = inicio.toISOString().split('T')[0];
  const periodo = opts.periodoContrato || 'mensal';
  const preco = opts.precoContratado != null ? Number(opts.precoContratado) : getPrecoPlanoAtual(planoId);
  const mesesContrato = periodo === 'anual' ? 12 : 1;

  return {
    planoCobranca: planoId,
    planoAssinatura: planoNome,
    statusPlano: 'ativo',
    dataInicioPlano: hoje,
    dataVencimento: calcularDataVencimento(1, inicio),
    periodoContrato: periodo,
    precoPlanoContratado: preco,
    dataFimContrato: calcularDataVencimento(mesesContrato, inicio),
  };
}

/** Após pagar mensalidade: mantém preço travado até dataFimContrato */
export function dadosRenovacaoMensalidade(professor) {
  const planoId = professor?.planoCobranca || 'profissional';
  const base = {
    statusPlano: 'ativo',
    dataVencimento: calcularDataVencimento(1),
  };
  if (contratoPrecoVigente(professor)) {
    return base;
  }
  const periodo = professor?.periodoContrato || 'mensal';
  const mesesContrato = periodo === 'anual' ? 12 : 1;
  const preco = getPrecoPlanoAtual(planoId);
  return {
    ...base,
    precoPlanoContratado: preco,
    dataInicioPlano: new Date().toISOString().split('T')[0],
    dataFimContrato: calcularDataVencimento(mesesContrato),
  };
}

export function professorPlanoExpirado(professor) {
  if (!professor) return false;
  const planoId = professor.planoCobranca || 'basico';
  if (isPlanoGratuito(planoId)) return false;
  if (professor.statusPlano && professor.statusPlano !== 'ativo') return true;
  const venc = professor.dataVencimento;
  if (!venc) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fim = new Date(`${venc}T23:59:59`);
  return fim < hoje;
}

export function getPlanoEfetivo(professor) {
  const planoId = professor?.planoCobranca || 'basico';
  if (planoId !== 'basico' && (professor?.statusPlano !== 'ativo' || professorPlanoExpirado(professor))) {
    return 'basico';
  }
  return planoId;
}

export function contarAlunosProfessor(alunos, professorId) {
  if (!professorId) return 0;
  return alunos.filter(a => a.professorId === professorId).length;
}

export function podeCadastrarAluno(professor, qtdAlunos) {
  const planoId = getPlanoEfetivo(professor);
  const limite = getLimiteAlunos(planoId);
  return qtdAlunos < limite;
}

export function professorNoLimiteGratuito(professor, qtdAlunos) {
  const planoId = getPlanoEfetivo(professor);
  if (planoId !== 'basico') return false;
  return qtdAlunos >= getLimiteAlunos('basico');
}

export function professorPrecisaRenovarPlano(professor) {
  if (!professor) return false;
  const planoId = professor.planoCobranca || 'basico';
  if (isPlanoGratuito(planoId)) return false;
  return professorPlanoExpirado(professor) || professor.statusPlano !== 'ativo';
}
