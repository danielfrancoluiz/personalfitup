import React, { useEffect, useState } from 'react';
import { X, MessageSquare, CheckCheck, Clock, Send, CornerDownRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VerFeedbackModal({ aluno, onClose, onMarcarLido }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respostaMap, setRespostaMap] = useState({}); // { [feedbackId]: texto digitado }
  const [enviandoMap, setEnviandoMap] = useState({}); // { [feedbackId]: boolean }

  useEffect(() => {
    base44.entities.FeedbackTreino.filter({ alunoId: aluno.id })
      .then(list => {
        const sorted = [...list].sort((a, b) => new Date(b.data) - new Date(a.data));
        setFeedbacks(sorted);
        list.filter(f => !f.lido).forEach(f => {
          base44.entities.FeedbackTreino.update(f.id, { lido: true });
        });
        if (list.some(f => !f.lido)) onMarcarLido?.();
      })
      .finally(() => setLoading(false));
  }, [aluno.id]);

  const handleResponder = async (feedbackId) => {
    const texto = (respostaMap[feedbackId] || '').trim();
    if (!texto) return;
    setEnviandoMap(m => ({ ...m, [feedbackId]: true }));
    await base44.entities.FeedbackTreino.update(feedbackId, {
      resposta: texto,
      dataResposta: new Date().toISOString(),
    });
    setFeedbacks(fs => fs.map(f => f.id === feedbackId ? { ...f, resposta: texto, dataResposta: new Date().toISOString() } : f));
    setRespostaMap(m => ({ ...m, [feedbackId]: '' }));
    setEnviandoMap(m => ({ ...m, [feedbackId]: false }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: '#080d1a', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#60a5fa20' }}>
              <MessageSquare size={16} color="#60a5fa" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Feedbacks de Treino</h3>
              <p className="text-xs text-slate-500">{aluno.nome}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X size={16} color="#6b7280" /></button>
        </div>

        {/* Lista */}
        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 500 }}>
          {loading ? (
            <div className="text-center py-10 text-slate-500 text-sm">Carregando...</div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-20 text-slate-400" />
              <p className="text-slate-500 text-sm">Nenhum feedback enviado ainda</p>
            </div>
          ) : feedbacks.map(f => (
            <div key={f.id} className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${f.lido ? 'rgba(255,255,255,0.06)' : '#60a5fa30'}` }}>

              {/* Mensagem do aluno */}
              <div className="p-4" style={{ background: f.lido ? '#1e2a3a' : '#60a5fa0d' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-300 truncate">{f.treinoNome}</span>
                  <div className="flex items-center gap-1 flex-shrink-0 text-xs text-slate-500">
                    {f.lido ? <CheckCheck size={12} color="#34d399" /> : <Clock size={12} color="#60a5fa" />}
                    <span>{new Date(f.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{f.mensagem}</p>
              </div>

              {/* Resposta existente */}
              {f.resposta && (
                <div className="px-4 py-3 flex gap-3" style={{ background: '#34d39908', borderTop: '1px solid #34d39920' }}>
                  <CornerDownRight size={14} color="#34d399" className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-400 mb-1">Sua resposta</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{f.resposta}</p>
                    {f.dataResposta && (
                      <p className="text-xs text-slate-600 mt-1">
                        {new Date(f.dataResposta).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Input para responder */}
              <div className="px-4 py-3 flex gap-2" style={{ background: '#0a0f1e', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <input
                  value={respostaMap[f.id] || ''}
                  onChange={e => setRespostaMap(m => ({ ...m, [f.id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleResponder(f.id); } }}
                  placeholder={f.resposta ? 'Atualizar resposta...' : 'Responder aluno...'}
                  className="flex-1 px-3 py-2 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <button
                  onClick={() => handleResponder(f.id)}
                  disabled={!(respostaMap[f.id] || '').trim() || enviandoMap[f.id]}
                  className="px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all"
                  style={{
                    background: (respostaMap[f.id] || '').trim() ? 'linear-gradient(135deg, #34d399, #059669)' : '#1e2a3a',
                    color: (respostaMap[f.id] || '').trim() ? '#fff' : '#475569',
                    opacity: enviandoMap[f.id] ? 0.6 : 1,
                  }}>
                  <Send size={13} />
                  {enviandoMap[f.id] ? '...' : 'Enviar'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: '#080d1a' }}>
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}