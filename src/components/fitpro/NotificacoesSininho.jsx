import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, MessageCircle, CheckCircle2, Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getCredentials } from '../../lib/fitpro-storage';

export default function NotificacoesSininho({ user }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkedId, setLinkedId] = useState('');
  const dropdownRef = useRef(null);

  // Resolve o linkedId do usuário (professorId ou alunoId)
  useEffect(() => {
    if (!user?.id) return;
    getCredentials().then(creds => {
      const myCred = creds.find(c => c.id === user.id);
      setLinkedId(myCred?.linkedId || '');
    });
  }, [user?.id]);

  const fetchNotifs = async () => {
    if (!linkedId) return;
    setLoading(true);
    try {
      if (user?.role === 'professor') {
        // Professor vê feedbacks de treino não lidos dos seus alunos
        const all = await base44.entities.FeedbackTreino.filter({ professorId: linkedId, lido: false });
        setNotifs(all.sort((a, b) => new Date(b.data) - new Date(a.data)));
      } else if (user?.role === 'aluno') {
        // Aluno vê feedbacks que têm resposta do professor ainda não lida
        const all = await base44.entities.FeedbackTreino.filter({ alunoId: linkedId });
        const comResposta = all.filter(f => f.resposta && !f.alunoLeu);
        setNotifs(comResposta.sort((a, b) => new Date(b.dataResposta || b.data) - new Date(a.dataResposta || a.data)));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (linkedId) fetchNotifs();
  }, [linkedId]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const marcarComoLido = async (notif) => {
    try {
      if (user?.role === 'professor') {
        await base44.entities.FeedbackTreino.update(notif.id, { lido: true });
      } else {
        await base44.entities.FeedbackTreino.update(notif.id, { alunoLeu: true });
      }
      setNotifs(prev => prev.filter(n => n.id !== notif.id));
    } catch {}
  };

  const marcarTodosLidos = async () => {
    for (const n of notifs) {
      await marcarComoLido(n);
    }
  };

  const count = notifs.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifs(); }}
        className="p-2 rounded-xl hover:bg-white/5 relative transition-all"
      >
        <Bell size={16} color={count > 0 ? '#f472b6' : '#6b7280'} />
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-black text-white px-1"
            style={{ background: '#f472b6', fontSize: 10, lineHeight: 1 }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50 shadow-2xl"
          style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2">
              <Bell size={14} color="#f472b6" />
              <span className="text-sm font-bold text-white">Notificações</span>
              {count > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#f472b620', color: '#f472b6' }}>
                  {count}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <button onClick={marcarTodosLidos} className="text-xs text-slate-500 hover:text-slate-300 transition-all">
                  Marcar tudo lido
                </button>
              )}
              <button onClick={() => setOpen(false)}><X size={14} color="#6b7280" /></button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-slate-600 border-t-pink-400 rounded-full animate-spin" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Bell size={28} color="#334155" />
                <p className="text-sm text-slate-500">Nenhuma notificação</p>
              </div>
            ) : (
              notifs.map(notif => (
                <div key={notif.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-all"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: user?.role === 'professor' ? '#f472b615' : '#34d39915' }}>
                    {user?.role === 'professor'
                      ? <Trophy size={14} color="#f472b6" />
                      : <MessageCircle size={14} color="#34d399" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white leading-relaxed">
                      {user?.role === 'professor'
                        ? notif.mensagem
                        : `💬 Resposta do professor no treino "${notif.treinoNome}": ${notif.resposta}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {notif.data ? new Date(notif.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                  <button onClick={() => marcarComoLido(notif)}
                    className="flex-shrink-0 mt-0.5 p-1 rounded-lg hover:bg-white/10 transition-all"
                    title="Marcar como lido">
                    <CheckCircle2 size={14} color="#475569" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}