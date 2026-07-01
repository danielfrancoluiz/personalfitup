import { Zap, Star, Crown, Building2 } from 'lucide-react';

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

export function loadPlanos() {
  try {
    const saved = JSON.parse(localStorage.getItem('fitpro_planos'));
    if (!saved || !Array.isArray(saved) || saved.length < 4) return PLANOS_DEFAULT;
    return PLANOS_DEFAULT.map(def => {
      const s = saved.find(p => p.id === def.id);
      const merged = s ? { ...def, ...s } : def;
      return merged.id === 'basico' ? { ...merged, preco: 0 } : merged;
    });
  } catch {
    return PLANOS_DEFAULT;
  }
}

export function getLimiteAlunos(planoId) {
  return LIMITES_ALUNOS[planoId] ?? LIMITES_ALUNOS.basico;
}

export function isPlanoGratuito(planoId) {
  const plano = loadPlanos().find(p => p.id === planoId);
  return !plano || plano.preco === 0 || planoId === 'basico';
}

export function getPlanoEfetivo(professor) {
  const planoId = professor?.planoCobranca || 'basico';
  const status = professor?.statusPlano || 'ativo';
  if (planoId !== 'basico' && status !== 'ativo') {
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
