import React, { useState, useEffect } from 'react';
import { X, MessageSquarePlus, Send, CornerDownRight, Clock, CheckCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FeedbackTreinoModal({ treino, aluno, onClose }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (!aluno?.id || !treino?.id) { setLoading(false); return; }
    base44.entities.FeedbackTreino.filter({ alunoId: aluno.id, treinoId: treino.id })
      .then(list => {
        setFeedbacks([...list].sort((a, b) => new Date(a.data) - new Date(b.data)));
      })
      .finally(() => setLoading(false));
  }, [aluno?.id, treino?.id]);

  const handleSalvar = async () => {
    if (!mensagem.trim()) return;
    setSalvando(true);
    const novo = await base44.entities.FeedbackTreino.create({
      treinoId: treino.id,
      treinoNome: treino.nome,
      alunoId: aluno?.id || '',
      alunoNome: aluno?.nome || '',
      professorId: treino.professorId || '',
      mensagem: mensagem.trim(),
      lido: false,
      data: new Date().toISOString(),
    });
    setFeedbacks(fs => [...fs, novo]);
    setMensagem('');
    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: '#080d1a', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#60a5fa20' }}>
              <MessageSquarePlus size={16} color="#60a5fa" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Feedback do Treino</h3>
              <p className="text-xs text-slate-500 truncate max-w-[220px]">{treino.nome}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X size={16} color="#6b7280" /></button>
        </div>

        {/* Histórico de mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
          {loading ? (
            <p className="text-center text-xs text-slate-500 py-6">Carregando...</p>
          ) : feedbacks.length === 0 ? (
            <p className="text-center text-xs text-slate-600 py-6">Nenhum feedback enviado ainda para este treino.</p>
          ) : feedbacks.map(f => (
            <div key={f.id} className="space-y-2">
              {/* Mensagem do aluno */}
              <div className="p-3 rounded-xl" style={{ background: '#60a5fa0d', border: '1px solid #60a5fa25' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-400">Você</span>
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    {f.lido ? <CheckCheck size={11} color="#34d399" /> : <Clock size={11} color="#60a5fa" />}
                    <span>{new Date(f.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{f.mensagem}</p>
              </div>

              {/* Resposta do professor */}
              {f.resposta && (
                <div className="ml-4 p-3 rounded-xl flex gap-2" style={{ background: '#34d39908', border: '1px solid #34d39930' }}>
                  <CornerDownRight size={13} color="#34d399" className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-emerald-400">Professor</span>
                      {f.dataResposta && (
                        <span className="text-xs text-slate-600">
                          {new Date(f.dataResposta).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{f.resposta}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input envio */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: '#080d1a' }}>
          <p className="text-xs text-slate-500 mb-3">Nova observação para o professor:</p>
          <textarea
            autoFocus
            value={mensagem}
            onChange={e => setMensagem(e.target.value)}
            placeholder="Ex: Senti dificuldade no exercício X, tive dor no ombro..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none resize-none mb-3"
            style={{ background: '#1e2a3a', border: '1px solid #60a5fa30' }}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Fechar
            </button>
            <button onClick={handleSalvar}
              disabled={!mensagem.trim() || salvando || salvo}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all"
              style={{
                background: salvo
                  ? 'linear-gradient(135deg, #34d399, #059669)'
                  : mensagem.trim()
                    ? 'linear-gradient(135deg, #60a5fa, #3b82f6)'
                    : '#374151',
                opacity: !mensagem.trim() ? 0.5 : 1,
              }}>
              {salvo ? '✓ Enviado!' : salvando ? '⏳...' : <><Send size={12} />Enviar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}