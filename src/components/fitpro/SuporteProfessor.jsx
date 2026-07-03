import React, { useState } from 'react';
import { LifeBuoy, X, Send, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

const SUPORTE_EMAIL = 'comercial@trafficclicks.com.br';

const inpClass = 'w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none';
const inpStyle = { background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' };

function abrirEmailSuporte({ nome, email, assunto, mensagem }) {
  const corpo = [
    `Nome: ${nome}`,
    `Email: ${email}`,
    '',
    mensagem,
  ].join('\n');
  const url = `mailto:${SUPORTE_EMAIL}?subject=${encodeURIComponent(`[Personal Fit Up] ${assunto}`)}&body=${encodeURIComponent(corpo)}`;
  window.location.href = url;
}

export default function SuporteProfessor({ user }) {
  const [open, setOpen] = useState(false);
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);

  const fechar = () => {
    setOpen(false);
    setErro('');
    setEnviado(false);
    setAssunto('');
    setMensagem('');
  };

  const handleEnviar = (e) => {
    e.preventDefault();
    setErro('');
    if (!assunto.trim()) return setErro('Informe o assunto.');
    if (!mensagem.trim()) return setErro('Informe sua mensagem.');

    abrirEmailSuporte({
      nome: user?.nome || 'Professor',
      email: user?.email || '',
      assunto: assunto.trim(),
      mensagem: mensagem.trim(),
    });
    setEnviado(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-white/5 transition-colors"
        style={{ color: '#34d399' }}
        aria-label="Suporte"
      >
        Suporte
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={(e) => { if (e.target === e.currentTarget) fechar(); }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: '#080d1a', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#34d39920' }}>
                  <LifeBuoy size={17} color="#34d399" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Suporte</h3>
                  <p className="text-xs text-slate-500">Envie um e-mail para nossa equipe</p>
                </div>
              </div>
              <button type="button" onClick={fechar} className="p-1.5 rounded-lg hover:bg-white/5">
                <X size={16} color="#6b7280" />
              </button>
            </div>

            <div className="p-6">
              {enviado ? (
                <div className="text-center space-y-4 py-4">
                  <CheckCircle2 size={40} color="#34d399" className="mx-auto" />
                  <p className="text-sm text-slate-300">
                    Seu aplicativo de e-mail foi aberto com a mensagem para{' '}
                    <strong className="text-white">{SUPORTE_EMAIL}</strong>.
                    Basta clicar em <strong className="text-white">Enviar</strong> no e-mail para concluir.
                  </p>
                  <button
                    type="button"
                    onClick={fechar}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white"
                    style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnviar} className="space-y-4">
                  <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: '#34d3990a', border: '1px solid #34d39925' }}>
                    <Mail size={14} color="#34d399" className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400">
                      Ao clicar em enviar, abriremos seu e-mail (Gmail, Outlook etc.) já preenchido para{' '}
                      <span className="text-slate-300">{SUPORTE_EMAIL}</span>. Não precisa configurar nada.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Seu nome</label>
                    <input value={user?.nome || ''} readOnly className={`${inpClass} opacity-70`} style={inpStyle} />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Seu email</label>
                    <input value={user?.email || ''} readOnly className={`${inpClass} opacity-70`} style={inpStyle} />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Assunto</label>
                    <input
                      value={assunto}
                      onChange={(e) => setAssunto(e.target.value)}
                      placeholder="Ex: Dúvida sobre meu plano"
                      required
                      className={inpClass}
                      style={inpStyle}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Mensagem</label>
                    <textarea
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      placeholder="Descreva sua dúvida ou solicitação..."
                      required
                      rows={5}
                      className={`${inpClass} resize-none`}
                      style={inpStyle}
                    />
                  </div>

                  {erro && (
                    <div className="flex items-center gap-2 text-xs text-red-400 p-3 rounded-xl" style={{ background: '#ef444412', border: '1px solid #ef444430' }}>
                      <AlertCircle size={12} />
                      {erro}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}
                  >
                    <Send size={15} />
                    Abrir e-mail
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
