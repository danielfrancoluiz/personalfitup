import { generateId } from './fitpro-storage';

const ex = (nome, grupoMuscular, series, repeticoes, descanso = 60, observacoes = '') => ({
  id: generateId(), nome, grupoMuscular, series, repeticoes, carga: 0, descanso, tecnica: 'Normal', observacoes,
});

const sessao = (nome, dia, exercicios) => ({ id: generateId(), nome, dia, exercicios });

// ─── BASE TEMPLATES (usados no botão "Aplicar Treino Padrão") ───────────────

export const TREINO_TEMPLATES = {
  Iniciante: {
    nome: 'Treino Padrão Iniciante — Fullbody',
    objetivo: 'Condicionamento',
    nivel: 'Iniciante',
    duracaoSemanas: 4,
    descricao: 'Treino fullbody 3x/semana ideal para quem está começando.',
    sessoes: [
      sessao('Treino A — Fullbody', 'Segunda-feira', [
        ex('Agachamento (Padrão)', 'Quadríceps', 3, '15-20', 45, 'Joelhos na direção dos dedos'),
        ex('Levantamento Terra Romênio com Halteres', 'Isquiotibiais', 3, '10-12', 75),
        ex('Ponte em Unilateral', 'Glúteos', 3, '15 por perna', 45),
        ex('Addução do Quadril Lateral com Alavanca', 'Adutores', 3, '15 por perna', 45),
        ex('Elevação de Panturrilha em Pé (Calistenia)', 'Panturrilha', 3, '20-30', 45),
        ex('Mesa Flexora Unilateral (Máquina)', 'Isquiotibiais', 3, '12 por perna', 60),
      ]),
      sessao('Treino B — Fullbody', 'Quarta-feira', [
        ex('Agachamento (Padrão)', 'Quadríceps', 3, '15-20', 45),
        ex('Elevação de Panturrilha em Uma Perna', 'Panturrilha', 3, '15 por perna', 45),
        ex('Adução do Quadril com Cabo', 'Adutores', 3, '15 por perna', 45),
        ex('Levantamento Terra com Kettlebell', 'Costas', 3, '10-12', 90),
        ex('Ponte em Unilateral', 'Glúteos', 3, '15 por perna', 45),
        ex('Levantamento Terra Romênio com Halteres', 'Isquiotibiais', 3, '10-12', 75),
      ]),
      sessao('Treino C — Fullbody', 'Sexta-feira', [
        ex('Agachamento (Padrão)', 'Quadríceps', 3, '15-20', 45),
        ex('Addução do Quadril Lateral com Alavanca', 'Adutores', 3, '15 por perna', 45),
        ex('Elevação de Panturrilha em Pé (Calistenia)', 'Panturrilha', 4, '20-30', 45),
        ex('Levantamento Terra com Kettlebell', 'Costas', 3, '10-12', 90),
        ex('Mesa Flexora Unilateral (Máquina)', 'Isquiotibiais', 3, '12 por perna', 60),
        ex('Ponte em Unilateral', 'Glúteos', 3, '15 por perna', 45),
      ]),
    ],
  },

  Intermediário: {
    nome: 'Treino Padrão Intermediário — Push/Pull/Legs',
    objetivo: 'Hipertrofia',
    nivel: 'Intermediário',
    duracaoSemanas: 8,
    descricao: 'Divisão Push/Pull/Legs 6x/semana. Foco em hipertrofia com sobrecarga progressiva.',
    sessoes: [
      sessao('Push A — Peito & Ombros & Tríceps', 'Segunda-feira', [
        ex('Agachamento Skater', 'Glúteos', 3, '10 por lado', 60),
        ex('Peso Morto Romeno com Barra', 'Isquiotibiais', 4, '10-12', 90),
        ex('Levantamento Terra com Barra no Landmine', 'Costas', 3, '10-12', 90),
        ex('Stiff Unilateral com Halteres', 'Isquiotibiais', 3, '10-12 por perna', 75),
        ex('Levantamento de Panturrilha com Apoio e Sobrecarga', 'Panturrilha', 4, '12-15 por perna', 45),
        ex('Bom Dia (Variação)', 'Lombares', 3, '10-12', 90),
      ]),
      sessao('Pull A — Costas & Bíceps', 'Terça-feira', [
        ex('Levantamento Terra com Barra no Landmine', 'Costas', 4, '10-12', 90),
        ex('Levantamento Terra Unilateral', 'Costas', 3, '8-10 por perna', 90),
        ex('Stiff Unilateral com Halteres', 'Isquiotibiais', 3, '10-12 por perna', 75),
        ex('Agachamento Skater', 'Glúteos', 3, '10 por lado', 60),
        ex('Rosca no Cabo Deitado', 'Bíceps', 3, '10-12', 60),
        ex('Levantamento de Panturrilha com Apoio e Sobrecarga', 'Panturrilha', 3, '12-15 por perna', 45),
      ]),
      sessao('Legs A — Quadríceps & Glúteos', 'Quarta-feira', [
        ex('Agachamento Skater', 'Glúteos', 4, '10 por lado', 60),
        ex('Peso Morto Romeno com Barra', 'Isquiotibiais', 4, '10-12', 90),
        ex('Afundo Profundo', 'Glúteos', 3, '10 por perna', 75),
        ex('Levantamento Terra Unilateral', 'Costas', 3, '8-10 por perna', 90),
        ex('Levantamento de Panturrilha com Apoio e Sobrecarga', 'Panturrilha', 4, '12-15 por perna', 45),
        ex('Bom Dia (Variação)', 'Lombares', 3, '10-12', 90),
      ]),
      sessao('Push B — Peito & Ombros & Tríceps', 'Quinta-feira', [
        ex('Peso Morto Romeno com Barra', 'Isquiotibiais', 4, '10-12', 90),
        ex('Agachamento Skater', 'Glúteos', 3, '10 por lado', 60),
        ex('Levantamento Terra com Barra no Landmine', 'Costas', 3, '10-12', 90),
        ex('Afundo Profundo', 'Glúteos', 3, '10 por perna', 75),
        ex('Rosca no Cabo Deitado', 'Bíceps', 3, '10-12', 60),
        ex('Levantamento de Panturrilha com Apoio e Sobrecarga', 'Panturrilha', 3, '12-15 por perna', 45),
      ]),
      sessao('Pull B — Costas & Bíceps', 'Sexta-feira', [
        ex('Levantamento Terra Unilateral', 'Costas', 4, '8-10 por perna', 90),
        ex('Stiff Unilateral com Halteres', 'Isquiotibiais', 4, '10-12 por perna', 75),
        ex('Bom Dia (Variação)', 'Lombares', 3, '10-12', 90),
        ex('Agachamento Skater', 'Glúteos', 3, '10 por lado', 60),
        ex('Rosca no Cabo Deitado', 'Bíceps', 3, '10-12', 60),
        ex('Levantamento de Panturrilha com Apoio e Sobrecarga', 'Panturrilha', 3, '12-15 por perna', 45),
      ]),
      sessao('Legs B — Posterior & Adutores', 'Sábado', [
        ex('Peso Morto Romeno com Barra', 'Isquiotibiais', 4, '10-12', 90),
        ex('Afundo Profundo', 'Glúteos', 3, '10 por perna', 75),
        ex('Levantamento Terra Unilateral', 'Costas', 3, '8-10 por perna', 90),
        ex('Stiff Unilateral com Halteres', 'Isquiotibiais', 3, '10-12 por perna', 75),
        ex('Levantamento de Panturrilha com Apoio e Sobrecarga', 'Panturrilha', 4, '12-15 por perna', 45),
        ex('Agachamento Skater', 'Glúteos', 3, '10 por lado', 60),
      ]),
    ],
  },

  Avançado: {
    nome: 'Treino Padrão Avançado — Upper/Lower Split',
    objetivo: 'Força',
    nivel: 'Avançado',
    duracaoSemanas: 12,
    descricao: 'Upper/Lower 4x/semana com periodização de força e hipertrofia.',
    sessoes: [
      sessao('Upper A — Força (Segunda)', 'Segunda-feira', [
        ex('Agachamento Zercher', 'Quadríceps', 4, '6-10', 90),
        ex('Levantamento com Suporte', 'Costas', 4, '4-6', 180),
        ex('Stiff Unilateral com Barra', 'Isquiotibiais', 3, '8-10 por perna', 90),
        ex('Salto em Caixa com Uma Perna', 'Quadríceps', 3, '5-6 por perna', 90),
        ex('Pulo de Impulso de Quadril de Uma Perna', 'Glúteos', 3, '8-10 por perna', 60),
        ex('Swing 360', 'Core', 3, '5-8', 90),
      ]),
      sessao('Lower A — Força (Terça)', 'Terça-feira', [
        ex('Agachamento com Trava', 'Quadríceps', 4, '3-6', 180),
        ex('Levantamento com Suporte', 'Costas', 4, '4-6', 180),
        ex('Stiff Unilateral com Barra', 'Isquiotibiais', 4, '8-10 por perna', 90),
        ex('Agachamento Hack Invertido', 'Glúteos', 3, '10-12', 90),
        ex('Salto em Caixa com Uma Perna', 'Quadríceps', 3, '5-6 por perna', 90),
        ex('Pulo de Impulso de Quadril de Uma Perna', 'Glúteos', 3, '8-10 por perna', 60),
      ]),
      sessao('Upper B — Hipertrofia (Quinta)', 'Quinta-feira', [
        ex('Agachamento Zercher', 'Quadríceps', 4, '8-10', 90),
        ex('Agachamento com Cinto', 'Quadríceps', 3, '10-15', 90),
        ex('Swing 360', 'Core', 3, '5-8', 90),
        ex('Stiff Unilateral com Barra', 'Isquiotibiais', 3, '8-10 por perna', 90),
        ex('Agachamento Hack Invertido', 'Glúteos', 3, '10-12', 90),
        ex('Levantamento com Suporte', 'Costas', 3, '4-6', 180),
      ]),
      sessao('Lower B — Hipertrofia (Sexta)', 'Sexta-feira', [
        ex('Agachamento com Trava', 'Quadríceps', 3, '3-6', 180),
        ex('Agachamento Hack Invertido', 'Glúteos', 4, '10-12', 90),
        ex('Stiff Unilateral com Barra', 'Isquiotibiais', 4, '8-10 por perna', 90),
        ex('Salto em Caixa com Uma Perna', 'Quadríceps', 3, '5-6 por perna', 90),
        ex('Pulo de Impulso de Quadril de Uma Perna', 'Glúteos', 3, '8-10 por perna', 60),
        ex('Agachamento com Cinto', 'Quadríceps', 3, '10-15', 90),
      ]),
    ],
  },
};

