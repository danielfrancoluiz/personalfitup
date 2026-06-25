import React, { useState, useEffect } from 'react';
import { X, UserCheck, Users, Link, CheckCircle2, Search, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/FitProContext';
import { base44 } from '@/api/base44Client';

const BORDER = 'rgba(255,255,255,0.07)';

export default function VincularAlunoProfessorModal({ onClose }) {
  const { alunos, professores, updateAluno } = useApp();
  const [search, setSearch] = useState('');
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState([]);

  useEffect(() => {
    base44.entities.SolicitacaoVinculo.filter({ status: 'pendente' })
      .then(setSolicitacoes);
  }, []);

  const alunosFiltrados = alunos.filter(a =>
    a.nome.toLowerCase().includes(search.toLowerCase()) ||
    (a.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleVincular = async () => {
    if (!selectedAluno || !selectedProfessor) return;
    setSalvando(true);
    await updateAluno(selectedAluno.id, { professorId: selectedProfessor });
    // Aceita solicitações pendentes desse aluno
    const sols = await base44.entities.SolicitacaoVinculo.filter({ alunoId: selectedAluno.id, status: 'pendente' });
    for (const s of sols) {
      await base44.entities.SolicitacaoVinculo.update(s.id, {
        status: 'aceito',
        professorId: selectedProfessor,
        professorNome: professores.find(p => p.id === selectedProfessor)?.nome || '',
        dataResposta: new Date().toISOString(),
      });
    }
    setSucesso(true);
    setSolicitacoes(prev => prev.filter(s => s.alunoId !== selectedAluno.id));
    setTimeout(() => { setSucesso(false); setSelectedAluno(null); setSelectedProfessor(''); }, 1500);
    setSalvando(false);
  };

  const handleAceitarSolicitacao = async (sol) => {
    const aluno = alunos.find(a => a.id === sol.alunoId);
    if (!aluno) return;
    setSalvando(true);
    await updateAluno(aluno.id, { professorId: sol.professorId });
    await base44.entities.SolicitacaoVinculo.update(sol.id, {
      status: 'aceito',
      dataResposta: new Date().toISOString(),
    });
    setSolicitacoes(prev => prev.filter(s => s.id !== sol.id));
    setSalvando(false);
  };

  const handleRecusarSolicitacao = async (sol) => {
    await base44.entities.SolicitacaoVinculo.update(sol.id, {
      status: 'recusado',
      dataResposta: new Date().toISOString(),
    });
    setSolicitacoes(prev => prev.filter(s => s.id !== sol.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#0d1525', border: `1px solid ${BORDER}`, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: '#080d1a', borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#34d39920' }}>
              <Link size={16} color="#34d399" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Vincular Aluno ao Professor</h3>
              <p className="text-xs text-slate-500">Gerencie os vínculos de alunos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X size={16} color="#6b7280" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Solicitações pendentes */}
          {solicitacoes.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                Solicitações Pendentes ({solicitacoes.length})
              </h4>
              <div className="space-y-2">
                {solicitacoes.map(sol => {
                  const prof = professores.find(p => p.id === sol.professorId);
                  return (
                    <div key={sol.id} className="p-3 rounded-xl"
                      style={{ background: '#fbbf2408', border: '1px solid #fbbf2430' }}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{sol.alunoNome}</p>
                          <p className="text-xs text-slate-400">Quer se vincular a: <span className="text-white">{prof?.nome || sol.professorNome}</span></p>
                          {sol.mensagem && <p className="text-xs text-slate-500 mt-0.5 italic">"{sol.mensagem}"</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAceitarSolicitacao(sol)} disabled={salvando}
                          className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
                          style={{ background: '#34d39920', color: '#34d399', border: '1px solid #34d39930' }}>
                          ✓ Aceitar
                        </button>
                        <button onClick={() => handleRecusarSolicitacao(sol)} disabled={salvando}
                          className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
                          style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' }}>
                          ✕ Recusar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vincular manualmente */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Vincular Manualmente</h4>

            {/* Busca de aluno */}
            <div className="mb-3">
              <label className="text-xs text-slate-400 block mb-1">Selecionar Aluno</label>
              <div className="relative mb-2">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar aluno..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              {selectedAluno ? (
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: '#a78bfa15', border: '1px solid #a78bfa30' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                    style={{ background: '#a78bfa25' }}>{selectedAluno.nome.charAt(0)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{selectedAluno.nome}</p>
                    <p className="text-xs text-slate-400">{selectedAluno.email}</p>
                  </div>
                  <button onClick={() => setSelectedAluno(null)} className="p-1 rounded hover:bg-white/5">
                    <X size={13} color="#6b7280" />
                  </button>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {alunosFiltrados.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">Nenhum aluno encontrado</p>
                  ) : alunosFiltrados.map(a => {
                    const profAtual = professores.find(p => p.id === a.professorId);
                    return (
                      <button key={a.id} onClick={() => { setSelectedAluno(a); setSelectedProfessor(a.professorId || ''); setSearch(''); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-left transition-all"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                          style={{ background: '#a78bfa20' }}>{a.nome.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{a.nome}</p>
                          <p className="text-xs text-slate-500">{profAtual ? `Prof: ${profAtual.nome}` : 'Sem professor'}</p>
                        </div>
                        <ChevronRight size={12} color="#475569" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Seleção do professor */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 block mb-1">Selecionar Professor</label>
              <select value={selectedProfessor} onChange={e => setSelectedProfessor(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                <option value="">Selecionar professor...</option>
                {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            <button onClick={handleVincular}
              disabled={!selectedAluno || !selectedProfessor || salvando}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style={{
                background: sucesso
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : (!selectedAluno || !selectedProfessor)
                    ? '#1e2a3a'
                    : 'linear-gradient(135deg, #34d399, #059669)',
                color: (!selectedAluno || !selectedProfessor) ? '#475569' : '#fff',
                opacity: salvando ? 0.7 : 1,
              }}>
              {sucesso ? '✓ Vinculado com sucesso!' : salvando ? 'Vinculando...' : 'Vincular Aluno ao Professor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}