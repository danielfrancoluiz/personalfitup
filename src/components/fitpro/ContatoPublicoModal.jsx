import React, { useState } from 'react';
import { MessageCircle, Mail, CheckCircle2, AlertCircle, X } from 'lucide-react';

const WHATSAPP_NUMERO = '5563999836349';
const EMAIL_CONTATO = 'Comercial@trafficclicks.com.br';

const inpClass = 'w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none';
const inpStyle = { background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' };

export default function ContatoPublicoModal({ onClose }) {
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(null); // 'whatsapp' | 'email'

  const textoCompleto = () => {
    const partes = [];
    if (nome.trim()) partes.push(`Olá! Meu nome é ${nome.trim()}.`);
    else partes.push('Olá! Vim pelo site Personal Fit Up.');
    partes.push('');
    partes.push(mensagem.trim());
    return partes.join('\n');
  };

  const validar = () => {
    setErro('');
    if (!mensagem.trim()) {
      setErro('Digite sua mensagem.');
      return false;
    }
    return true;
  };

  const enviarWhatsApp = () => {
    if (!validar()) return;
    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(textoCompleto())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setEnviado('whatsapp');
  };

  const enviarEmail = () => {
    if (!validar()) return;
    const assunto = nome.trim()
      ? `[Personal Fit Up] Contato — ${nome.trim()}`
      : '[Personal Fit Up] Contato pelo site';
    const url = `mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(textoCompleto())}`;
    window.location.href = url;
    setEnviado('email');
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: '#080d1a', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <h3 className="text-sm font-bold text-white">Falar conosco</h3>
            <p className="text-xs text-slate-500 mt-0.5">WhatsApp ou e-mail — escolha o que preferir</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5">
            <X size={16} color="#6b7280" />
          </button>
        </div>

        {enviado ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: '#25d36620' }}>
              <CheckCircle2 size={28} color="#25d366" />
            </div>
            <p className="text-sm text-white font-semibold">
              {enviado === 'whatsapp' ? 'Abrindo o WhatsApp…' : 'Abrindo seu e-mail…'}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {enviado === 'whatsapp'
                ? 'Se o WhatsApp não abriu, verifique se o app está instalado ou tente novamente.'
                : 'Se o app de e-mail não abriu, tente novamente ou use outro dispositivo.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Seu nome (opcional)</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como podemos te chamar?"
                className={inpClass}
                style={inpStyle}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Mensagem</label>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={4}
                placeholder="Como podemos ajudar?"
                className={`${inpClass} resize-none`}
                style={inpStyle}
              />
            </div>

            {erro && (
              <div className="flex items-center gap-2 text-xs text-red-400 p-2.5 rounded-xl" style={{ background: '#ef444412', border: '1px solid #ef444430' }}>
                <AlertCircle size={12} />{erro}
              </div>
            )}

            <button
              type="button"
              onClick={enviarWhatsApp}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}
            >
              <MessageCircle size={16} />
              Enviar pelo WhatsApp
            </button>

            <button
              type="button"
              onClick={enviarEmail}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:bg-white/[0.03]"
              style={{ background: 'transparent', border: '1px solid rgba(0,170,255,0.35)', color: '#00AAFF' }}
            >
              <Mail size={16} />
              Enviar por e-mail
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Botão compacto para abrir o modal de contato */
export function BotaoFalarConosco({ className = '', style }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full p-5 rounded-2xl text-left transition-all hover:scale-[1.01] ${className}`}
        style={style || { background: '#25d36610', border: '1px solid #25d36630' }}
      >
        <div className="flex items-center gap-3 mb-1">
          <MessageCircle size={20} color="#25d366" />
          <span className="font-bold text-white">Falar conosco</span>
        </div>
        <p className="text-sm text-slate-400 ml-8">Dúvidas? Fale pelo WhatsApp ou e-mail</p>
      </button>
      {open && <ContatoPublicoModal onClose={() => setOpen(false)} />}
    </>
  );
}
