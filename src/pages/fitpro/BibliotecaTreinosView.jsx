import React, { useState, useEffect } from 'react';
import { FolderPlus, Folder, FolderOpen, Plus, X, Edit2, Trash2, ChevronDown, ChevronUp, Copy, Dumbbell, ArrowRightLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp, useAuth } from '../../context/FitProContext';
import { generateId } from '../../lib/fitpro-storage';

function getPastasKey(professorId) {
  return `fitpro_bib_pastas_${professorId}`;
}

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';
const COR_SESSAO = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#fb923c'];

// ─── Modal Renomear Rotina ───────────────────────────────────────────────────
function RenomearModal({ rotina, onSave, onClose }) {
  const [nome, setNome] = useState(rotina.nome);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm">Renomear Treino</h3>
          <button onClick={onClose}><X size={18} color="#6b7280" /></button>
        </div>
        <input autoFocus value={nome} onChange={e => setNome(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none mb-4"
          style={{ background: '#1e2a3a', border: '1px solid #a78bfa40' }}
          onKeyDown={e => { if (e.key === 'Enter' && nome.trim()) onSave(nome.trim()); }} />
        <button onClick={() => nome.trim() && onSave(nome.trim())}
          className="w-full py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
          Salvar
        </button>
      </div>
    </div>
  );
}

// ─── Modal Nova Pasta ────────────────────────────────────────────────────────
function NovaPastaModal({ onSave, onClose }) {
  const [nome, setNome] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Nova Pasta</h3>
          <button onClick={onClose}><X size={18} color="#6b7280" /></button>
        </div>
        <input autoFocus value={nome} onChange={e => setNome(e.target.value)}
          placeholder="Nome da pasta..."
          className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none mb-4"
          style={{ background: '#1e2a3a', border: '1px solid #a78bfa40' }}
          onKeyDown={e => { if (e.key === 'Enter' && nome.trim()) onSave(nome.trim()); }} />
        <button onClick={() => nome.trim() && onSave(nome.trim())}
          className="w-full py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
          Criar Pasta
        </button>
      </div>
    </div>
  );
}

