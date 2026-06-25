// ── FitPro PDF Generator ─────────────────────────────────────────────────────
// Uses jsPDF (already installed)

import { jsPDF } from 'jspdf';

const DARK = [10, 14, 26];
const CARD = [13, 21, 37];
const ACCENT = [251, 146, 60];
const GREEN = [52, 211, 153];
const BLUE = [96, 165, 250];
const PURPLE = [167, 139, 250];
const YELLOW = [251, 191, 36];
const RED = [239, 68, 68];
const WHITE = [248, 250, 252];
const GRAY = [100, 116, 139];

function setupPage(doc) {
  doc.setFillColor(...DARK);
  doc.rect(0, 0, 210, 297, 'F');
}

function header(doc, title, subtitle, y = 15) {
  // Faixa laranja
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, 210, 8, 'F');

  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text('FitPro', 14, y + 2);

  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text(title, 14, y + 10);

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(subtitle, 14, y + 16);

  doc.setFontSize(8);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 196, y + 16, { align: 'right' });

  // linha separadora
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(14, y + 20, 196, y + 20);

  return y + 26;
}

function sectionTitle(doc, text, y, color = ACCENT) {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...color);
  doc.text(text.toUpperCase(), 14, y);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(14, y + 1.5, 196, y + 1.5);
  return y + 7;
}

function metricCard(doc, label, value, x, y, w, h, color) {
  doc.setFillColor(color[0], color[1], color[2], 0.08);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...color);
  doc.text(String(value), x + w / 2, y + h / 2 - 1, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(label, x + w / 2, y + h / 2 + 4, { align: 'center' });
}

function textRow(doc, label, value, y, labelColor = GRAY, valueColor = WHITE) {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...labelColor);
  doc.text(label, 14, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...valueColor);
  doc.text(String(value || '—'), 100, y);
  return y + 5;
}

// ── AVALIAÇÃO PDF ────────────────────────────────────────────────────────────
export function gerarPDFAvaliacao(av, aluno) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  setupPage(doc);

  let y = header(doc, 'Avaliação Física', `Aluno: ${aluno?.nome || '—'} • Data: ${new Date(av.data).toLocaleDateString('pt-BR')}`);

  // Métricas principais
  const metrics = [
    { label: '% Gordura', value: av.percentualGordura != null ? `${av.percentualGordura.toFixed(1)}%` : '—', color: ACCENT },
    { label: 'Massa Magra', value: av.massaMagra != null ? `${av.massaMagra.toFixed(1)}kg` : '—', color: GREEN },
    { label: 'Massa Gorda', value: av.massaGorda != null ? `${av.massaGorda.toFixed(1)}kg` : '—', color: RED },
    { label: 'IMC', value: av.imc != null ? av.imc.toFixed(1) : '—', color: BLUE },
    { label: 'Classif. Gordura', value: av.classificacaoGordura || '—', color: YELLOW },
    { label: 'Classif. IMC', value: av.classificacaoIMC || '—', color: PURPLE },
    { label: 'TMB', value: av.tmb ? `${Math.round(av.tmb)} kcal` : '—', color: YELLOW },
    { label: 'Gasto Energético', value: av.geb ? `${Math.round(av.geb)} kcal` : '—', color: BLUE },
  ];

  const cols = 4;
  const cw = 43;
  const ch = 16;
  const gap = 3;

  y = sectionTitle(doc, 'Resultados', y);
  metrics.forEach((m, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    metricCard(doc, m.label, m.value, 14 + col * (cw + gap), y + row * (ch + gap), cw, ch, m.color);
  });
  y += 2 * (ch + gap) + 6;

  // Dados pessoais
  y = sectionTitle(doc, 'Dados do Aluno', y, BLUE);
  y = textRow(doc, 'Nome:', aluno?.nome, y);
  y = textRow(doc, 'Sexo:', aluno?.sexo === 'M' ? 'Masculino' : 'Feminino', y);
  y = textRow(doc, 'Peso:', `${av.peso}kg`, y);
  y = textRow(doc, 'Altura:', `${av.altura}cm`, y);
  y = textRow(doc, 'Idade:', `${av.idade} anos`, y);
  y += 3;

  // Dobras
  const dobrasCampos = ['peito','axilarMedia','triceps','subescapular','abdomen','suprailíaca','coxa'];
  const dobraValues = dobrasCampos.filter(k => av[k] != null);
  if (dobraValues.length > 0) {
    y = sectionTitle(doc, 'Dobras Cutâneas (mm)', y, ACCENT);
    dobraValues.forEach(k => {
      const label = k === 'axilarMedia' ? 'Axilar Média' : k.charAt(0).toUpperCase() + k.slice(1);
      y = textRow(doc, `${label}:`, `${av[k]} mm`, y);
    });
    y += 3;
  }

  // Circunferências
  const circCampos = [
    { key: 'circCintura', label: 'Cintura' }, { key: 'circQuadril', label: 'Quadril' },
    { key: 'circBracoDireito', label: 'Braço Direito' }, { key: 'circBracoEsquerdo', label: 'Braço Esquerdo' },
    { key: 'circCoxaDireita', label: 'Coxa Direita' }, { key: 'circCoxaEsquerda', label: 'Coxa Esquerda' },
  ].filter(c => av[c.key] != null);

  if (circCampos.length > 0) {
    y = sectionTitle(doc, 'Circunferências (cm)', y, GREEN);
    circCampos.forEach(c => { y = textRow(doc, `${c.label}:`, `${av[c.key]} cm`, y); });
    y += 3;
  }

  if (av.pressaoArterial || av.freqCardiacaRepouso) {
    y = sectionTitle(doc, 'Sinais Vitais', y, PURPLE);
    if (av.pressaoArterial) y = textRow(doc, 'Pressão Arterial:', av.pressaoArterial, y);
    if (av.freqCardiacaRepouso) y = textRow(doc, 'FC Repouso:', `${av.freqCardiacaRepouso} bpm`, y);
    y += 3;
  }

  if (av.observacoes) {
    y = sectionTitle(doc, 'Observações', y, GRAY);
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    const lines = doc.splitTextToSize(av.observacoes, 180);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 3;
  }

  // Rodapé
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('FitPro — Sistema de Gestão Fitness', 105, 290, { align: 'center' });

  doc.save(`avaliacao_${aluno?.nome?.replace(/\s/g, '_')}_${av.data}.pdf`);
}

