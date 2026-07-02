import { getPlanoEfetivo, getLimiteAlunos } from './planos-professor';

export const ALUNO_VIEWS_CONSULTORIA = new Set(['servicos', 'meus-pedidos', 'loja']);

/** Bloqueados para aluno ativo cujo professor está no plano gratuito */
export const ALUNO_VIEWS_PLANO_GRATUITO_BLOQUEADAS = new Set(['periodizacao-aluno', 'treino-corrida']);

export const MSG_CONSULTORIA_BLOQUEADA = 'Contrate uma consultoria para acessar.';

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

export function alunoProfessorPlanoGratuito(professor) {
  return getPlanoEfetivo(professor) === 'basico';
}

export function alunoPodeAcessarView(view, opts = {}) {
  const inativo = typeof opts === 'boolean' ? opts : Boolean(opts.inativo);
  const professorGratuito = typeof opts === 'object' && opts !== null ? Boolean(opts.professorGratuito) : false;

  if (inativo) {
    return ALUNO_VIEWS_CONSULTORIA.has(view);
  }
  if (professorGratuito && ALUNO_VIEWS_PLANO_GRATUITO_BLOQUEADAS.has(view)) {
    return false;
  }
  return true;
}