// ─── Modal Mover para Pasta ──────────────────────────────────────────────────
function MoverPastaModal({ rotina, pastas, onMover, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-sm">Mover para Pasta</h3>
            <p className="text-xs text-slate-500 truncate max-w-[200px]">{rotina.nome}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X size={16} color="#6b7280" /></button>
        </div>
        <div className="space-y-2">
          {pastas.map(p => (
            <button key={p} onClick={() => onMover(p)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5"
              style={{ border: `1px solid ${rotina.pasta === p ? '#a78bfa40' : 'rgba(255,255,255,0.07)'}`, background: rotina.pasta === p ? '#a78bfa10' : 'transparent', color: rotina.pasta === p ? '#a78bfa' : '#94a3b8' }}>
              <Folder size={14} color={rotina.pasta === p ? '#a78bfa' : '#64748b'} />
              <span>{p}</span>
              {rotina.pasta === p && <span className="ml-auto text-xs text-slate-500">atual</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Card de Rotina ──────────────────────────────────────────────────────────
function RotinaCard({ rotina, i, onEdit, onDelete, onClonar, onMover }) {
  const cor = rotina.cor || COR_SESSAO[i % COR_SESSAO.length];
  const totalExs = rotina.sessoes?.reduce((a, s) => a + (s.exercicios?.length || 0), 0) || 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="p-4 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${cor}20` }}>
          <Dumbbell size={18} style={{ color: cor }} />
        </div>
        <div className="flex gap-1">
          <button onClick={onMover} className="p-1.5 rounded-lg hover:bg-white/5" title="Mover para outra pasta"><ArrowRightLeft size={13} color="#60a5fa" /></button>
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/5" title="Renomear"><Edit2 size={13} color="#fbbf24" /></button>
          <button onClick={onClonar} className="p-1.5 rounded-lg hover:bg-white/5" title="Clonar"><Copy size={13} color="#34d399" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10" title="Excluir"><Trash2 size={13} color="#ef4444" /></button>
        </div>
      </div>
      <h4 className="font-bold text-white text-sm mb-1 truncate">{rotina.nome}</h4>
      {rotina.descricao && <p className="text-xs text-slate-500 mb-2 truncate">{rotina.descricao}</p>}
      <div className="flex gap-1.5 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cor}15`, color: cor }}>{rotina.sessoes?.length || 0} sessões</span>
        <span className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{totalExs} exerc.</span>
        {rotina.nivel && <span className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{rotina.nivel}</span>}
        {rotina.objetivo && <span className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{rotina.objetivo}</span>}
      </div>
    </motion.div>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────
export default function BibliotecaTreinosView() {
  const { bibliotecaTreinos, addBibliotecaTreino, updateBibliotecaTreino, deleteBibliotecaTreino } = useApp();
  const { user } = useAuth();

  // professorId correto: user.linkedId (ID do registro Professor)
  const professorId = user?.linkedId || user?.id || '';

  const minhas = (bibliotecaTreinos || []).filter(b =>
    b.professorId === professorId
  );

  const pastasKey = getPastasKey(professorId);

  const [pastas, setPastas] = useState(() => {
    try { return JSON.parse(localStorage.getItem(getPastasKey(professorId)) || '[]'); } catch { return []; }
  });
  const savePastas = (p) => { setPastas(p); localStorage.setItem(pastasKey, JSON.stringify(p)); };

  // Sincroniza pastas: se algum treino salvo no banco tem uma pasta que não está no localStorage, adiciona
  useEffect(() => {
    if (!professorId) return;
    const pastasDosBanco = [...new Set(minhas.filter(b => b.pasta).map(b => b.pasta))];
    setPastas(prev => {
      const merged = [...prev];
      let changed = false;
      pastasDosBanco.forEach(p => {
        if (!merged.includes(p)) { merged.push(p); changed = true; }
      });
      if (changed) {
        localStorage.setItem(pastasKey, JSON.stringify(merged));
        return merged;
      }
      return prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minhas.length, professorId]);

  const [pastasAbertas, setPastasAbertas] = useState({});
  const [showNovaPasta, setShowNovaPasta] = useState(false);
  const [editandoPasta, setEditandoPasta] = useState(null);
  const [renomearRotina, setRenomearRotina] = useState(null);
  const [moverRotina, setMoverRotina] = useState(null);

  const handleCriarPasta = (nome) => {
    if (pastas.includes(nome)) return alert('Já existe uma pasta com esse nome');
    const novas = [...pastas, nome];
    savePastas(novas);
    setPastasAbertas(p => ({ ...p, [nome]: true }));
    setShowNovaPasta(false);
  };

  const handleRenamePasta = (oldNome, newNome) => {
    if (!newNome.trim() || oldNome === newNome) { setEditandoPasta(null); return; }
    minhas.filter(b => b.pasta === oldNome).forEach(r => updateBibliotecaTreino(r.id, { ...r, pasta: newNome }));
    savePastas(pastas.map(p => p === oldNome ? newNome : p));
    setEditandoPasta(null);
  };

  const handleDeletePasta = (nome) => {
    if (!confirm(`Excluir a pasta "${nome}" e todos os treinos dentro dela?`)) return;
    minhas.filter(b => b.pasta === nome).forEach(r => deleteBibliotecaTreino(r.id));
    savePastas(pastas.filter(p => p !== nome));
  };

  const handleRenomearRotina = async (novoNome) => {
    if (!renomearRotina) return;
    await updateBibliotecaTreino(renomearRotina.id, { ...renomearRotina, nome: novoNome });
    setRenomearRotina(null);
  };

  const handleClonarRotina = async (rotina) => {
    await addBibliotecaTreino({
      ...rotina,
      id: undefined,
      nome: `${rotina.nome} (cópia)`,
      sessoes: (rotina.sessoes || []).map(s => ({
        ...s, id: generateId(),
        exercicios: (s.exercicios || []).map(e => ({ ...e, id: generateId() }))
      })),
    });
  };

  const handleDeleteRotina = async (id) => {
    if (!confirm('Excluir este treino?')) return;
    await deleteBibliotecaTreino(id);
  };

  const handleMoverRotina = async (novaPasta) => {
    if (!moverRotina) return;
    const { id, ...rest } = moverRotina;
    await updateBibliotecaTreino(id, { ...rest, pasta: novaPasta });
    setMoverRotina(null);
  };

  const rotinasDaPasta = (pasta) => minhas.filter(b => b.pasta === pasta);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Folder size={20} color="#a78bfa" />Treinos Personalizados
          </h2>
          <p className="text-xs text-slate-500">{minhas.filter(b => b.pasta).length} treino(s) em {pastas.length} pasta(s)</p>
        </div>
        <button onClick={() => setShowNovaPasta(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#a78bfa20', color: '#a78bfa', border: '1px solid #a78bfa30' }}>
          <FolderPlus size={14} />Nova Pasta
        </button>
      </div>

      {/* Instrução */}
      <div className="p-4 rounded-2xl" style={{ background: '#60a5fa08', border: '1px solid #60a5fa20' }}>
        <p className="text-xs text-slate-400">
          💡 Para adicionar treinos aqui, acesse <strong className="text-white">Meus Treinos</strong> e clique no ícone <strong className="text-a78bfa">📂</strong> em qualquer treino para salvá-lo em uma pasta.
        </p>
      </div>

      {/* Estado vazio */}
      {pastas.length === 0 ? (
        <div className="text-center py-20">
          <FolderPlus size={48} className="mx-auto mb-4 opacity-20 text-slate-400" />
          <p className="text-slate-400 font-semibold mb-1">Nenhuma pasta criada ainda</p>
          <p className="text-xs text-slate-600 mb-4">Crie uma pasta e salve treinos de "Meus Treinos"</p>
          <button onClick={() => setShowNovaPasta(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
            Criar Primeira Pasta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pastas.map((pasta) => {
            const rotinas = rotinasDaPasta(pasta);
            const isOpen = pastasAbertas[pasta] !== false;
            const editando = editandoPasta?.nome === pasta;

            return (
              <motion.div key={pasta} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl overflow-visible" style={{ border: '1px solid #a78bfa30' }}>
                {/* Cabeçalho da pasta */}
                <div className="flex items-center gap-3 px-5 py-4" style={{ background: '#a78bfa0a' }}>
                  <button onClick={() => setPastasAbertas(p => ({ ...p, [pasta]: !isOpen }))}
                    className="flex items-center gap-2 flex-1 min-w-0">
                    {isOpen ? <FolderOpen size={18} color="#a78bfa" /> : <Folder size={18} color="#a78bfa" />}
                    {editando ? (
                      <input autoFocus defaultValue={pasta}
                        onBlur={e => handleRenamePasta(pasta, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenamePasta(pasta, e.target.value); if (e.key === 'Escape') setEditandoPasta(null); }}
                        className="flex-1 px-2 py-0.5 rounded-lg text-sm text-white outline-none"
                        style={{ background: '#1e2a3a', border: '1px solid #a78bfa40' }}
                        onClick={e => e.stopPropagation()} />
                    ) : (
                      <span className="font-bold text-white text-left flex-1 truncate">{pasta}</span>
                    )}
                    <span className="text-xs text-slate-400 flex-shrink-0">{rotinas.length} treino{rotinas.length !== 1 ? 's' : ''}</span>
                    {isOpen ? <ChevronUp size={15} color="#6b7280" /> : <ChevronDown size={15} color="#6b7280" />}
                  </button>
                  <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setEditandoPasta({ nome: pasta })}
                      className="p-1.5 rounded-xl hover:bg-white/5" title="Renomear pasta">
                      <Edit2 size={13} color="#fbbf24" />
                    </button>
                    <button onClick={() => handleDeletePasta(pasta)}
                      className="p-1.5 rounded-xl hover:bg-red-500/10" title="Excluir pasta">
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>
                </div>

                {/* Treinos dentro da pasta */}
                {isOpen && (
                  <div className="p-4">
                    {rotinas.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-xs text-slate-500">Nenhum treino nesta pasta ainda</p>
                        <p className="text-xs text-slate-600 mt-1">Salve treinos de "Meus Treinos" aqui</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                        {rotinas.map((rotina, i) => (
                          <RotinaCard key={rotina.id} rotina={rotina} i={i}
                            onEdit={() => setRenomearRotina(rotina)}
                            onDelete={() => handleDeleteRotina(rotina.id)}
                            onClonar={() => handleClonarRotina(rotina)}
                            onMover={() => setMoverRotina(rotina)} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}


        </div>
      )}

      {showNovaPasta && <NovaPastaModal onSave={handleCriarPasta} onClose={() => setShowNovaPasta(false)} />}

      {renomearRotina && (
        <RenomearModal rotina={renomearRotina} onSave={handleRenomearRotina} onClose={() => setRenomearRotina(null)} />
      )}

      {moverRotina && (
        <MoverPastaModal
          rotina={moverRotina}
          pastas={pastas}
          onMover={handleMoverRotina}
          onClose={() => setMoverRotina(null)}
        />
      )}
    </div>
  );
}