// ─── PERIODIZAÇÃO ANUAL (12 BLOCOS) ─────────────────────────────────────────
// Cada bloco representa um mês com foco, objetivo e volume diferente.

const PERIODIZACAO_ANUAL = {
  Iniciante: [
    { mes: 1, foco: 'Adaptação Neural',      objetivo: 'Condicionamento', series: [2, 3], reps: '15-20', descanso: 60, semanas: 4 },
    { mes: 2, foco: 'Resistência Muscular',  objetivo: 'Condicionamento', series: [3, 3], reps: '15-20', descanso: 45, semanas: 4 },
    { mes: 3, foco: 'Hipertrofia Inicial',   objetivo: 'Hipertrofia',     series: [3, 4], reps: '12-15', descanso: 60, semanas: 4 },
    { mes: 4, foco: 'Aumento de Volume',     objetivo: 'Hipertrofia',     series: [3, 4], reps: '10-15', descanso: 60, semanas: 4 },
    { mes: 5, foco: 'Força Básica',          objetivo: 'Força',           series: [4, 4], reps: '8-12',  descanso: 90, semanas: 4 },
    { mes: 6, foco: 'Intensidade Moderada',  objetivo: 'Força',           series: [4, 5], reps: '8-10',  descanso: 90, semanas: 4 },
    { mes: 7, foco: 'Deload / Recuperação',  objetivo: 'Condicionamento', series: [2, 2], reps: '15-20', descanso: 45, semanas: 2 },
    { mes: 8, foco: 'Retomada Hipertrofia',  objetivo: 'Hipertrofia',     series: [4, 4], reps: '10-12', descanso: 60, semanas: 4 },
    { mes: 9, foco: 'Sobrecarga Progressiva',objetivo: 'Hipertrofia',     series: [4, 5], reps: '8-12',  descanso: 75, semanas: 4 },
    { mes: 10, foco: 'Pico de Força',        objetivo: 'Força',           series: [4, 5], reps: '6-10',  descanso: 120, semanas: 4 },
    { mes: 11, foco: 'Manutenção + Técnica', objetivo: 'Condicionamento', series: [3, 4], reps: '12-15', descanso: 60, semanas: 4 },
    { mes: 12, foco: 'Deload Final',         objetivo: 'Condicionamento', series: [2, 3], reps: '15-20', descanso: 45, semanas: 2 },
  ],
  Intermediário: [
    { mes: 1, foco: 'Acumulação I',          objetivo: 'Hipertrofia',     series: [3, 4], reps: '12-15', descanso: 60, semanas: 4 },
    { mes: 2, foco: 'Acumulação II',         objetivo: 'Hipertrofia',     series: [4, 4], reps: '10-12', descanso: 75, semanas: 4 },
    { mes: 3, foco: 'Intensificação I',      objetivo: 'Força',           series: [4, 5], reps: '8-10',  descanso: 90, semanas: 4 },
    { mes: 4, foco: 'Intensificação II',     objetivo: 'Força',           series: [4, 5], reps: '6-8',   descanso: 120, semanas: 4 },
    { mes: 5, foco: 'Realização I',          objetivo: 'Força',           series: [5, 6], reps: '4-6',   descanso: 150, semanas: 3 },
    { mes: 6, foco: 'Deload Ativo',          objetivo: 'Condicionamento', series: [2, 3], reps: '15-20', descanso: 45, semanas: 2 },
    { mes: 7, foco: 'Hipertrofia — Alto Vol',objetivo: 'Hipertrofia',     series: [4, 5], reps: '10-15', descanso: 60, semanas: 4 },
    { mes: 8, foco: 'Hipertrofia Metabólica',objetivo: 'Hipertrofia',     series: [4, 5], reps: '12-20', descanso: 45, semanas: 4 },
    { mes: 9, foco: 'Força Máxima',          objetivo: 'Força',           series: [5, 6], reps: '3-5',   descanso: 180, semanas: 4 },
    { mes: 10, foco: 'Potência',             objetivo: 'Performance',     series: [4, 5], reps: '4-6',   descanso: 120, semanas: 4 },
    { mes: 11, foco: 'Transição / Técnica',  objetivo: 'Condicionamento', series: [3, 4], reps: '12-15', descanso: 60, semanas: 4 },
    { mes: 12, foco: 'Deload Final',         objetivo: 'Condicionamento', series: [2, 3], reps: '15-20', descanso: 45, semanas: 2 },
  ],
  Avançado: [
    { mes: 1, foco: 'GPP — Base Aeróbia',    objetivo: 'Condicionamento', series: [3, 4], reps: '15-20', descanso: 45, semanas: 3 },
    { mes: 2, foco: 'Acumulação — Força',    objetivo: 'Força',           series: [4, 5], reps: '8-10',  descanso: 120, semanas: 4 },
    { mes: 3, foco: 'Acumulação — Volume',   objetivo: 'Hipertrofia',     series: [5, 6], reps: '8-12',  descanso: 90, semanas: 4 },
    { mes: 4, foco: 'Intensificação I',      objetivo: 'Força',           series: [5, 6], reps: '5-7',   descanso: 150, semanas: 4 },
    { mes: 5, foco: 'Intensificação II',     objetivo: 'Força',           series: [5, 6], reps: '3-5',   descanso: 180, semanas: 4 },
    { mes: 6, foco: 'Realização / Pico',     objetivo: 'Força',           series: [6, 7], reps: '1-3',   descanso: 210, semanas: 3 },
    { mes: 7, foco: 'Deload Estrutural',     objetivo: 'Condicionamento', series: [2, 3], reps: '15-20', descanso: 45, semanas: 2 },
    { mes: 8, foco: 'Hipertrofia — Recarga', objetivo: 'Hipertrofia',     series: [4, 5], reps: '10-15', descanso: 75, semanas: 4 },
    { mes: 9, foco: 'Bloco de Potência',     objetivo: 'Performance',     series: [5, 6], reps: '3-6',   descanso: 150, semanas: 4 },
    { mes: 10, foco: 'Pico de Força II',     objetivo: 'Força',           series: [5, 6], reps: '2-4',   descanso: 210, semanas: 4 },
    { mes: 11, foco: 'Manutenção Técnica',   objetivo: 'Condicionamento', series: [3, 4], reps: '10-15', descanso: 90, semanas: 4 },
    { mes: 12, foco: 'Deload Final',         objetivo: 'Condicionamento', series: [2, 3], reps: '15-20', descanso: 45, semanas: 2 },
  ],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function enriquecerComBiblioteca(exercicios, biblioteca) {
  return exercicios.map(e => {
    const match = biblioteca.find(b => b.nome?.toLowerCase() === e.nome?.toLowerCase());
    if (!match) return e;
    return { ...e, gifUrl: match.gifUrl || e.gifUrl, observacoes: e.observacoes || match.dicas || '' };
  });
}

// Ajusta séries e descanso dos exercícios conforme o bloco de periodização
function ajustarIntensidade(sessoes, bloco, biblioteca) {
  const [seriesMin, seriesMax] = bloco.series;
  return sessoes.map(s => ({
    ...s,
    id: generateId(),
    exercicios: enriquecerComBiblioteca(
      s.exercicios.map((e, idx) => ({
        ...e,
        id: generateId(),
        // Alterna séries entre min e max por exercício para variedade dentro da sessão
        series: idx % 2 === 0 ? seriesMax : seriesMin,
        repeticoes: bloco.reps,
        descanso: bloco.descanso,
      })),
      biblioteca
    ),
  }));
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

export function aplicarTemplate(nivel, alunoId, biblioteca = []) {
  const template = TREINO_TEMPLATES[nivel];
  if (!template) return null;
  return {
    ...template,
    alunoId,
    sessoes: template.sessoes.map(s => ({
      ...s,
      id: generateId(),
      exercicios: enriquecerComBiblioteca(
        s.exercicios.map(e => ({ ...e, id: generateId() })),
        biblioteca
      ),
    })),
  };
}

/**
 * Gera 12 planos mensais periodizados e distintos.
 * Cada mês tem foco, volume e intensidade diferentes conforme a tabela de periodização.
 */
export function gerarPlanosAnuais(nivel, alunoId, biblioteca = [], dataInicial = new Date(), pasta = undefined) {
  const template = TREINO_TEMPLATES[nivel];
  const periodizacao = PERIODIZACAO_ANUAL[nivel];
  if (!template || !periodizacao) return [];

  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  return periodizacao.map((bloco, i) => {
    const inicio = new Date(dataInicial.getFullYear(), dataInicial.getMonth() + i, 1);
    const fim = new Date(dataInicial.getFullYear(), dataInicial.getMonth() + i + 1, 0);
    const nomeMes = MESES[inicio.getMonth()];
    const ano = inicio.getFullYear();

    return {
      nome: `${template.nome.split('—')[0].trim()} — ${bloco.foco} (${nomeMes}/${ano})`,
      objetivo: bloco.objetivo,
      nivel,
      alunoId,
      duracaoSemanas: bloco.semanas,
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: fim.toISOString().split('T')[0],
      pasta: pasta || undefined,
      sessoes: ajustarIntensidade(template.sessoes, bloco, biblioteca),
    };
  });
}