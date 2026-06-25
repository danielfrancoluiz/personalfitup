import React, { useEffect, useState } from 'react';
import { X, ClipboardList, CheckCircle2, XCircle, Clock, AlertTriangle, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PERGUNTAS = [
  { id: 'p1', texto: 'Algum médico já disse que você possui algum problema de coração e que só deveria realizar atividade física supervisionado por profissional de saúde?' },
  { id: 'p2', texto: 'Você sente dores no peito quando pratica atividade física?' },
  { id: 'p3', texto: 'No último mês, você sentiu dores no peito quando não estava praticando atividade física?' },
  { id: 'p4', texto: 'Você perdeu o equilíbrio devido a tontura ou perdeu a consciência em alguma ocasião recentemente?' },
  { id: 'p5', texto: 'Você tem algum problema ósseo ou articular (por exemplo, nas costas, joelho ou quadril) que poderia ser piorado pela prática de atividade física?' },
  { id: 'p6', texto: 'Algum médico já lhe receitou medicamentos para pressão arterial ou problema de coração?' },
  { id: 'p7', texto: 'Você tem conhecimento de alguma outra razão pela qual não deveria praticar atividade física?' },
];

export default function PARQVerRespostasModal({ aluno, professorId, onClose }) {
  const [resposta, setResposta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    base44.entities.PARQResposta.filter({ alunoId: aluno.id })
      .then(list => {
        const sorted = [...list].sort((a, b) => new Date(b.dataEnvio) - new Date(a.dataEnvio));
        setResposta(sorted[0] || null);
        // Marcar como lido
        sorted.filter(r => !r.lido && r.status === 'respondido').forEach(r => {
          base44.entities.PARQResposta.update(r.id, { lido: true });
        });
      })
      .finally(() => setLoading(false));
  }, [aluno.id]);

  const temSimPositivo = resposta?.respostas
    ? Object.values(resposta.respostas).some(v => v === true)
    : false;

  const handleEnviar = async () => {
    setEnviando(true);
    // Remove pendentes anteriores
    const anteriores = await base44.entities.PARQResposta.filter({ alunoId: aluno.id, status: 'pendente' });
    for (const a of anteriores) await base44.entities.PARQResposta.delete(a.id);
    await base44.entities.PARQResposta.create({
      alunoId: aluno.id,
      alunoNome: aluno.nome,
      professorId: professorId || '',
      dataEnvio: new Date().toISOString(),
      status: 'pendente',
      respostas: {},
      lido: false,
    });
    setEnviado(true);
    setEnviando(false);
    // Recarrega
    const list = await base44.entities.PARQResposta.filter({ alunoId: aluno.id });
    const sorted = [...list].sort((a, b) => new Date(b.dataEnvio) - new Date(a.dataEnvio));
    setResposta(sorted[0] || null);
    setEnviado(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: '#080d1a', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#a78bfa20' }}>
              <ClipboardList size={16} color="#a78bfa" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">PAR-Q — Prontidão para Atividade Física</h3>
              <p className="text-xs text-slate-500">{aluno.nome}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X size={16} color="#6b7280" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-500 text-sm">Carregando...</div>
          ) : !resposta ? (
            <div className="text-center py-10">
              <ClipboardList size={32} className="mx-auto mb-3 opacity-20 text-slate-400" />
              <p className="text-slate-500 text-sm">Nenhum questionário enviado ainda</p>
            </div>
          ) : resposta.status === 'pendente' ? (
            <div className="text-center py-10">
              <Clock size={32} className="mx-auto mb-3 text-yellow-400 opacity-60" />
              <p className="text-yellow-300 text-sm font-semibold">Aguardando resposta do aluno</p>
              <p className="text-slate-500 text-xs mt-1">
                Enviado em {new Date(resposta.dataEnvio).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ) : (
            <>
              {/* Status geral */}
              <div className={`flex items-center gap-3 p-4 rounded-2xl ${temSimPositivo ? 'border border-red-500/30' : 'border border-emerald-500/30'}`}
                style={{ background: temSimPositivo ? '#ef444410' : '#34d39910' }}>
                {temSimPositivo
                  ? <AlertTriangle size={20} color="#ef4444" className="flex-shrink-0" />
                  : <CheckCircle2 size={20} color="#34d399" className="flex-shrink-0" />}
                <div>
                  <p className={`text-sm font-bold ${temSimPositivo ? 'text-red-400' : 'text-emerald-400'}`}>
                    {temSimPositivo ? 'Atenção: Há respostas positivas' : 'Apto para atividade física'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {temSimPositivo
                      ? 'Consulte um médico antes de iniciar o programa'
                      : 'Nenhuma restrição identificada pelo questionário'}
                  </p>
                </div>
              </div>

              {/* Data */}
              <p className="text-xs text-slate-500">
                Respondido em {new Date(resposta.dataResposta).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>

              {/* Perguntas e respostas */}
              <div className="space-y-3">
                {PERGUNTAS.map((p, idx) => {
                  const sim = resposta.respostas?.[p.id] === true;
                  return (
                    <div key={p.id} className="p-3 rounded-xl flex items-start gap-3"
                      style={{ background: sim ? '#ef444410' : 'rgba(255,255,255,0.03)', border: `1px solid ${sim ? '#ef444430' : 'rgba(255,255,255,0.06)'}` }}>
                      <span className="text-xs font-bold text-slate-500 flex-shrink-0 mt-0.5">{idx + 1}.</span>
                      <p className="text-xs text-slate-300 flex-1 leading-relaxed">{p.texto}</p>
                      <div className={`flex items-center gap-1 flex-shrink-0 px-2 py-1 rounded-lg text-xs font-bold ${sim ? 'text-red-400' : 'text-emerald-400'}`}
                        style={{ background: sim ? '#ef444420' : '#34d39920' }}>
                        {sim ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                        {sim ? 'SIM' : 'NÃO'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Observações */}
              {resposta.observacoes && (
                <div className="p-3 rounded-xl" style={{ background: '#fbbf2410', border: '1px solid #fbbf2430' }}>
                  <p className="text-xs font-semibold text-yellow-300 mb-1">Observações do aluno</p>
                  <p className="text-sm text-slate-300">{resposta.observacoes}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-4 flex-shrink-0 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: '#080d1a' }}>
          <button onClick={handleEnviar} disabled={enviando}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff', opacity: enviando ? 0.7 : 1 }}>
            <Send size={14} />
            {enviando ? 'Enviando...' : enviado ? '✓ Enviado!' : (resposta ? 'Reenviar PAR-Q' : 'Enviar PAR-Q ao Aluno')}
          </button>
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