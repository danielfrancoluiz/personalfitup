import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Trash2, ChevronRight, Moon, Sparkles, Loader2, Edit2, Download } from 'lucide-react';
import { gerarPDFPeriodizacao } from '../../lib/fitpro-pdf';
import { motion } from 'framer-motion';
import { useApp, useAuth } from '../../context/FitProContext';
import { getCredentials, generateId } from '../../lib/fitpro-storage';
import PeriodizacaoChart from '../../components/fitpro/PeriodizacaoChart';
import FormField, { formInputClass, formInputStyle, formRow3Class } from '../../components/fitpro/FormField';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

const TIPOS = ['Linear', 'Ondulatório', 'Bloco', 'Conjugado', 'Reverso'];
const FASES = ['Adaptação', 'Hipertrofia', 'Força', 'Potência', 'Pico', 'Recuperação', 'Manutenção'];
const CORES_FASE = {
  'Adaptação': '#60a5fa', 'Hipertrofia': '#f472b6', 'Força': '#fb923c',
  'Potência': '#fbbf24', 'Pico': '#ef4444', 'Recuperação': '#34d399', 'Manutenção': '#a78bfa',
};

function emptyPeriodizacao() {
  return {
    nome: '', alunoId: '', tipo: 'Linear', objetivo: '', dataInicio: new Date().toISOString().split('T')[0],
    duracaoTotal: 12, fases: [], observacoes: '',
    tpmAtivo: false, tpmDiaInicio: 21, tpmDuracao: 7, cicloDias: 28,
  };
}

// Retorna os números das semanas (1-based) que contêm o período de TPM dentro de um ciclo
// cicloDias: duração do ciclo (ex: 28), tpmDiaInicio: dia do ciclo em que começa a TPM (ex: 21), tpmDuracao: duração em dias (ex: 7)
function calcularSemanasTpm(totalSemanas, dataInicio, cicloDias, tpmDiaInicio, tpmDuracao) {
  const semanasTpm = new Set();
  if (!dataInicio) return semanasTpm;
  const inicio = new Date(dataInicio);
  for (let semana = 1; semana <= totalSemanas; semana++) {
    const diaInicioSemana = (semana - 1) * 7; // dias desde o início
    for (let d = 0; d < 7; d++) {
      const diaAbsoluto = diaInicioSemana + d;
      const diaNoFase = (diaAbsoluto % cicloDias) + 1; // dia dentro do ciclo (1-based)
      if (diaNoFase >= tpmDiaInicio && diaNoFase < tpmDiaInicio + tpmDuracao) {
        semanasTpm.add(semana);
      }
    }
  }
  return semanasTpm;
}

const FASES_FORCA = ['Força', 'Potência', 'Pico'];

