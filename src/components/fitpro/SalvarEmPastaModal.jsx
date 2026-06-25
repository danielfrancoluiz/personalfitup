import React, { useState } from 'react';
import { X, Folder, FolderOpen, FolderPlus, Check, ChevronRight } from 'lucide-react';
import { useApp, useAuth } from '../../context/FitProContext';

function getPastasKey(professorId) {
  return `fitpro_bib_pastas_${professorId}`;
}

function getPastas(professorId) {
  try { return JSON.parse(localStorage.getItem(getPastasKey(professorId)) || '[]'); } catch { return []; }
}

function savePastasStorage(professorId, pastas) {
  localStorage.setItem(getPastasKey(professorId), JSON.stringify(pastas));
}

export default function SalvarEmPastaModal({ treino, onClose }) {
  const { addBibliotecaTreino } = useApp();
  const { user } = useAuth();

  // professorId correto — user.linkedId é o ID do registro Professor
  const professorId = user?.linkedId || user?.id || '';

  const [pastas, setPastas] = useState(() => getPastas(professorId));
  const [pastaSelecionada, setPastaSelecionada] = useState('');
  const [criandoNova, setCriandoNova] = useState(false);
  const [nomePasta, setNomePasta] = useState('Nova pasta');
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const confirmarNovaPasta = () => {
    let nome = nomePasta.trim() || 'Nova pasta';
    if (pastas.includes(nome)) {
      let n = 2;
      while (pastas.includes(`${nome} (${n})`)) n++;
      nome = `${nome} (${n})`;
    }
    const novas = [...pastas, nome];
    savePastasStorage(professorId, novas);
    setPastas(novas);
    setPastaSelecionada(nome);
    setCriandoNova(false);
  };

  const iniciarNovaPasta = () => {
    setNomePasta('Nova pasta');
    setCriandoNova(true);
  };

  const handleSalvar = async () => {
    if (!pastaSelecionada) return;
    setSalvando(true);
    await addBibliotecaTreino({
      nome: treino.nome,
      descricao: treino.descricao || '',
      nivel: treino.nivel,
      objetivo: treino.objetivo,
      sessoes: treino.sessoes || [],
      pasta: pastaSelecionada,
      professorId,
      cor: '#a78bfa',
    });
    setSalvando(false);
    setSalvo(true);
    setTimeout(onClose, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: '#080d1a', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#a78bfa20' }}>
              <FolderPlus size={16} color="#a78bfa" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Salvar em Treinos Personalizados</h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">{treino.nome}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X size={16} color="#6b7280" /></button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 px-5 py-2 text-xs"
          style={{ background: '#060b18', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <Folder size={11} color="#a78bfa" />
          <span style={{ color: '#a78bfa' }}>Treinos Personalizados</span>
          {pastaSelecionada && <><ChevronRight size={11} className="text-slate-600" /><span className="text-white">{pastaSelecionada}</span></>}
        </div>

        {/* Lista de pastas */}
        <div className="p-3" style={{ minHeight: 180, maxHeight: 260, overflowY: 'auto' }}>
          {pastas.length === 0 && !criandoNova && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Folder size={32} className="mb-2 opacity-20 text-slate-400" />
              <p className="text-xs text-slate-500">Nenhuma pasta criada</p>
              <p className="text-xs text-slate-600">Clique em "Nova Pasta" abaixo</p>
            </div>
          )}

          {pastas.map(p => (
            <button key={p}
              onClick={() => { setPastaSelecionada(p); setCriandoNova(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left group mb-1"
              style={{
                background: pastaSelecionada === p ? '#a78bfa20' : 'transparent',
                border: `1px solid ${pastaSelecionada === p ? '#a78bfa35' : 'transparent'}`,
              }}>
              {pastaSelecionada === p
                ? <FolderOpen size={17} color="#a78bfa" />
                : <Folder size={17} color="#4b5563" />}
              <span className={pastaSelecionada === p ? 'text-white font-semibold flex-1' : 'text-slate-400 flex-1'}>{p}</span>
              {pastaSelecionada === p && <Check size={13} color="#a78bfa" />}
            </button>
          ))}

          {/* Criação inline estilo Windows */}
          {criandoNova && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1"
              style={{ background: '#a78bfa18', border: '1px solid #a78bfa35' }}>
              <FolderOpen size={17} color="#a78bfa" />
              <input
                autoFocus
                value={nomePasta}
                onChange={e => setNomePasta(e.target.value)}
                onFocus={e => e.target.select()}
                onBlur={confirmarNovaPasta}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmarNovaPasta();
                  if (e.key === 'Escape') { setCriandoNova(false); }
                }}
                className="flex-1 text-sm text-white font-semibold outline-none bg-transparent"
                style={{ borderBottom: '1px solid #a78bfa50' }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: '#080d1a' }}>
          <button onClick={iniciarNovaPasta}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: '#a78bfa12', color: '#a78bfa', border: '1px solid #a78bfa25' }}>
            <FolderPlus size={13} />Nova Pasta
          </button>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Cancelar
            </button>
            <button onClick={handleSalvar}
              disabled={!pastaSelecionada || salvando || salvo}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all"
              style={{
                background: salvo ? 'linear-gradient(135deg, #34d399, #059669)'
                  : pastaSelecionada ? 'linear-gradient(135deg, #a78bfa, #7c3aed)' : '#374151',
                opacity: !pastaSelecionada ? 0.5 : 1,
              }}>
              {salvo ? '✓ Salvo!' : salvando ? '⏳...' : 'Salvar aqui'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}