// ── TREINO PDF ───────────────────────────────────────────────────────────────
export function gerarPDFTreino(treino, aluno) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  setupPage(doc);

  let y = header(doc, 'Plano de Treino', `Aluno: ${aluno?.nome || '—'} • Plano: ${treino.nome}`);

  // Info geral
  y = sectionTitle(doc, 'Informações do Plano', y, PURPLE);
  y = textRow(doc, 'Nome:', treino.nome, y);
  y = textRow(doc, 'Objetivo:', treino.objetivo, y);
  y = textRow(doc, 'Nível:', treino.nivel, y);
  y = textRow(doc, 'Duração:', `${treino.duracaoSemanas} semanas`, y);
  y = textRow(doc, 'Total de Sessões:', treino.sessoes?.length || 0, y);
  y += 4;

  const COR_SESSAO = [PURPLE, BLUE, GREEN, YELLOW, ACCENT, RED];

  (treino.sessoes || []).forEach((sessao, si) => {
    // Verifica se precisa de nova página
    if (y > 250) { doc.addPage(); setupPage(doc); y = 20; }

    const cor = COR_SESSAO[si % COR_SESSAO.length];
    y = sectionTitle(doc, `Sessão ${String.fromCharCode(65 + si)}: ${sessao.nome} — ${sessao.dia || ''}`, y, cor);

    (sessao.exercicios || []).forEach((ex, ei) => {
      if (y > 270) { doc.addPage(); setupPage(doc); y = 20; }

      // Linha de exercício
      doc.setFillColor(cor[0], cor[1], cor[2]);
      doc.circle(17, y - 1.5, 1.5, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...WHITE);
      doc.text(`${ei + 1}. ${ex.nome || '—'}`, 21, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      const info = [
        ex.series && ex.repeticoes ? `${ex.series}x${ex.repeticoes}` : '',
        ex.carga ? `${ex.carga}kg` : '',
        ex.descanso ? `${ex.descanso}s descanso` : '',
        ex.tecnica && ex.tecnica !== 'Normal' ? ex.tecnica : '',
      ].filter(Boolean).join(' • ');
      doc.text(info, 21, y + 4);

      if (ex.observacoes) {
        doc.setFontSize(7);
        doc.setTextColor(80, 100, 120);
        doc.text(`📝 ${ex.observacoes}`, 21, y + 8);
        y += 12;
      } else {
        y += 9;
      }
    });

    if (sessao.exercicios?.length === 0) {
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text('Nenhum exercício nesta sessão', 21, y);
      y += 6;
    }
    y += 3;
  });

  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('FitPro — Sistema de Gestão Fitness', 105, 290, { align: 'center' });

  doc.save(`treino_${aluno?.nome?.replace(/\s/g, '_')}_${treino.nome?.replace(/\s/g, '_')}.pdf`);
}

