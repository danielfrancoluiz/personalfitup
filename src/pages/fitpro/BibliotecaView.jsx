import React, { useState, useRef, useCallback } from 'react';

// Helper para grupos com estado de expansão independente
const GRUPO_EMOJI = {
  'Funcional': '🤸', 'CrossFit': '🏋️', 'Cardio': '🏃', 'Core': '🔥', 'Calistenia': '🧗',
  'Peito': '💪', 'Costas': '🦾', 'Ombros': '🎯', 'Bíceps': '💪', 'Tríceps': '💪',
  'Quadríceps': '🦵', 'Posterior de Coxa': '🦵', 'Glúteos': '🍑', 'Panturrilha': '🦶',
  'Antebraço': '🤜',
};

function GrupoSection({ grupo, exsDoGrupo, cor, canEdit, onSelect, onEdit, onDelete, groupColors }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1525', border: `1px solid ${cor}25` }}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all"
        style={{ background: `${cor}08` }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cor}20` }}>
          <span className="text-sm">{GRUPO_EMOJI[grupo] || '💪'}</span>
        </div>
        <span className="font-bold text-white flex-1 text-left">{grupo}</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cor}15`, color: cor }}>{exsDoGrupo.length}</span>
        {expanded
          ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>}
      </button>
      {expanded && (
        <div className="p-2 space-y-1">
          {exsDoGrupo.map(ex => (
            <ExerciseListItem key={ex.id} ex={ex} canEdit={canEdit}
              onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} groupColors={groupColors} />
          ))}
        </div>
      )}
    </div>
  );
}
import { BookOpen, Plus, X, Trash2, Edit2, Search, ImagePlus, Loader2, Folder, FolderOpen, ChevronDown, ChevronRight, FolderPlus, Tags, Layers } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useApp, useAuth } from '../../context/FitProContext';
import { generateId } from '../../lib/fitpro-storage';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

const GRUPOS_PADRAO = ['Peito', 'Costas', 'Quadríceps', 'Posterior de Coxa', 'Glúteos', 'Ombros', 'Bíceps', 'Tríceps', 'Core', 'Panturrilha', 'Antebraço', 'Cardio', 'Calistenia', 'Funcional', 'CrossFit'];
const GRUPOS_STORAGE_KEY = 'fitpro_grupos_musculares_extras';
const TIPOS = ['Força', 'Hipertrofia', 'Resistência', 'Cardio', 'Funcional', 'Flexibilidade'];
const NIVEIS = ['Iniciante', 'Intermediário', 'Avançado'];
const EQUIPAMENTOS = ['Sem equipamento', 'Barra', 'Halteres', 'Cabo', 'Máquina', 'Elástico', 'TRX', 'Kettlebell'];

