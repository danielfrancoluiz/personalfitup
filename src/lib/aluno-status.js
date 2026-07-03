import { getPlanoEfetivo, getLimiteAlunos } from './planos-professor';

export const ALUNO_VIEWS_CONSULTORIA = new Set(['servicos', 'meus-pedidos', 'loja']);

export const MSG_CONSULTORIA_BLOQUEADA = 'Contrate uma consultoria para acessar.';

export const MSG_ALUNO_INATIVO_BLOQUEADO =
  'Sua consultoria está inativa. Escolha um professor na lista abaixo para solicitar ativação ou vincular-se a outro profissional.';

/** Registro explícito — padrão ativo se não definido */
export function isAlunoAtivoRegistro(aluno) {
  return aluno?.ativo !== false;
}

export function ordenarAlunosPorCadastro(alunos) {
  return [...alunos].sort((a, b) => {
    const da = a.createdAt || a.id || '';
    const db = b.createdAt || b.id || '';
    return String(da).localeCompare(String(db));
  });
}

export function getAlunosDoProfessor(alunos, professorId) {
  if (!professorId) return [];
  return alunos.filter(a => a.professorId === professorId);
}

/** Alunos visíveis para o professor no plano gratuito (5 primeiros cadastrados) */
export function getAlunosVisiveisPlanoGratuito(alunosProfessor) {
  const limite = getLimiteAlunos('basico');
  return ordenarAlunosPorCadastro(alunosProfessor).slice(0, limite);
}

export function professorVeApenasAlunosPlanoGratuito(professor) {
  return getPlanoEfetivo(professor) === 'basico';
}

/** IDs dos alunos que permanecem ativos no plano gratuito (5 primeiros cadastrados) */
export function getIdsAlunosAtivosPlanoGratuito(alunosProfessor) {
  return getAlunosVisiveisPlanoGratuito(alunosProfessor).map(a => a.id);
}

export function professorPodeGerenciarStatusAluno(professor) {
  return getPlanoEfetivo(professor) !== 'basico';
}

/** Status efetivo considerando plano do professor */
export function alunoAtivoEfetivo(aluno, professor, alunosProfessor) {
  if (!aluno) return false;
  const planoId = getPlanoEfetivo(professor);
  if (planoId === 'basico') {
    const idsAtivos = getIdsAlunosAtivosPlanoGratuito(alunosProfessor);
    return idsAtivos.includes(aluno.id);
  }
  return isAlunoAtivoRegistro(aluno);
}

export function alunoPodeAcessarView(view, alunoInativo) {
  if (!alunoInativo) return true;
  return ALUNO_VIEWS_CONSULTORIA.has(view);
}