// ── PERIODIZAÇÃO PDF ─────────────────────────────────────────────────────────
export function gerarPDFPeriodizacao(per, aluno, planosTreino = []) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  setupPage(doc);

  let y = header(doc, 'Periodização', `Aluno: ${aluno?.nome || '—'} • ${per.nome}`);

  // Info geral
  y = sectionTitle(doc, 'Informações Gerais', y, YELLOW);
  y = textRow(doc, 'Nome:', per.nome, y);
  y = textRow(doc, 'Tipo:', per.tipo, y);
  y = textRow(doc, 'Objetivo:', per.objetivo, y);
  y = textRow(doc, 'Duração Total:', `${per.duracaoTotal} semanas`, y);
  y = textRow(doc, 'Data de Início:', per.dataInicio ? new Date(per.dataInicio).toLocaleDateString('pt-BR') : '—', y);
  y = textRow(doc, 'Total de Fases:', per.fases?.length || 0, y);
  y += 4;

  // Timeline visual
  if ((per.fases || []).length > 0) {
    y = sectionTitle(doc, 'Linha do Tempo de Fases', y, YELLOW);

    const FASE_CORES = {
      'Adaptação': BLUE, 'Hipertrofia': [244, 114, 182], 'Força': ACCENT,
      'Potência': YELLOW, 'Pico': RED, 'Recuperação': GREEN, 'Manutenção': PURPLE,
    };

    const barW = 182;
    const barH = 8;
    let bx = 14;

    (per.fases || []).forEach(fase => {
      const cor = FASE_CORES[fase.nome] || GRAY;
      const pct = ((parseInt(fase.duracaoSemanas) || 1) / per.duracaoTotal);
      const w = Math.max(4, pct * barW);
      doc.setFillColor(...cor);
      doc.rect(bx, y, w, barH, 'F');
      bx += w;
    });
    y += barH + 2;

    // Legenda de fases
    let lx = 14;
    (per.fases || []).forEach(fase => {
      const cor = FASE_CORES[fase.nome] || GRAY;
      const pct = ((parseInt(fase.duracaoSemanas) || 1) / per.duracaoTotal);
      const w = Math.max(4, pct * barW);
      doc.setFontSize(6);
      doc.setTextColor(...cor);
      if (w > 8) doc.text(fase.nome?.substring(0, Math.floor(w / 2)), lx + w / 2, y + 2, { align: 'center' });
      lx += w;
    });
    y += 8;
  }

  // Detalhes por fase
  y = sectionTitle(doc, 'Detalhes das Fases', y, YELLOW);

  let semAtual = 1;
  (per.fases || []).forEach((fase, fi) => {
    if (y > 260) { doc.addPage(); setupPage(doc); y = 20; }

    const FASE_CORES = {
      'Adaptação': BLUE, 'Hipertrofia': [244, 114, 182], 'Força': ACCENT,
      'Potência': YELLOW, 'Pico': RED, 'Recuperação': GREEN, 'Manutenção': PURPLE,
    };
    const cor = FASE_CORES[fase.nome] || GRAY;
    const endWeek = semAtual + parseInt(fase.duracaoSemanas || 1) - 1;

    doc.setFillColor(cor[0], cor[1], cor[2]);
    doc.circle(17, y - 1.5, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...cor);
    doc.text(`${fase.nome}`, 21, y);
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(`S${semAtual}–S${endWeek} • ${fase.duracaoSemanas} semanas`, 100, y);
    if (fase.tpmAjuste) doc.text('🌙 TPM', 170, y);
    y += 5;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...WHITE);
    const infoFase = [
      `Intensidade: ${fase.intensidade || '—'}`,
      `Volume: ${fase.volume || '—'}`,
    ].join('    ');
    doc.text(infoFase, 21, y);
    y += 4;

    const treino = planosTreino.find(t => t.id === fase.treinoId);
    if (treino) {
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(`Treino: ${treino.nome}`, 21, y);
      y += 4;
    }
    if (fase.objetivo) {
      doc.setFontSize(7);
      doc.setTextColor(150, 170, 190);
      const lines = doc.splitTextToSize(`🎯 ${fase.objetivo}`, 160);
      doc.text(lines, 21, y);
      y += lines.length * 3.5 + 1;
    }
    semAtual += parseInt(fase.duracaoSemanas || 1);
    y += 3;
  });

  if (per.observacoes) {
    if (y > 260) { doc.addPage(); setupPage(doc); y = 20; }
    y = sectionTitle(doc, 'Observações do Professor', y, GRAY);
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    const lines = doc.splitTextToSize(per.observacoes, 180);
    doc.text(lines, 14, y);
  }

  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('FitPro — Sistema de Gestão Fitness', 105, 290, { align: 'center' });

  doc.save(`periodizacao_${aluno?.nome?.replace(/\s/g, '_')}_${per.nome?.replace(/\s/g, '_')}.pdf`);
}