const GROUP_COLORS_BASE = {
  'Peito': '#f472b6', 'Costas': '#60a5fa', 'Quadríceps': '#34d399', 'Posterior de Coxa': '#fbbf24',
  'Glúteos': '#a78bfa', 'Ombros': '#fb923c', 'Bíceps': '#34d399', 'Tríceps': '#60a5fa',
  'Core': '#f472b6', 'Panturrilha': '#fbbf24', 'Antebraço': '#a78bfa', 'Cardio': '#ef4444', 'Calistenia': '#22d3ee', 'Funcional': '#00d4ff', 'CrossFit': '#f97316',
};
const EXTRA_COLORS = ['#e879f9', '#2dd4bf', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#84cc16'];

function emptyEx() {
  return {
    nome: '', grupoMuscular: 'Peito', musculosSecundarios: [], tipo: 'Força', nivel: 'Intermediário',
    equipamento: 'Barra', descricao: '', execucao: '', dicas: '', errosComuns: '',
    series: '3-4', repeticoes: '10-12', descanso: 75, videoUrl: '', gifUrl: '', publico: true, pastaId: '',
  };
}

// Componente de item de exercício em formato lista
function ExerciseListItem({ ex, canEdit, onSelect, onEdit, onDelete, groupColors }) {
  const color = (groupColors || GROUP_COLORS_BASE)[ex.grupoMuscular] || '#64748b';
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all"
      style={{ border: '1px solid rgba(255,255,255,0.05)' }}
      onClick={() => onSelect(ex)}
    >
      {/* GIF / placeholder */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{ background: ex.gifUrl ? '#0a0e1a' : `${color}15` }}>
        {ex.gifUrl
          ? <img src={ex.gifUrl} alt={ex.nome} className="w-full h-full object-cover" />
          : <span className="text-lg">{GRUPO_EMOJI[ex.grupoMuscular] || '💪'}</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{ex.nome}</div>
        <div className="flex gap-2 text-xs text-slate-500 flex-wrap">
          <span className="px-1.5 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>{ex.grupoMuscular}</span>
          <span>{ex.equipamento}</span>
          <span>•</span>
          <span>{ex.nivel}</span>
          <span>•</span>
          <span style={{ color }}>{ex.series}×{ex.repeticoes}</span>
        </div>
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onEdit(ex); }}
            className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: '#94a3b8' }}>
            <Edit2 size={13} />
          </button>
          <button onClick={e => { e.stopPropagation(); if (confirm('Excluir?')) onDelete(ex.id); }}
            className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: '#ef4444' }}>
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function BibliotecaView() {
  const { exerciciosBiblioteca, addExercicioBiblioteca, updateExercicioBiblioteca, deleteExercicioBiblioteca } = useApp();
  const { user } = useAuth();
  const isProfessor = user?.role === 'professor';
  const isAdmin = user?.role === 'admin';

  // Grupos extras criados pelo admin
  const [gruposExtras, setGruposExtras] = useState(() => {
    try { return JSON.parse(localStorage.getItem(GRUPOS_STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const GRUPOS = [...GRUPOS_PADRAO, ...gruposExtras.map(g => g.nome)];
  const GROUP_COLORS = { ...GROUP_COLORS_BASE, ...Object.fromEntries(gruposExtras.map((g, i) => [g.nome, g.cor || EXTRA_COLORS[i % EXTRA_COLORS.length]])) };

  const saveGruposExtras = (list) => {
    setGruposExtras(list);
    localStorage.setItem(GRUPOS_STORAGE_KEY, JSON.stringify(list));
  };

  // Modal mover exercícios sem grupo
  const [showMoverModal, setShowMoverModal] = useState(false);
  const [grupoDestino, setGrupoDestino] = useState('');
  const [exsSelecionados, setExsSelecionados] = useState([]);
  const [movendo, setMovendo] = useState(false);

  // Seleção individual na seção "Sem grupo definido"
  const [semGrupoSelecionados, setSemGrupoSelecionados] = useState(new Set());

  // Modal novo grupo
  const [showNovoGrupoModal, setShowNovoGrupoModal] = useState(false);
  const [novoGrupoNome, setNovoGrupoNome] = useState('');
  const [novoGrupoCor, setNovoGrupoCor] = useState(EXTRA_COLORS[0]);

  const handleCriarGrupo = () => {
    const nome = novoGrupoNome.trim();
    if (!nome) return alert('Informe o nome do grupo');
    if (GRUPOS.includes(nome)) return alert('Grupo já existe');
    saveGruposExtras([...gruposExtras, { nome, cor: novoGrupoCor }]);
    setNovoGrupoNome('');
    setNovoGrupoCor(EXTRA_COLORS[0]);
    setShowNovoGrupoModal(false);
  };

  const handleExcluirGrupoExtra = (nome) => {
    if (!confirm(`Excluir grupo "${nome}"? Os exercícios desse grupo não serão apagados.`)) return;
    saveGruposExtras(gruposExtras.filter(g => g.nome !== nome));
  };

  const handleMoverExercicios = async () => {
    if (!grupoDestino) return alert('Selecione um grupo destino');
    if (exsSelecionados.length === 0) return alert('Selecione ao menos um exercício');
    setMovendo(true);
    for (const ex of exsSelecionados) {
      await updateExercicioBiblioteca(ex.id, { ...ex, grupoMuscular: grupoDestino });
    }
    setMovendo(false);
    setShowMoverModal(false);
    setExsSelecionados([]);
    setGrupoDestino('');
    setSemGrupoSelecionados(new Set());
  };

  // Todos os exercícios
  const todosExercicios = exerciciosBiblioteca || [];

  // Biblioteca padrão: exercícios públicos (sem professorId, criados pelo sistema ou criados pelo admin)
  const adminIds = todosExercicios
    .filter(e => e.professorId && !todosExercicios.find(x => x.id === e.professorId))
    .map(e => e.professorId);
  const bibliotecaPadrao = todosExercicios.filter(e =>
    !e.professorId ||
    e.professorId === 'system' ||
    e.professorId === 'admin' ||
    e.publico === true
  );

  // Exercícios do professor logado
  const meusExercicios = todosExercicios.filter(e => e.professorId === user?.id);

  // Para admin: vê tudo na lista principal
  const exerciciosParaAdmin = todosExercicios;

  const [search, setSearch] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyEx());
  const [saved, setSaved] = useState(false);
  const [selectedEx, setSelectedEx] = useState(null);
  const [uploadingGif, setUploadingGif] = useState(false);
  const gifInputRef = useRef(null);

  // Aba ativa no painel do professor
  const [abaProf, setAbaProf] = useState('padrao'); // 'padrao' | 'meus'

  // Pastas (apenas para admin)
  const [pastas, setPastas] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fitpro_pastas_biblioteca') || '[]');
      // Remove pasta CrossFit antiga (agora é um grupo muscular)
      const filtered = saved.filter(p => p.id !== 'CrossFit' && p.nome !== 'CrossFit');
      if (filtered.length !== saved.length) {
        localStorage.setItem('fitpro_pastas_biblioteca', JSON.stringify(filtered));
      }
      return filtered;
    } catch { return []; }
  });
  const [expandedPastas, setExpandedPastas] = useState({});
  const [editingPastaId, setEditingPastaId] = useState(null);
  const [editingPastaNome, setEditingPastaNome] = useState('');
  const [filtroPasta, setFiltroPasta] = useState('todas');

  const savePastas = (list) => {
    setPastas(list);
    localStorage.setItem('fitpro_pastas_biblioteca', JSON.stringify(list));
  };

  const addPasta = () => {
    const nome = prompt('Nome da pasta:');
    if (!nome?.trim()) return;
    savePastas([...pastas, { id: generateId(), nome: nome.trim(), createdAt: new Date().toISOString() }]);
  };

  const renamePasta = (id) => {
    savePastas(pastas.map(p => p.id === id ? { ...p, nome: editingPastaNome } : p));
    setEditingPastaId(null);
  };

  const removePasta = (id) => {
    if (!confirm('Excluir pasta? Os exercícios não serão apagados.')) return;
    savePastas(pastas.filter(p => p.id !== id));
  };

  const handleGifUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingGif(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, gifUrl: file_url }));
    setUploadingGif(false);
  };

  // Lista ativa de exercícios conforme contexto
  const exerciciosAtivos = isAdmin
    ? exerciciosParaAdmin
    : (abaProf === 'padrao' ? bibliotecaPadrao : meusExercicios);

  const applyFilters = (list) => list.filter(e => {
    const matchSearch = e.nome.toLowerCase().includes(search.toLowerCase()) || (e.grupoMuscular || '').toLowerCase().includes(search.toLowerCase());
    const matchGrupo = !filtroGrupo || e.grupoMuscular === filtroGrupo;
    const matchNivel = !filtroNivel || e.nivel === filtroNivel;
    const matchPasta = filtroPasta === 'todas' ? true : filtroPasta === 'sem-pasta' ? !e.pastaId : e.pastaId === filtroPasta;
    return matchSearch && matchGrupo && matchNivel && matchPasta;
  });

  const filtered = applyFilters(exerciciosAtivos);

  // Professor só pode editar/excluir na aba "Meus Exercícios"
  const canEdit = isAdmin || (isProfessor && abaProf === 'meus');

  const handleSave = () => {
    if (!form.nome.trim()) return alert('Nome é obrigatório');
    // Admin cria exercícios públicos sem professorId (ficam na biblioteca padrão para todos)
    // Professor marca com seu próprio professorId
    const data = isAdmin
      ? { ...form, professorId: '', publico: true, updatedAt: new Date().toISOString() }
      : { ...form, professorId: user?.id, updatedAt: new Date().toISOString() };
    if (editId) updateExercicioBiblioteca(editId, data);
    else addExercicioBiblioteca({ ...data, createdAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setEditId(null); setForm(emptyEx()); }, 1200);
  };

  const openEdit = (ex) => {
    setForm({ ...emptyEx(), ...ex });
    setEditId(ex.id);
    setSelectedEx(null);
    setShowForm(true);
  };

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (selectedEx) {
    const ex = todosExercicios.find(e => e.id === selectedEx.id) || selectedEx;
    const color = GROUP_COLORS[ex.grupoMuscular] || '#64748b';
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedEx(null)} className="p-2 rounded-xl hover:bg-white/5">
            <ChevronRight size={18} color="#9ca3af" className="rotate-180" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{ex.nome}</h2>
            <p className="text-xs text-slate-500">{ex.grupoMuscular} • {ex.nivel} • {ex.equipamento}</p>
          </div>
          {canEdit && (
            <button onClick={() => openEdit(ex)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
              <Edit2 size={12} className="inline mr-1" />Editar
            </button>
          )}
        </div>

        {ex.gifUrl && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#0a0e1a' }}>
            <img src={ex.gifUrl} alt="Demonstração" className="w-full max-h-72 object-contain mx-auto" />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Séries', value: ex.series, color: '#f472b6' },
            { label: 'Repetições', value: ex.repeticoes, color: '#a78bfa' },
            { label: 'Descanso', value: `${ex.descanso}s`, color: '#60a5fa' },
          ].map(k => (
            <div key={k.label} className="p-3 rounded-xl text-center" style={{ background: `${k.color}10`, border: `1px solid ${k.color}25` }}>
              <div className="text-lg font-bold" style={{ color: k.color }}>{k.value}</div>
              <div className="text-xs text-slate-500">{k.label}</div>
            </div>
          ))}
        </div>

        <div className="p-5 rounded-2xl space-y-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${color}15`, color }}>{ex.grupoMuscular}</span>
            <span className="text-xs px-2 py-1 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{ex.tipo}</span>
            <span className="text-xs px-2 py-1 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{ex.equipamento}</span>
            <span className="text-xs px-2 py-1 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{ex.nivel}</span>
          </div>
          {ex.descricao && <div><h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Descrição</h4><p className="text-sm text-slate-300">{ex.descricao}</p></div>}
          {ex.execucao && <div><h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Execução</h4><p className="text-sm text-slate-300 whitespace-pre-line">{ex.execucao}</p></div>}
          {ex.dicas && <div><h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">💡 Dicas</h4><p className="text-sm text-slate-300">{ex.dicas}</p></div>}
          {ex.errosComuns && <div><h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">⚠️ Erros Comuns</h4><p className="text-sm text-slate-300">{ex.errosComuns}</p></div>}
          {ex.videoUrl && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Vídeo</h4>
              <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-400 underline">{ex.videoUrl}</a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── MAIN LIST VIEW ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><BookOpen size={20} color="#f472b6" />Biblioteca de Exercícios</h2>
          <p className="text-xs text-slate-500">{filtered.length} exercício(s)</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {isAdmin && (
            <>
              <button onClick={() => setShowNovoGrupoModal(true)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold"
                style={{ background: '#22d3ee15', color: '#22d3ee', border: '1px solid #22d3ee30' }}>
                <Layers size={14} />Grupo
              </button>
              <button onClick={() => {
                const semGrupo = exerciciosAtivos.filter(e => !GRUPOS.includes(e.grupoMuscular));
                if (semGrupo.length === 0) return alert('Não há exercícios fora dos grupos cadastrados.');
                setExsSelecionados(semGrupo);
                setShowMoverModal(true);
              }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold"
                style={{ background: '#a78bfa15', color: '#a78bfa', border: '1px solid #a78bfa30' }}>
                <Tags size={14} />Mover
              </button>
              <button onClick={addPasta}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold"
                style={{ background: '#fbbf2415', color: '#fbbf24', border: '1px solid #fbbf2430' }}>
                <FolderPlus size={14} />Pasta
              </button>
              <button onClick={() => { setForm(emptyEx()); setEditId(null); setShowForm(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: '#f472b620', color: '#f472b6', border: '1px solid #f472b630' }}>
                <Plus size={14} />Exercício
              </button>
            </>
          )}
          {isProfessor && abaProf === 'meus' && (
            <button onClick={() => { setForm(emptyEx()); setEditId(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: '#f472b620', color: '#f472b6', border: '1px solid #f472b630' }}>
              <Plus size={14} />Novo Exercício
            </button>
          )}
        </div>
      </div>

      {/* Abas para professor */}
      {isProfessor && (
        <div className="flex gap-2">
          {[
            { id: 'padrao', label: '📚 Biblioteca Padrão', count: bibliotecaPadrao.length },
            { id: 'meus', label: '⭐ Meus Exercícios', count: meusExercicios.length },
          ].map(aba => (
            <button key={aba.id} onClick={() => { setAbaProf(aba.id); setSearch(''); setFiltroGrupo(''); setFiltroNivel(''); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: abaProf === aba.id ? '#f472b620' : 'rgba(255,255,255,0.04)', color: abaProf === aba.id ? '#f472b6' : '#64748b', border: abaProf === aba.id ? '1px solid #f472b630' : '1px solid rgba(255,255,255,0.06)' }}>
              {aba.label}
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>{aba.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar exercício..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm text-white outline-none"
          style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="">Todos grupos</option>
          <optgroup label="Padrão">
            {GRUPOS_PADRAO.map(g => <option key={g} value={g}>{g}</option>)}
          </optgroup>
          {gruposExtras.length > 0 && (
            <optgroup label="Personalizados">
              {gruposExtras.map(g => <option key={g.nome} value={g.nome}>{g.nome}</option>)}
            </optgroup>
          )}
        </select>
        <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm text-white outline-none"
          style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="">Todos níveis</option>
          {NIVEIS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* Pastas + exercícios sem pasta (admin only) */}
      {isAdmin && pastas.length > 0 && (
        <div className="space-y-2">
          {/* Botão "Todas" */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[{ id: 'todas', nome: 'Todas' }, { id: 'sem-pasta', nome: 'Sem pasta' }, ...pastas].map(p => (
              <button key={p.id} onClick={() => setFiltroPasta(p.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1"
                style={{ background: filtroPasta === p.id ? '#fbbf2420' : 'rgba(255,255,255,0.03)', color: filtroPasta === p.id ? '#fbbf24' : '#64748b', border: filtroPasta === p.id ? '1px solid #fbbf2430' : '1px solid rgba(255,255,255,0.06)' }}>
                {p.id !== 'todas' && p.id !== 'sem-pasta' && <Folder size={11} />}
                {p.nome}
              </button>
            ))}
          </div>

          {/* Pastas expansíveis (somente quando "Todas" selecionado e sem busca) */}
          {filtroPasta === 'todas' && !search && !filtroGrupo && !filtroNivel && (
            <div className="space-y-2">
              {pastas.map(pasta => {
                const exsNaPasta = exerciciosAtivos.filter(e => e.pastaId === pasta.id);
                const expanded = expandedPastas[pasta.id];
                return (
                  <div key={pasta.id} className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid rgba(251,191,36,0.15)` }}>
                    <div className="flex items-center gap-2 px-4 py-3">
                      <button onClick={() => setExpandedPastas(p => ({ ...p, [pasta.id]: !p[pasta.id] }))}
                        className="flex items-center gap-2 flex-1 text-left">
                        {expanded ? <FolderOpen size={16} color="#fbbf24" /> : <Folder size={16} color="#fbbf24" />}
                        {editingPastaId === pasta.id ? (
                          <input value={editingPastaNome} onChange={e => setEditingPastaNome(e.target.value)}
                            onBlur={() => renamePasta(pasta.id)}
                            onKeyDown={e => { if (e.key === 'Enter') renamePasta(pasta.id); }}
                            className="flex-1 bg-transparent text-white text-sm outline-none border-b border-yellow-400/40"
                            autoFocus onClick={e => e.stopPropagation()} />
                        ) : (
                          <span className="text-sm font-semibold text-white">{pasta.nome}</span>
                        )}
                        <span className="text-xs text-slate-500 ml-1">({exsNaPasta.length})</span>
                      </button>
                      {canEdit && (
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingPastaId(pasta.id); setEditingPastaNome(pasta.nome); }}
                            className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: '#94a3b8' }}>
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => removePasta(pasta.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: '#ef4444' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                      {expanded ? <ChevronDown size={14} color="#6b7280" /> : <ChevronRight size={14} color="#6b7280" />}
                    </div>
                    {expanded && (
                      <div className="px-3 pb-3 space-y-1">
                        {exsNaPasta.length === 0
                          ? <p className="text-xs text-slate-600 text-center py-2">Nenhum exercício nesta pasta</p>
                          : exsNaPasta.map(ex => (
                            <ExerciseListItem key={ex.id} ex={ex} canEdit={canEdit}
                              onSelect={setSelectedEx}
                              onEdit={openEdit}
                              onDelete={deleteExercicioBiblioteca}
                              groupColors={GROUP_COLORS} />
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Lista de exercícios filtrados — agrupada por grupo muscular */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>{isProfessor && abaProf === 'meus' ? 'Você ainda não criou nenhum exercício' : 'Nenhum exercício encontrado'}</p>
          {isProfessor && abaProf === 'meus' && (
            <button onClick={() => { setForm(emptyEx()); setEditId(null); setShowForm(true); }}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold mx-auto"
              style={{ background: '#f472b620', color: '#f472b6', border: '1px solid #f472b630' }}>
              <Plus size={14} />Criar meu primeiro exercício
            </button>
          )}
        </div>
      ) : filtroGrupo || search ? (
        // Quando há filtro ativo: lista simples
        <div className="rounded-2xl overflow-hidden space-y-1 p-2" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          {filtered.map(ex => (
            <ExerciseListItem key={ex.id} ex={ex} canEdit={canEdit}
              onSelect={setSelectedEx}
              onEdit={openEdit}
              onDelete={deleteExercicioBiblioteca}
              groupColors={GROUP_COLORS} />
          ))}
        </div>
      ) : (
        // Sem filtro: agrupado por grupo muscular
        <div className="space-y-3">
          {GRUPOS.filter(g => filtered.some(e => e.grupoMuscular === g)).map(grupo => (
            <GrupoSection
              key={grupo}
              grupo={grupo}
              exsDoGrupo={filtered.filter(e => e.grupoMuscular === grupo)}
              cor={GROUP_COLORS[grupo] || '#64748b'}
              canEdit={canEdit}
              onSelect={setSelectedEx}
              onEdit={openEdit}
              onDelete={deleteExercicioBiblioteca}
              groupColors={GROUP_COLORS}
            />
          ))}
          {/* Exercícios sem grupo muscular reconhecido */}
          {(() => {
            const semGrupo = filtered.filter(e => !GRUPOS.includes(e.grupoMuscular));
            if (semGrupo.length === 0) return null;
            const todosSelecionados = semGrupo.length > 0 && semGrupo.every(e => semGrupoSelecionados.has(e.id));
            const algumSelecionado = semGrupo.some(e => semGrupoSelecionados.has(e.id));
            const toggleTodos = () => {
              if (todosSelecionados) {
                setSemGrupoSelecionados(new Set());
              } else {
                setSemGrupoSelecionados(new Set(semGrupo.map(e => e.id)));
              }
            };
            const toggleEx = (id) => {
              setSemGrupoSelecionados(prev => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
              });
            };
            return (
              <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid rgba(251,113,133,0.25)` }}>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'rgba(251,113,133,0.06)' }}>
                  {isAdmin && (
                    <button onClick={toggleTodos}
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ background: todosSelecionados ? '#a78bfa' : 'rgba(255,255,255,0.08)', border: `1px solid ${todosSelecionados ? '#a78bfa' : 'rgba(255,255,255,0.2)'}` }}
                      title={todosSelecionados ? 'Desmarcar todos' : 'Selecionar todos'}>
                      {todosSelecionados && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                    </button>
                  )}
                  <span className="text-sm">❓</span>
                  <span className="font-bold text-white flex-1">Sem grupo definido</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,113,133,0.15)', color: '#fb7185' }}>{semGrupo.length}</span>
                  {isAdmin && algumSelecionado && (
                    <button
                      onClick={() => { setExsSelecionados(semGrupo.filter(e => semGrupoSelecionados.has(e.id))); setShowMoverModal(true); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: '#a78bfa20', color: '#a78bfa', border: '1px solid #a78bfa30' }}>
                      <Tags size={12} />Mover {semGrupoSelecionados.size} selecionado(s)
                    </button>
                  )}
                  {isAdmin && !algumSelecionado && (
                    <button
                      onClick={() => { setExsSelecionados(semGrupo); setShowMoverModal(true); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: '#ffffff08', color: '#64748b', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Tags size={12} />Mover todos
                    </button>
                  )}
                </div>
                {/* Lista com checkboxes */}
                <div className="p-2 space-y-1">
                  {semGrupo.map(ex => {
                    const selecionado = semGrupoSelecionados.has(ex.id);
                    return (
                      <div key={ex.id} className="flex items-center gap-2 rounded-xl transition-all"
                        style={{ background: selecionado ? 'rgba(167,139,250,0.08)' : 'transparent', border: selecionado ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent' }}>
                        {isAdmin && (
                          <button onClick={() => toggleEx(ex.id)}
                            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ml-2 transition-all"
                            style={{ background: selecionado ? '#a78bfa' : 'rgba(255,255,255,0.08)', border: `1px solid ${selecionado ? '#a78bfa' : 'rgba(255,255,255,0.2)'}` }}>
                            {selecionado && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                          </button>
                        )}
                        <div className="flex-1">
                          <ExerciseListItem ex={ex} canEdit={canEdit}
                            onSelect={setSelectedEx}
                            onEdit={openEdit}
                            onDelete={deleteExercicioBiblioteca}
                            groupColors={GROUP_COLORS} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* MODAL MOVER EXERCÍCIOS PARA GRUPO */}
      {showMoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#0d1525', border: `1px solid rgba(167,139,250,0.3)` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2"><Tags size={16} color="#a78bfa" />Mover para Grupo</h3>
              <button onClick={() => { setShowMoverModal(false); setExsSelecionados([]); }}><X size={18} color="#6b7280" /></button>
            </div>
            <p className="text-xs text-slate-400 mb-4">{exsSelecionados.length} exercício(s) selecionado(s). Escolha o grupo de destino:</p>
            <div className="mb-4">
              <label className="text-xs text-slate-400 block mb-1">Grupo de Destino</label>
              <select value={grupoDestino} onChange={e => setGrupoDestino(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                <option value="">Selecionar grupo...</option>
                <optgroup label="Grupos Padrão">
                  {GRUPOS_PADRAO.map(g => <option key={g} value={g}>{g}</option>)}
                </optgroup>
                {gruposExtras.length > 0 && (
                  <optgroup label="Grupos Personalizados">
                    {gruposExtras.map(g => <option key={g.nome} value={g.nome}>{g.nome}</option>)}
                  </optgroup>
                )}
              </select>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 mb-4 p-2 rounded-xl" style={{ background: '#0a0e1a' }}>
              {exsSelecionados.map(ex => (
                <div key={ex.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span>{ex.nome}</span>
                  <span className="text-slate-500">{ex.grupoMuscular || 'Sem grupo'}</span>
                </div>
              ))}
            </div>
            <button onClick={handleMoverExercicios} disabled={movendo}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: movendo ? '#1e2a3a' : 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
              {movendo ? <><Loader2 size={14} className="animate-spin" />Movendo...</> : `Mover ${exsSelecionados.length} exercício(s)`}
            </button>
          </div>
        </div>
      )}

      {/* MODAL NOVO GRUPO MUSCULAR */}
      {showNovoGrupoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#0d1525', border: `1px solid rgba(34,211,238,0.3)` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2"><Layers size={16} color="#22d3ee" />Novo Grupo Muscular</h3>
              <button onClick={() => setShowNovoGrupoModal(false)}><X size={18} color="#6b7280" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nome do Grupo</label>
                <input value={novoGrupoNome} onChange={e => setNovoGrupoNome(e.target.value)}
                  placeholder="Ex: Mobilidade, Pilates..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Cor do Grupo</label>
                <div className="flex gap-2 flex-wrap">
                  {EXTRA_COLORS.map(c => (
                    <button key={c} onClick={() => setNovoGrupoCor(c)}
                      className="w-8 h-8 rounded-lg transition-all"
                      style={{ background: c, border: novoGrupoCor === c ? `2px solid white` : '2px solid transparent', transform: novoGrupoCor === c ? 'scale(1.15)' : 'scale(1)' }} />
                  ))}
                </div>
              </div>
            </div>
            {/* Grupos extras existentes */}
            {gruposExtras.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">Grupos personalizados criados:</p>
                <div className="flex flex-wrap gap-2">
                  {gruposExtras.map(g => (
                    <div key={g.nome} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                      style={{ background: `${g.cor}20`, color: g.cor, border: `1px solid ${g.cor}30` }}>
                      {g.nome}
                      <button onClick={() => handleExcluirGrupoExtra(g.nome)} className="ml-1 hover:opacity-70"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handleCriarGrupo}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #22d3ee, #0891b2)' }}>
              Criar Grupo
            </button>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-xl rounded-2xl p-6 my-4" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{editId ? 'Editar' : 'Novo'} Exercício</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={18} color="#6b7280" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nome do Exercício</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Supino Reto com Barra"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              {pastas.length > 0 && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Pasta</label>
                  <select value={form.pastaId || ''} onChange={e => setForm(f => ({ ...f, pastaId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <option value="">Sem pasta</option>
                    {pastas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Grupo Muscular</label>
                  <select value={form.grupoMuscular} onChange={e => setForm(f => ({ ...f, grupoMuscular: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <optgroup label="Grupos Padrão">
                      {GRUPOS_PADRAO.map(g => <option key={g} value={g}>{g}</option>)}
                    </optgroup>
                    {gruposExtras.length > 0 && (
                      <optgroup label="Grupos Personalizados">
                        {gruposExtras.map(g => <option key={g.nome} value={g.nome}>{g.nome}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Equipamento</label>
                  <select value={form.equipamento} onChange={e => setForm(f => ({ ...f, equipamento: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {EQUIPAMENTOS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nível</label>
                  <select value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {NIVEIS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Séries</label>
                  <input value={form.series} onChange={e => setForm(f => ({ ...f, series: e.target.value }))} placeholder="3-4"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Repetições</label>
                  <input value={form.repeticoes} onChange={e => setForm(f => ({ ...f, repeticoes: e.target.value }))} placeholder="10-12"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Descanso (segundos)</label>
                <input type="number" value={form.descanso} onChange={e => setForm(f => ({ ...f, descanso: parseInt(e.target.value) || 60 }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Descrição</label>
                <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Execução (passo a passo)</label>
                <textarea value={form.execucao} onChange={e => setForm(f => ({ ...f, execucao: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Dicas</label>
                  <textarea value={form.dicas} onChange={e => setForm(f => ({ ...f, dicas: e.target.value }))} rows={2}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Erros Comuns</label>
                  <textarea value={form.errosComuns} onChange={e => setForm(f => ({ ...f, errosComuns: e.target.value }))} rows={2}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">URL do Vídeo (opcional)</label>
                <input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">GIF do Exercício (opcional)</label>
                <input ref={gifInputRef} type="file" accept="image/gif,image/*" className="hidden" onChange={handleGifUpload} />
                {form.gifUrl ? (
                  <div className="relative">
                    <img src={form.gifUrl} alt="GIF do exercício" className="w-full max-h-48 object-contain rounded-xl" style={{ background: '#1e2a3a' }} />
                    <button onClick={() => setForm(f => ({ ...f, gifUrl: '' }))}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 hover:bg-red-500">
                      <X size={12} color="#fff" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => gifInputRef.current?.click()} disabled={uploadingGif}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all"
                    style={{ background: '#1e2a3a', border: '1px dashed rgba(255,255,255,0.15)', color: '#64748b' }}>
                    {uploadingGif ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                    {uploadingGif ? 'Enviando...' : 'Clique para anexar imagem/GIF'}
                  </button>
                )}
              </div>
            </div>
            <button onClick={handleSave} className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f472b6, #db2777)' }}>
              {saved ? '✓ Salvo!' : `${editId ? 'Salvar' : 'Cadastrar'} Exercício`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}