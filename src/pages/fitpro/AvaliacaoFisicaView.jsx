import React, { useState, useEffect } from 'react';
import { Activity, Save, ChevronDown, ChevronUp, Trash2, Plus, X, Edit2, Download } from 'lucide-react';
import { gerarPDFAvaliacao } from '../../lib/fitpro-pdf';
import { useApp, useAuth } from '../../context/FitProContext';
import { getCredentials } from '../../lib/fitpro-storage';
import {
  calcularDensidadeCorporal, calcularPercentualGordura, calcularIMC, classificarIMC,
  classificarGordura, calcularIdade, calcularTMB, calcularGEB, getCorClassificacao
} from '../../lib/fitpro-calculations';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

const emptyDobras = { peito: '', axilarMedia: '', triceps: '', subescapular: '', abdomen: '', 'suprailíaca': '', coxa: '', panturrilha: '', biceps: '' };
const emptyCircs = { circCintura: '', circQuadril: '', circBracoDireito: '', circBracoEsquerdo: '', circCoxaDireita: '', circCoxaEsquerda: '' };
const emptyVitais = { pressaoArterial: '', freqCardiacaRepouso: '', nivelAtividade: 'moderado' };

// Extrai os campos de dobras/circs/vitais de uma avaliação existente
function fromAvaliacao(av) {
  const dobras = {};
  ['peito','axilarMedia','triceps','subescapular','abdomen','suprailíaca','coxa','panturrilha','biceps'].forEach(k => {
    dobras[k] = av[k] != null ? String(av[k]) : '';
  });
  const circs = {};
  ['circCintura','circQuadril','circBracoDireito','circBracoEsquerdo','circCoxaDireita','circCoxaEsquerda'].forEach(k => {
    circs[k] = av[k] != null ? String(av[k]) : '';
  });
  const vitais = {
    pressaoArterial: av.pressaoArterial || '',
    freqCardiacaRepouso: av.freqCardiacaRepouso != null ? String(av.freqCardiacaRepouso) : '',
    nivelAtividade: av.nivelAtividade || 'moderado',
  };
  return { dobras, circs, vitais };
}