export default function PeriodizacaoView() {
  const { periodizacoes, alunos, planosTreino, addPeriodizacao, updatePeriodizacao, deletePeriodizacao } = useApp();
  const { user } = useAuth();

  const [professorId, setProfessorId] = useState('');
  useEffect(() => {
    getCredentials().then(creds => {
      const myCred = creds.find(c => c.id === user?.id);
      setProfessorId(myCred?.linkedId || '');
    });
  }, [user?.id]);

  const alunosFiltrados = user?.role === 'professor' ? alunos.filter(a => professorId && a.professorId === professorId) : alunos;
  const periodizacoesFiltradas = user?.role === 'professor'
    ? periodizacoes.filter(p => alunosFiltrados.some(a => a.id === p.alunoId))
    : periodizacoes;

  const [alunoFilter, setAlunoFilter] = useState('');
  const exibidas = alunoFilter ? periodizacoesFiltradas.filter(p => p.alunoId === alunoFilter) : periodizacoesFiltradas;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyPeriodizacao());
  const [editId, setEditId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [selectedPer, setSelectedPer] = useState(null);
  const [gerando, setGerando] = useState(false);

  const addFase = () => {
    setForm(f => ({
      ...f,
      fases: [...f.fases, { id: generateId(), nome: 'Hipertrofia', duracaoSemanas: 4, intensidade: 'Moderada', volume: 'Alto', objetivo: '', treinoId: '', observacoes: '' }]
    }));
  };

  const removeFase = (id) => setForm(f => ({ ...f, fases: f.fases.filter(fa => fa.id !== id) }));

  const updateFase = (id, field, value) => setForm(f => ({
    ...f, fases: f.fases.map(fa => fa.id === id ? { ...fa, [field]: value } : fa)
  }));

  const gerarFasesAutomaticas = () => {
    if (!form.alunoId) return alert('Selecione um aluno primeiro');
    if (!form.duracaoTotal || form.duracaoTotal < 4) return alert('Informe uma duração mínima de 4 semanas');

    const aluno = alunos.find(a => a.id === form.alunoId);
    const nivel = aluno?.nivel || 'Intermediário';
    const objetivo = (form.objetivo || '').toLowerCase();
    const total = parseInt(form.duracaoTotal) || 12;
    const tipo = form.tipo;

    setGerando(true);

    setTimeout(() => {
      let fases = [];

      // Detecta objetivo por palavras-chave
      const isEmagrecer = objetivo.includes('emagrec') || objetivo.includes('gordura') || objetivo.includes('peso') || objetivo.includes('defin');
      const isForca = objetivo.includes('força') || objetivo.includes('force') || objetivo.includes('potên');
      const isResistencia = objetivo.includes('resistên') || objetivo.includes('condicion') || objetivo.includes('cardio');

      if (tipo === 'Linear') {
        if (isEmagrecer) {
          fases = [
            { nome: 'Adaptação', dur: Math.round(total * 0.17), int: 'Baixa', vol: 'Moderado', obj: 'Adaptar o corpo ao treinamento' },
            { nome: 'Hipertrofia', dur: Math.round(total * 0.33), int: 'Moderada', vol: 'Alto', obj: 'Aumentar metabolismo basal com hipertrofia' },
            { nome: 'Força', dur: Math.round(total * 0.25), int: 'Alta', vol: 'Moderado', obj: 'Aumentar força e preservar massa magra' },
            { nome: 'Manutenção', dur: Math.round(total * 0.17), int: 'Moderada', vol: 'Moderado', obj: 'Consolidar resultados' },
            { nome: 'Recuperação', dur: Math.max(1, total - Math.round(total * 0.92)), int: 'Baixa', vol: 'Baixo', obj: 'Recuperação ativa' },
          ];
        } else if (isForca) {
          fases = [
            { nome: 'Adaptação', dur: Math.round(total * 0.15), int: 'Baixa', vol: 'Moderado', obj: 'Adaptar tendões e articulações' },
            { nome: 'Hipertrofia', dur: Math.round(total * 0.25), int: 'Moderada', vol: 'Alto', obj: 'Base muscular para força' },
            { nome: 'Força', dur: Math.round(total * 0.30), int: 'Alta', vol: 'Moderado', obj: 'Desenvolver força máxima' },
            { nome: 'Potência', dur: Math.round(total * 0.20), int: 'Máxima', vol: 'Baixo', obj: 'Explosão e potência' },
            { nome: 'Pico', dur: Math.round(total * 0.08), int: 'Máxima', vol: 'Baixo', obj: 'Pico de performance' },
            { nome: 'Recuperação', dur: Math.max(1, total - Math.round(total * 0.98)), int: 'Baixa', vol: 'Baixo', obj: 'Descanso ativo' },
          ];
        } else if (isResistencia) {
          fases = [
            { nome: 'Adaptação', dur: Math.round(total * 0.20), int: 'Baixa', vol: 'Moderado', obj: 'Adaptação aeróbica' },
            { nome: 'Hipertrofia', dur: Math.round(total * 0.25), int: 'Moderada', vol: 'Alto', obj: 'Base de resistência muscular' },
            { nome: 'Força', dur: Math.round(total * 0.25), int: 'Alta', vol: 'Moderado', obj: 'Resistência de força' },
            { nome: 'Manutenção', dur: Math.round(total * 0.20), int: 'Moderada', vol: 'Moderado', obj: 'Manutenção do condicionamento' },
            { nome: 'Recuperação', dur: Math.max(1, total - Math.round(total * 0.90)), int: 'Baixa', vol: 'Baixo', obj: 'Recuperação' },
          ];
        } else {
          // Hipertrofia padrão
          fases = [
            { nome: 'Adaptação', dur: Math.round(total * 0.17), int: 'Baixa', vol: 'Moderado', obj: 'Adaptar o organismo' },
            { nome: 'Hipertrofia', dur: Math.round(total * 0.42), int: 'Moderada', vol: 'Alto', obj: 'Foco principal em ganho de massa' },
            { nome: 'Força', dur: Math.round(total * 0.25), int: 'Alta', vol: 'Moderado', obj: 'Consolidar ganhos de força' },
            { nome: 'Recuperação', dur: Math.max(1, total - Math.round(total * 0.84)), int: 'Baixa', vol: 'Baixo', obj: 'Recuperação e descanso ativo' },
          ];
        }
      } else if (tipo === 'Ondulatório') {
        // Ciclos ondulantes curtos
        const ciclo = Math.round(total / 3);
        fases = [
          { nome: 'Hipertrofia', dur: ciclo, int: 'Moderada', vol: 'Alto', obj: 'Semanas de volume alto' },
          { nome: 'Força', dur: ciclo, int: 'Alta', vol: 'Moderado', obj: 'Semanas de intensidade alta' },
          { nome: 'Recuperação', dur: Math.max(1, total - ciclo * 2), int: 'Baixa', vol: 'Baixo', obj: 'Deload e recuperação' },
        ];
        if (total >= 12) {
          fases = [
            { nome: 'Adaptação', dur: Math.round(total * 0.15), int: 'Baixa', vol: 'Moderado', obj: 'Base inicial' },
            { nome: 'Hipertrofia', dur: Math.round(total * 0.28), int: 'Moderada', vol: 'Alto', obj: 'Volume alto — ondulação 1' },
            { nome: 'Força', dur: Math.round(total * 0.22), int: 'Alta', vol: 'Moderado', obj: 'Intensidade alta — ondulação 2' },
            { nome: 'Hipertrofia', dur: Math.round(total * 0.22), int: 'Moderada', vol: 'Muito Alto', obj: 'Volume máximo — ondulação 3' },
            { nome: 'Recuperação', dur: Math.max(1, total - Math.round(total * 0.87)), int: 'Baixa', vol: 'Baixo', obj: 'Deload final' },
          ];
        }
      } else if (tipo === 'Bloco') {
        fases = [
          { nome: 'Adaptação', dur: Math.round(total * 0.20), int: 'Baixa', vol: 'Alto', obj: 'Bloco acumulação — volume base' },
          { nome: 'Hipertrofia', dur: Math.round(total * 0.25), int: 'Moderada', vol: 'Alto', obj: 'Bloco de transformação — hipertrofia' },
          { nome: 'Força', dur: Math.round(total * 0.25), int: 'Alta', vol: 'Moderado', obj: 'Bloco de realização — força' },
          { nome: 'Potência', dur: Math.round(total * 0.17), int: 'Máxima', vol: 'Baixo', obj: 'Bloco de pico — potência' },
          { nome: 'Recuperação', dur: Math.max(1, total - Math.round(total * 0.87)), int: 'Baixa', vol: 'Baixo', obj: 'Deload' },
        ];
      } else if (tipo === 'Conjugado') {
        const bloco = Math.round(total / 4);
        fases = [
          { nome: 'Adaptação', dur: bloco, int: 'Moderada', vol: 'Alto', obj: 'Máximo esforço + esforço dinâmico' },
          { nome: 'Força', dur: bloco, int: 'Alta', vol: 'Moderado', obj: 'Força máxima conjugada' },
          { nome: 'Potência', dur: bloco, int: 'Máxima', vol: 'Moderado', obj: 'Velocidade e explosão conjugada' },
          { nome: 'Recuperação', dur: Math.max(1, total - bloco * 3), int: 'Baixa', vol: 'Baixo', obj: 'Recuperação ativa' },
        ];
      } else if (tipo === 'Reverso') {
        fases = [
          { nome: 'Pico', dur: Math.round(total * 0.15), int: 'Máxima', vol: 'Baixo', obj: 'Alta intensidade inicial' },
          { nome: 'Potência', dur: Math.round(total * 0.20), int: 'Alta', vol: 'Moderado', obj: 'Reduzir intensidade gradualmente' },
          { nome: 'Força', dur: Math.round(total * 0.25), int: 'Alta', vol: 'Moderado', obj: 'Consolidar força' },
          { nome: 'Hipertrofia', dur: Math.round(total * 0.25), int: 'Moderada', vol: 'Alto', obj: 'Fase de volume final' },
          { nome: 'Recuperação', dur: Math.max(1, total - Math.round(total * 0.85)), int: 'Baixa', vol: 'Baixo', obj: 'Deload final' },
        ];
      } else {
        // Fallback genérico
        fases = [
          { nome: 'Adaptação', dur: Math.round(total * 0.20), int: 'Baixa', vol: 'Moderado', obj: '' },
          { nome: 'Hipertrofia', dur: Math.round(total * 0.40), int: 'Moderada', vol: 'Alto', obj: '' },
          { nome: 'Força', dur: Math.round(total * 0.25), int: 'Alta', vol: 'Moderado', obj: '' },
          { nome: 'Recuperação', dur: Math.max(1, total - Math.round(total * 0.85)), int: 'Baixa', vol: 'Baixo', obj: '' },
        ];
      }

      // Garante que a soma das semanas = duracaoTotal (ajusta última fase)
      const somaAtual = fases.reduce((acc, f) => acc + f.dur, 0);
      if (somaAtual !== total && fases.length > 0) {
        fases[fases.length - 1].dur = Math.max(1, fases[fases.length - 1].dur + (total - somaAtual));
      }

      // Converte para o formato do form
      const fasesFormatadas = fases
        .filter(f => f.dur > 0)
        .map(f => ({
          id: generateId(),
          nome: f.nome,
          duracaoSemanas: f.dur,
          intensidade: f.int,
          volume: f.vol,
          objetivo: f.obj,
          treinoId: '',
          observacoes: '',
        }));

      setForm(prev => ({
        ...prev,
        fases: fasesFormatadas,
        nome: prev.nome || `Periodização ${tipo} — ${total} semanas`,
      }));

      setGerando(false);
    }, 600);
  };

  const handleSave = () => {
    if (!form.nome.trim()) return alert('Nome é obrigatório');
    if (!form.alunoId) return alert('Selecione um aluno');
    const semanas = form.fases.reduce((acc, f) => acc + (parseInt(f.duracaoSemanas) || 0), 0) || parseInt(form.duracaoTotal) || 1;

    // Aplica ajuste automático de TPM: semanas com TPM e fase de Força → Recuperação
    let fasesAjustadas = form.fases;
    const alunoSelecionado = alunos.find(a => a.id === form.alunoId);
    const isFeminino = alunoSelecionado?.sexo === 'F';

    if (form.tpmAtivo && isFeminino && form.fases.length > 0) {
      const totalSemanas = semanas;
      let semanaAtual = 1;
      const faseComSemanas = form.fases.map(f => {
        const start = semanaAtual;
        semanaAtual += parseInt(f.duracaoSemanas) || 1;
        return { ...f, _startWeek: start, _endWeek: semanaAtual - 1 };
      });
      const semanasTpm = calcularSemanasTpm(
        totalSemanas, form.dataInicio,
        parseInt(form.cicloDias) || 28,
        parseInt(form.tpmDiaInicio) || 21,
        parseInt(form.tpmDuracao) || 7
      );
      fasesAjustadas = faseComSemanas.map(f => {
        const { _startWeek, _endWeek, ...fase } = f;
        // Se TODAS as semanas da fase estão na janela TPM e é fase de força → Recuperação
        let dentroTpm = false;
        for (let s = _startWeek; s <= _endWeek; s++) {
          if (semanasTpm.has(s)) { dentroTpm = true; break; }
        }
        if (dentroTpm && FASES_FORCA.includes(fase.nome)) {
          return { ...fase, nome: 'Recuperação', intensidade: 'Baixa', volume: 'Baixo', tpmAjuste: true, observacoes: (fase.observacoes ? fase.observacoes + ' | ' : '') + '🌙 Ajustado automaticamente pelo período de TPM' };
        }
        return { ...fase, tpmAjuste: false };
      });
    }

    const data = { ...form, duracaoTotal: semanas, fases: fasesAjustadas };
    if (editId) updatePeriodizacao(editId, data);
    else addPeriodizacao(data);
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setEditId(null); setForm(emptyPeriodizacao()); }, 1200);
  };

  if (selectedPer) {
    const per = periodizacoes.find(p => p.id === selectedPer.id) || selectedPer;
    const aluno = alunos.find(a => a.id === per.alunoId);
    const dataFim = per.dataInicio ? new Date(new Date(per.dataInicio).getTime() + per.duracaoTotal * 7 * 24 * 60 * 60 * 1000) : null;

    // Build timeline
    let _s = 1;
    const timeline = (per.fases || []).map(fase => {
      const start = _s;
      _s += parseInt(fase.duracaoSemanas) || 1;
      return { ...fase, startWeek: start, endWeek: _s - 1 };
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedPer(null)} className="p-2 rounded-xl hover:bg-white/5">
            <ChevronRight size={18} color="#9ca3af" className="rotate-180" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{per.nome}</h2>
            <p className="text-xs text-slate-500">{aluno?.nome} • {per.tipo} • {per.duracaoTotal} semanas</p>
          </div>
          <button onClick={() => gerarPDFPeriodizacao(per, aluno, planosTreino)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: '#34d39920', color: '#34d399', border: '1px solid #34d39930' }}>
            <Download size={13} />PDF
          </button>
          {user?.role !== 'admin' && (
            <button
              onClick={() => {
                setForm({ ...per, fases: per.fases || [] });
                setEditId(per.id);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: '#fbbf2420', color: '#fbbf24', border: '1px solid #fbbf2430' }}>
              <Edit2 size={13} />Editar
            </button>
          )}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Tipo', value: per.tipo, color: '#60a5fa' },
            { label: 'Duração', value: `${per.duracaoTotal} semanas`, color: '#fbbf24' },
            { label: 'Fases', value: per.fases?.length || 0, color: '#a78bfa' },
            { label: 'Início', value: per.dataInicio ? new Date(per.dataInicio).toLocaleDateString('pt-BR') : '—', color: '#34d399' },
          ].map((k, i) => (
            <div key={i} className="p-3 rounded-xl text-center" style={{ background: `${k.color}10`, border: `1px solid ${k.color}25` }}>
              <div className="text-sm font-bold" style={{ color: k.color }}>{k.value}</div>
              <div className="text-xs text-slate-500">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Gráfico completo */}
        {timeline.length > 0 && (
          <div className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <PeriodizacaoChart periodizacao={per} planosTreino={planosTreino} />
          </div>
        )}

        {/* Detalhe por fase */}
        {timeline.length > 0 && (
          <div className="p-5 rounded-2xl space-y-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h3 className="font-semibold text-white text-sm">Detalhes por Fase</h3>
            {timeline.map((fase) => {
              const cor = CORES_FASE[fase.nome] || '#64748b';
              const treino = planosTreino.find(t => t.id === fase.treinoId);
              return (
                <div key={fase.id} className="p-3 rounded-xl" style={{ background: `${cor}08`, border: `1px solid ${cor}20` }}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cor }} />
                    <span className="text-sm font-semibold text-white">{fase.nome}</span>
                    <span className="text-xs text-slate-500">S{fase.startWeek}–S{fase.endWeek} ({fase.duracaoSemanas} sem)</span>
                    {fase.tpmAjuste && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: '#f472b615', color: '#f472b6', border: '1px solid #f472b625' }}>
                        <Moon size={10} />TPM
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap text-xs mt-1">
                    <span style={{ color: cor }}>Intensidade: {fase.intensidade}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">Volume: {fase.volume}</span>
                    {treino && <><span className="text-slate-500">•</span><span className="text-slate-400">Treino: {treino.nome}</span></>}
                  </div>
                  {fase.objetivo && <p className="text-xs text-slate-500 mt-1">🎯 {fase.objetivo}</p>}
                  {fase.observacoes && <p className="text-xs text-slate-600 mt-0.5">📝 {fase.observacoes}</p>}
                </div>
              );
            })}
          </div>
        )}

        {per.observacoes && (
          <div className="p-4 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Observações Gerais</h4>
            <p className="text-sm text-slate-300">{per.observacoes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Calendar size={20} color="#fbbf24" />Periodização</h2>
          <p className="text-xs text-slate-500">{exibidas.length} periodização(ões)</p>
        </div>
        {user?.role !== 'admin' && (
          <button onClick={() => { setForm({ ...emptyPeriodizacao(), alunoId: alunosFiltrados[0]?.id || '' }); setEditId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: '#fbbf2420', color: '#fbbf24', border: '1px solid #fbbf2430' }}>
            <Plus size={14} />Nova Periodização
          </button>
        )}
      </div>

      {alunosFiltrados.length > 0 && (
        <select value={alunoFilter} onChange={e => setAlunoFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm text-white outline-none"
          style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="">Todos os alunos</option>
          {alunosFiltrados.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
      )}

      {exibidas.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhuma periodização criada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {exibidas.map((per, i) => {
            const aluno = alunos.find(a => a.id === per.alunoId);
            const colors = ['#fbbf24', '#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fb923c'];
            const color = colors[i % 6];
            return (
              <motion.div key={per.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white">{per.nome}</h3>
                    <p className="text-xs text-slate-500">{aluno?.nome} • {per.tipo}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                    {per.duracaoTotal} sem
                  </span>
                </div>
                {/* Mini timeline */}
                {(per.fases || []).length > 0 && (
                  <div className="flex gap-1 mb-3 overflow-hidden rounded-lg h-5">
                    {(per.fases || []).map(fase => {
                      const cor = CORES_FASE[fase.nome] || '#64748b';
                      const pct = ((parseInt(fase.duracaoSemanas) || 1) / per.duracaoTotal) * 100;
                      return (
                        <div key={fase.id} className="h-full rounded-sm" title={`${fase.nome} (${fase.duracaoSemanas}sem)`}
                          style={{ width: `${pct}%`, minWidth: 6, background: cor }} />
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {per.fases?.length || 0} fases
                  </span>
                  {per.dataInicio && (
                    <span className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      Início: {new Date(per.dataInicio).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedPer(per)} className="flex-1 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
                    Ver Timeline
                  </button>
                  <button onClick={() => { const a = alunos.find(x => x.id === per.alunoId); gerarPDFPeriodizacao(per, a, planosTreino); }}
                    className="px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-all" title="Baixar PDF" style={{ color: '#34d399' }}>
                    <Download size={14} />
                  </button>
                  {user?.role !== 'admin' && (
                    <>
                      <button
                        onClick={() => { setForm({ ...per, fases: per.fases || [] }); setEditId(per.id); setShowForm(true); }}
                        className="px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-all" style={{ color: '#fbbf24' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => { if (confirm('Excluir esta periodização?')) deletePeriodizacao(per.id); }}
                        className="px-3 py-2 rounded-xl text-xs hover:bg-red-500/10" style={{ color: '#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 my-4" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{editId ? 'Editar Periodização' : 'Nova Periodização'}</h3>
              <button onClick={() => setShowForm(false)}><X size={18} color="#6b7280" /></button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Aluno</label>
                <select value={form.alunoId} onChange={e => setForm(f => ({ ...f, alunoId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="">Selecionar aluno</option>
                  {alunosFiltrados.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nome da Periodização</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Macrociclo Verão 2025" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div className={formRow3Class}>
                <FormField label="Tipo">
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    className={formInputClass} style={formInputStyle}>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Duração (semanas)">
                  <input type="number" min={4} max={52} value={form.duracaoTotal}
                    onChange={e => setForm(f => ({ ...f, duracaoTotal: parseInt(e.target.value) || 12 }))}
                    className={formInputClass} style={formInputStyle} />
                </FormField>
                <FormField label="Data de Início">
                  <input type="date" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))}
                    className={formInputClass} style={formInputStyle} />
                </FormField>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Objetivo</label>
                <input value={form.objetivo} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))}
                  placeholder="Ex: Aumentar massa magra e reduzir gordura" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>

              {/* TPM — só mostra se aluno for feminino */}
              {alunos.find(a => a.id === form.alunoId)?.sexo === 'F' && (
                <div className="rounded-xl p-4 space-y-3" style={{ background: '#f472b608', border: '1px solid #f472b625' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon size={15} color="#f472b6" />
                      <span className="text-sm font-semibold text-white">Período de TPM</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setForm(f => ({ ...f, tpmAtivo: !f.tpmAtivo }))}
                        className="relative w-9 h-5 rounded-full transition-all cursor-pointer"
                        style={{ background: form.tpmAtivo ? '#f472b6' : '#334155' }}>
                        <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                          style={{ left: form.tpmAtivo ? '18px' : '2px' }} />
                      </div>
                      <span className="text-xs text-slate-400">{form.tpmAtivo ? 'Ativo' : 'Inativo'}</span>
                    </label>
                  </div>
                  {form.tpmAtivo && (
                    <>
                      <p className="text-xs text-slate-400">As fases de <strong className="text-white">Força, Potência e Pico</strong> que coincidirem com o período de TPM serão automaticamente ajustadas para <strong className="text-white">Recuperação</strong> (intensidade e volume baixos).</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Duração do ciclo (dias)</label>
                          <input type="number" value={form.cicloDias} min={20} max={45}
                            onChange={e => setForm(f => ({ ...f, cicloDias: parseInt(e.target.value) || 28 }))}
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Início da TPM (dia do ciclo)</label>
                          <input type="number" value={form.tpmDiaInicio} min={1} max={35}
                            onChange={e => setForm(f => ({ ...f, tpmDiaInicio: parseInt(e.target.value) || 21 }))}
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Duração da TPM (dias)</label>
                          <input type="number" value={form.tpmDuracao} min={1} max={14}
                            onChange={e => setForm(f => ({ ...f, tpmDuracao: parseInt(e.target.value) || 7 }))}
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Botão Gerar Periodização Automática */}
            <div className="rounded-xl p-4" style={{ background: '#a78bfa08', border: '1px solid #a78bfa25' }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#a78bfa20' }}>
                  <Sparkles size={15} color="#a78bfa" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white mb-0.5">Gerar Periodização Automaticamente</div>
                  <div className="text-xs text-slate-400 mb-3">
                    Com base no <strong className="text-white">tipo</strong>, <strong className="text-white">objetivo</strong> e <strong className="text-white">duração</strong> informados acima, o sistema monta as fases ideais para o aluno.
                  </div>
                  <button
                    onClick={gerarFasesAutomaticas}
                    disabled={gerando}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff' }}>
                    {gerando ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {gerando ? 'Gerando...' : 'Gerar Periodização'}
                  </button>
                </div>
              </div>
            </div>

            {/* Fases */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white text-sm">Fases da Periodização</h4>
                <button onClick={addFase} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: '#fbbf2420', color: '#fbbf24', border: '1px solid #fbbf2430' }}>
                  <Plus size={12} />Adicionar Fase
                </button>
              </div>
              <div className="space-y-3">
                {form.fases.map((fase, fi) => {
                  const cor = CORES_FASE[fase.nome] || '#64748b';
                  return (
                    <div key={fase.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${cor}30` }}>
                      <div className="flex items-center gap-2 p-3" style={{ background: `${cor}10` }}>
                        <span className="text-xs font-bold" style={{ color: cor }}>Fase {fi + 1}</span>
                        <select value={fase.nome} onChange={e => updateFase(fase.id, 'nome', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg text-xs text-white outline-none"
                          style={{ background: 'rgba(0,0,0,0.3)' }}>
                          {FASES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <button onClick={() => removeFase(fase.id)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                      </div>
                      <div className="p-3 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Duração (semanas)</label>
                          <input type="number" value={fase.duracaoSemanas} onChange={e => updateFase(fase.id, 'duracaoSemanas', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Intensidade</label>
                          <select value={fase.intensidade} onChange={e => updateFase(fase.id, 'intensidade', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {['Baixa', 'Moderada', 'Alta', 'Máxima'].map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Volume</label>
                          <select value={fase.volume} onChange={e => updateFase(fase.id, 'volume', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {['Baixo', 'Moderado', 'Alto', 'Muito Alto'].map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Treino vinculado</label>
                          <select value={fase.treinoId} onChange={e => updateFase(fase.id, 'treinoId', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <option value="">Nenhum</option>
                            {planosTreino.filter(t => t.alunoId === form.alunoId).map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-slate-500 block mb-1">Objetivo da fase</label>
                          <input value={fase.objetivo} onChange={e => updateFase(fase.id, 'objetivo', e.target.value)}
                            placeholder="Ex: Aumentar volume de treino" className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {form.fases.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Adicione fases para estruturar a periodização</p>}
              </div>
            </div>

            <button onClick={handleSave} className="w-full py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #fbbf24, #d97706)' }}>
              {saved ? '✓ Salvo!' : 'Salvar Periodização'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}