// ── Formulário (Nova / Editar Avaliação) ────────────────────────────────────
function AvaliacaoForm({ alunos, professorId, userRole, addAvaliacao, updateAvaliacao, avaliacoes, editAvaliacao, onClose }) {
  const isEdit = !!editAvaliacao;
  const extracted = isEdit ? fromAvaliacao(editAvaliacao) : null;

  const [alunoId, setAlunoId] = useState(isEdit ? editAvaliacao.alunoId : '');
  const [protocolo, setProtocolo] = useState('7');
  const [activeSection, setActiveSection] = useState('dobras');
  const [dobras, setDobras] = useState(isEdit ? extracted.dobras : emptyDobras);
  const [circs, setCircs] = useState(isEdit ? extracted.circs : emptyCircs);
  const [vitais, setVitais] = useState(isEdit ? extracted.vitais : emptyVitais);
  const [observacoes, setObservacoes] = useState(isEdit ? editAvaliacao.observacoes || '' : '');
  const [saved, setSaved] = useState(false);

  const alunosFiltrados = userRole === 'professor' ? alunos.filter(a => a.professorId === professorId) : alunos;
  const aluno = alunos.find(a => a.id === alunoId);
  const historico = avaliacoes.filter(a => a.alunoId === alunoId).sort((a, b) => new Date(a.data) - new Date(b.data));

  const calcular = () => {
    if (!aluno) return null;
    const idade = calcularIdade(aluno.dataNascimento);
    let soma = 0;
    if (protocolo === '7') {
      soma = ['peito', 'axilarMedia', 'triceps', 'subescapular', 'abdomen', 'suprailíaca', 'coxa'].reduce((acc, k) => acc + (parseFloat(dobras[k]) || 0), 0);
    } else {
      if (aluno.sexo === 'M') soma = ['peito', 'abdomen', 'coxa'].reduce((acc, k) => acc + (parseFloat(dobras[k]) || 0), 0);
      else soma = ['triceps', 'suprailíaca', 'coxa'].reduce((acc, k) => acc + (parseFloat(dobras[k]) || 0), 0);
    }
    const densidade = calcularDensidadeCorporal(aluno.sexo, soma, idade, protocolo);
    const percGordura = Math.max(0, calcularPercentualGordura(densidade));
    const massaGorda = (percGordura / 100) * aluno.peso;
    const massaMagra = aluno.peso - massaGorda;
    const imc = calcularIMC(aluno.peso, aluno.altura);
    const tmb = calcularTMB(aluno.peso, aluno.altura, idade, aluno.sexo);
    const geb = calcularGEB(tmb, vitais.nivelAtividade);
    const rcq = circs.circCintura && circs.circQuadril ? parseFloat(circs.circCintura) / parseFloat(circs.circQuadril) : undefined;
    return {
      somaDobras: soma, densidadeCorporal: densidade, percentualGordura: percGordura,
      massaGorda, massaMagra, imc, classificacaoIMC: classificarIMC(imc),
      classificacaoGordura: classificarGordura(percGordura, aluno.sexo, idade),
      relacaoCinturaQuadril: rcq, tmb, geb, idade
    };
  };

  const resultados = aluno ? calcular() : null;

  const handleSave = () => {
    if (!aluno || !resultados) return alert('Selecione um aluno e preencha as dobras');
    const data = {
      alunoId,
      data: isEdit ? editAvaliacao.data : new Date().toISOString().split('T')[0],
      idade: resultados.idade, peso: aluno.peso, altura: aluno.altura,
      ...Object.fromEntries(Object.entries(dobras).map(([k, v]) => [k, parseFloat(v) || undefined])),
      ...Object.fromEntries(Object.entries(circs).map(([k, v]) => [k, parseFloat(v) || undefined])),
      pressaoArterial: vitais.pressaoArterial,
      freqCardiacaRepouso: parseFloat(vitais.freqCardiacaRepouso) || undefined,
      somaDobras: resultados.somaDobras, densidadeCorporal: resultados.densidadeCorporal,
      percentualGordura: resultados.percentualGordura, massaGorda: resultados.massaGorda,
      massaMagra: resultados.massaMagra, imc: resultados.imc,
      classificacaoIMC: resultados.classificacaoIMC, classificacaoGordura: resultados.classificacaoGordura,
      relacaoCinturaQuadril: resultados.relacaoCinturaQuadril, observacoes
    };
    if (isEdit) {
      updateAvaliacao(editAvaliacao.id, data);
    } else {
      addAvaliacao(data);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1500);
  };

  const chartData = historico.map(av => ({
    data: new Date(av.data).toLocaleDateString('pt-BR', { month: 'short', day: '2-digit' }),
    gordura: av.percentualGordura?.toFixed(1),
    peso: av.peso
  }));

  const sections = [
    { id: 'dobras', label: 'Dobras Cutâneas' },
    { id: 'circunferencias', label: 'Circunferências' },
    { id: 'vitais', label: 'Sinais Vitais' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-2xl rounded-2xl p-6 my-4 space-y-4" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              <Activity size={18} color="#fb923c" />
              {isEdit ? 'Editar Avaliação Física' : 'Nova Avaliação Física'}
            </h3>
            <p className="text-xs text-slate-500">Protocolo Jackson & Pollock</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X size={18} color="#6b7280" /></button>
        </div>

        {/* Seleção aluno + protocolo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Aluno</label>
            <select value={alunoId} onChange={e => setAlunoId(e.target.value)}
              disabled={isEdit}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none disabled:opacity-60"
              style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
              <option value="">Selecione o aluno...</option>
              {alunosFiltrados.map(a => <option key={a.id} value={a.id}>{a.nome} ({a.sexo === 'M' ? 'Masc' : 'Fem'}{a.dataNascimento ? `, ${calcularIdade(a.dataNascimento)} anos` : ''})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Protocolo</label>
            <select value={protocolo} onChange={e => setProtocolo(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
              <option value="7">7 Dobras (Jackson & Pollock)</option>
              <option value="3">3 Dobras (Jackson & Pollock)</option>
            </select>
          </div>
        </div>
        {aluno && (
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#a78bfa15', color: '#a78bfa' }}>{aluno.nome}</span>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>{aluno.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>{aluno.peso}kg / {aluno.altura}cm</span>
          </div>
        )}

        {/* Seções colapsáveis */}
        {sections.map(section => (
          <div key={section.id} className="rounded-2xl overflow-hidden" style={{ background: '#0a0e1a', border: `1px solid ${BORDER}` }}>
            <button onClick={() => setActiveSection(activeSection === section.id ? '' : section.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5">
              <h3 className="font-semibold text-white text-sm">{section.label}</h3>
              {activeSection === section.id ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
            </button>
            {activeSection === section.id && (
              <div className="px-4 pb-4">
                {section.id === 'dobras' && (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {(protocolo === '7'
                      ? ['peito', 'axilarMedia', 'triceps', 'subescapular', 'abdomen', 'suprailíaca', 'coxa']
                      : aluno?.sexo === 'M' ? ['peito', 'abdomen', 'coxa'] : ['triceps', 'suprailíaca', 'coxa']
                    ).map(campo => (
                      <div key={campo}>
                        <label className="text-xs text-slate-400 block mb-1">
                          {campo === 'suprailíaca' ? 'Suprailíaca' : campo === 'axilarMedia' ? 'Axilar Média' : campo.charAt(0).toUpperCase() + campo.slice(1)} (mm)
                        </label>
                        <input type="number" value={dobras[campo]} onChange={e => setDobras(d => ({ ...d, [campo]: e.target.value }))} placeholder="0"
                          className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                    ))}
                  </div>
                )}
                {section.id === 'circunferencias' && (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { key: 'circCintura', label: 'Cintura (cm)' }, { key: 'circQuadril', label: 'Quadril (cm)' },
                      { key: 'circBracoDireito', label: 'Braço Direito (cm)' }, { key: 'circBracoEsquerdo', label: 'Braço Esquerdo (cm)' },
                      { key: 'circCoxaDireita', label: 'Coxa Direita (cm)' }, { key: 'circCoxaEsquerda', label: 'Coxa Esquerda (cm)' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                        <input type="number" value={circs[f.key]} onChange={e => setCircs(c => ({ ...c, [f.key]: e.target.value }))} placeholder="0"
                          className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                    ))}
                  </div>
                )}
                {section.id === 'vitais' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-slate-400 block mb-1">Pressão Arterial</label><input value={vitais.pressaoArterial} onChange={e => setVitais(v => ({ ...v, pressaoArterial: e.target.value }))} placeholder="120/80" className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} /></div>
                    <div><label className="text-xs text-slate-400 block mb-1">FC Repouso</label><input type="number" value={vitais.freqCardiacaRepouso} onChange={e => setVitais(v => ({ ...v, freqCardiacaRepouso: e.target.value }))} placeholder="65" className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} /></div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400 block mb-1">Nível de Atividade</label>
                      <select value={vitais.nivelAtividade} onChange={e => setVitais(v => ({ ...v, nivelAtividade: e.target.value }))} className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <option value="sedentario">Sedentário</option>
                        <option value="leve">Levemente Ativo</option>
                        <option value="moderado">Moderadamente Ativo</option>
                        <option value="ativo">Muito Ativo</option>
                        <option value="muitoAtivo">Extremamente Ativo</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Observações */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Observações</label>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} placeholder="Anotações clínicas, observações..."
            className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>

        {/* Resultados calculados */}
        {resultados && aluno && (
          <div className="p-4 rounded-2xl" style={{ background: '#fb923c08', border: '1px solid #fb923c20' }}>
            <h4 className="font-semibold text-white mb-3 text-sm">Resultados Calculados</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { label: '% Gordura', value: `${resultados.percentualGordura.toFixed(1)}%`, color: '#fb923c' },
                { label: 'Massa Magra', value: `${resultados.massaMagra.toFixed(1)}kg`, color: '#34d399' },
                { label: 'Massa Gorda', value: `${resultados.massaGorda.toFixed(1)}kg`, color: '#ef4444' },
                { label: 'IMC', value: resultados.imc.toFixed(1), color: '#60a5fa' },
                { label: 'Classif. Gordura', value: resultados.classificacaoGordura, color: getCorClassificacao(resultados.classificacaoGordura) },
                { label: 'Classif. IMC', value: resultados.classificacaoIMC, color: '#a78bfa' },
                { label: 'TMB', value: `${resultados.tmb.toFixed(0)} kcal`, color: '#fbbf24' },
                { label: 'Gasto Energético', value: `${resultados.geb.toFixed(0)} kcal`, color: '#60a5fa' },
              ].map((item, i) => (
                <div key={i} className="p-2 rounded-xl" style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                  <div className="text-sm font-bold truncate" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-xs text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão salvar */}
        <button onClick={handleSave} className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
          style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #fb923c, #ea580c)' }}>
          <Save size={16} />{saved ? (isEdit ? 'Avaliação Atualizada!' : 'Avaliação Salva!') : (isEdit ? 'Salvar Alterações' : 'Salvar Avaliação')}
        </button>

        {/* Mini histórico */}
        {historico.length > 0 && !isEdit && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Histórico de {aluno?.nome}</h4>
            {chartData.length > 1 && (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="data" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="gordura" stroke="#fb923c" fill="#fb923c20" name="% Gordura" />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <div className="space-y-1 mt-2">
              {[...historico].reverse().slice(0, 3).map(av => (
                <div key={av.id} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: '#fb923c06', border: '1px solid #fb923c15' }}>
                  <span className="text-xs text-slate-400">{new Date(av.data).toLocaleDateString('pt-BR')}</span>
                  <div className="flex gap-3 text-xs">
                    {av.percentualGordura != null && <span style={{ color: '#fb923c' }}>{av.percentualGordura.toFixed(1)}% gord</span>}
                    {av.massaMagra != null && <span style={{ color: '#34d399' }}>{av.massaMagra.toFixed(1)}kg magra</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lista principal de todas as avaliações ───────────────────────────────────
export default function AvaliacaoFisicaView() {
  const { alunos, addAvaliacao, updateAvaliacao, deleteAvaliacao, avaliacoes } = useApp();
  const { user } = useAuth();
  const [professorId, setProfessorId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editAvaliacao, setEditAvaliacao] = useState(null);
  const [filtroAlunoId, setFiltroAlunoId] = useState('');

  useEffect(() => {
    getCredentials().then(creds => {
      const myCred = creds.find(c => c.id === user?.id);
      setProfessorId(myCred?.linkedId || '');
    });
  }, [user?.id]);

  const alunosFiltrados = user?.role === 'professor' ? alunos.filter(a => professorId && a.professorId === professorId) : alunos;

  const todasAvaliacoes = avaliacoes
    .filter(av => alunosFiltrados.some(a => a.id === av.alunoId))
    .filter(av => !filtroAlunoId || av.alunoId === filtroAlunoId)
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  const openNew = () => { setEditAvaliacao(null); setShowForm(true); };
  const openEdit = (av) => { setEditAvaliacao(av); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditAvaliacao(null); };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity size={20} color="#fb923c" />Avaliações Físicas
          </h2>
          <p className="text-xs text-slate-500">{todasAvaliacoes.length} avaliação(ões) registrada(s)</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#fb923c20', color: '#fb923c', border: '1px solid #fb923c30' }}>
          <Plus size={14} />Nova Avaliação
        </button>
      </div>

      {/* Filtro por aluno */}
      {alunosFiltrados.length > 0 && (
        <select value={filtroAlunoId} onChange={e => setFiltroAlunoId(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm text-white outline-none"
          style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="">Todos os alunos</option>
          {alunosFiltrados.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
      )}

      {/* Lista */}
      {todasAvaliacoes.length === 0 ? (
        <div className="text-center py-16" style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}` }}>
          <Activity size={48} className="mx-auto mb-3 opacity-20 text-slate-500" />
          <p className="text-white font-semibold">Nenhuma avaliação registrada</p>
          <p className="text-xs text-slate-500 mt-1">Clique em "+ Nova Avaliação" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todasAvaliacoes.map(av => {
            const aluno = alunos.find(a => a.id === av.alunoId);
            const corClass = getCorClassificacao(av.classificacaoGordura || '');
            return (
              <div key={av.id} className="p-4 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                      style={{ background: '#fb923c20' }}>
                      {aluno?.nome?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm truncate">{aluno?.nome || 'Aluno desconhecido'}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(av.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        {av.peso && ` • ${av.peso}kg`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {av.classificacaoGordura && (
                      <span className="text-xs px-2 py-0.5 rounded-full hidden sm:inline"
                        style={{ background: `${corClass}15`, color: corClass }}>
                        {av.classificacaoGordura}
                      </span>
                    )}
                    {/* Botão PDF */}
                    <button onClick={() => gerarPDFAvaliacao(av, aluno)}
                      className="p-2 rounded-xl hover:bg-white/5 transition-all" style={{ color: '#34d399' }}>
                      <Download size={14} />
                    </button>
                    {/* Botão Editar */}
                    <button onClick={() => openEdit(av)}
                      className="p-2 rounded-xl hover:bg-white/5 transition-all" style={{ color: '#fbbf24' }}>
                      <Edit2 size={14} />
                    </button>
                    {/* Botão Excluir */}
                    <button onClick={() => { if (confirm('Excluir esta avaliação?')) deleteAvaliacao(av.id); }}
                      className="p-2 rounded-xl hover:bg-red-500/10 transition-all" style={{ color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Métricas */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {av.percentualGordura != null && (
                    <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: '#fb923c10', color: '#fb923c' }}>
                      {av.percentualGordura.toFixed(1)}% gordura
                    </span>
                  )}
                  {av.massaMagra != null && (
                    <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: '#34d39910', color: '#34d399' }}>
                      {av.massaMagra.toFixed(1)}kg magra
                    </span>
                  )}
                  {av.massaGorda != null && (
                    <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: '#ef444410', color: '#ef4444' }}>
                      {av.massaGorda.toFixed(1)}kg gorda
                    </span>
                  )}
                  {av.imc != null && (
                    <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: '#60a5fa10', color: '#60a5fa' }}>
                      IMC {av.imc.toFixed(1)}
                    </span>
                  )}
                  {av.tmb != null && (
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                      TMB {Math.round(av.tmb)} kcal
                    </span>
                  )}
                </div>
                {av.observacoes && <p className="text-xs text-slate-500 mt-2">📝 {av.observacoes}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal formulário */}
      {showForm && (
        <AvaliacaoForm
          alunos={alunos}
          professorId={professorId}
          userRole={user?.role}
          addAvaliacao={addAvaliacao}
          updateAvaliacao={updateAvaliacao}
          avaliacoes={avaliacoes}
          editAvaliacao={editAvaliacao}
          onClose={closeForm}
        />
      )}
    </div>
  );
}