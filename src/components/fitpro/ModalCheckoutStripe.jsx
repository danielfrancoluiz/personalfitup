import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  X, CreditCard, CheckCircle2, AlertCircle, Loader2, Lock, Smartphone, QrCode, Copy,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { resolvePublishableKey } from '@/lib/stripe-config';

const METODOS = [
  { id: 'credito', label: 'Crédito', icon: CreditCard, color: '#a5b4fc' },
  { id: 'debito', label: 'Débito', icon: CreditCard, color: '#34d399' },
  { id: 'pix', label: 'PIX', icon: Smartphone, color: '#00E87A' },
];

const ELEMENT_STYLE = {
  base: {
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    lineHeight: '24px',
    '::placeholder': { color: '#64748b' },
  },
  invalid: { color: '#ef4444', iconColor: '#ef4444' },
};

/* Campo Stripe com label e contêiner visível */
function SField({ label, children }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500 mb-1 font-medium">{label}</p>
      <div
        className="px-3 rounded-xl w-full"
        style={{
          background: '#1e2a3a',
          border: '1px solid rgba(255,255,255,0.08)',
          minHeight: 52,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* Formulário de pagamento — precisa estar dentro de <Elements> */
function Formulario({ transacao, aluno, metodo, valor, maxParcelas, onClose, onSucesso }) {
  const stripe = useStripe();
  const elements = useElements();

  const [comprador, setComprador] = useState({
    nome: aluno?.nome || '',
    email: aluno?.email || '',
    cpf: '',
  });
  const [parcelas, setParcelas] = useState('1');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(null);
  const [pixCopiado, setPixCopiado] = useState(false);

  const pixCode = '00020126580014BR.GOV.BCB.PIX0136personalfitup@pagamento.com.br5204000053039865802BR5913Personal Fit Up6009SAO PAULO62070503***6304ABCD';

  const pagar = async () => {
    if (metodo === 'pix') {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setOk({ tipo: 'pix', msg: 'PIX gerado! Aguardando confirmação do pagamento.' });
      }, 600);
      return;
    }

    if (!stripe || !elements) {
      setErro('Stripe ainda está inicializando. Aguarde alguns segundos e tente de novo.');
      return;
    }

    const cardEl = elements.getElement(CardNumberElement);
    if (!cardEl) {
      setErro('Formulário de cartão não encontrado. Recarregue a página.');
      return;
    }

    if (!comprador.nome.trim() || !comprador.email.includes('@')) {
      setErro('Preencha nome e e-mail.');
      return;
    }
    if (comprador.cpf.replace(/\D/g, '').length < 11) {
      setErro('Informe o CPF (11 dígitos).');
      return;
    }

    setErro('');
    setLoading(true);

    try {
      const res = await base44.functions.invoke('stripeCheckout', {
        transacaoId: transacao.id,
        valor: transacao.valor,
        descricao: transacao.descricao,
        metodo,
        parcelas: metodo === 'debito' ? '1' : parcelas,
        comprador,
      });

      const data = res?.data;
      if (!data?.clientSecret) {
        setErro(data?.error || 'Erro ao iniciar pagamento.');
        return;
      }

      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: cardEl,
            billing_details: { name: comprador.nome, email: comprador.email },
          },
        },
      );

      if (stripeErr) {
        setErro(stripeErr.message || 'Cartão recusado.');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        setOk({ tipo: 'pago', msg: 'Pagamento aprovado com sucesso!', id: paymentIntent.id });
        onSucesso?.();
      } else {
        setOk({ tipo: 'analise', msg: 'Pagamento em análise. Aguarde a confirmação.' });
      }
    } catch {
      setErro('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  /* Resultado */
  if (ok) {
    return (
      <div className="px-5 py-8 text-center">
        {ok.tipo === 'pago' && <>
          <CheckCircle2 size={52} color="#00E87A" className="mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Pagamento Aprovado!</h3>
          <p className="text-slate-400 text-sm mb-2">{ok.msg}</p>
          <p className="text-2xl font-black" style={{ color: '#00E87A' }}>R$ {valor.toFixed(2)}</p>
        </>}
        {ok.tipo === 'pix' && <>
          <Smartphone size={52} color="#00E87A" className="mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">PIX Gerado!</h3>
          <p className="text-slate-400 text-sm mb-3">{ok.msg}</p>
          <div className="w-full p-3 rounded-xl text-[11px] font-mono break-all text-slate-400 mb-3 text-left"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {pixCode}
          </div>
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(pixCode); setPixCopiado(true); setTimeout(() => setPixCopiado(false), 2000); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: pixCopiado ? '#00E87A20' : '#1e2a3a', color: pixCopiado ? '#00E87A' : '#94a3b8' }}
          >
            <Copy size={14} /> {pixCopiado ? 'Copiado!' : 'Copiar código PIX'}
          </button>
        </>}
        {ok.tipo === 'analise' && <>
          <Loader2 size={40} color="#fbbf24" className="animate-spin mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Pagamento em análise</h3>
          <p className="text-slate-400 text-sm">{ok.msg}</p>
        </>}
        <button type="button" onClick={onClose}
          className="mt-6 px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #00E87A, #059669)' }}>
          Fechar
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Resumo */}
      <div className="mx-5 mt-4 mb-3 p-3 rounded-xl flex items-center justify-between gap-2"
        style={{ background: '#635bff10', border: '1px solid #635bff25' }}>
        <div className="min-w-0">
          <p className="text-xs text-slate-400 truncate">{transacao?.descricao}</p>
          <p className="text-xs text-slate-500 truncate">{aluno?.nome}</p>
        </div>
        <p className="text-base font-black flex-shrink-0" style={{ color: '#a5b4fc' }}>R$ {valor.toFixed(2)}</p>
      </div>

      {/* Conteúdo com scroll */}
      <div className="px-5 pb-3 space-y-3 overflow-y-auto" style={{ maxHeight: 'min(52vh, 400px)' }}>
        {metodo === 'pix' ? (
          <div className="p-4 rounded-xl text-center space-y-2"
            style={{ background: '#00E87A08', border: '1px solid #00E87A20' }}>
            <QrCode size={36} className="mx-auto" color="#00E87A" />
            <p className="text-sm text-white font-semibold">Toque em &quot;Gerar PIX&quot; abaixo</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Dados do comprador</p>
              {[
                { key: 'nome', placeholder: 'Nome completo', type: 'text', inputMode: 'text', autoComplete: 'name' },
                { key: 'cpf', placeholder: 'CPF (somente números)', type: 'text', inputMode: 'numeric', autoComplete: 'off' },
                { key: 'email', placeholder: 'E-mail', type: 'email', inputMode: 'email', autoComplete: 'email' },
              ].map(({ key, ...rest }) => (
                <input
                  key={key}
                  value={comprador[key]}
                  onChange={(e) => setComprador((c) => ({ ...c, [key]: e.target.value }))}
                  className="w-full px-3 py-3 rounded-xl text-base text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
                  {...rest}
                />
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Dados do cartão</p>
              <SField label="Número">
                <CardNumberElement options={{ style: ELEMENT_STYLE, showIcon: true }} className="w-full" />
              </SField>
              <SField label="Validade">
                <CardExpiryElement options={{ style: ELEMENT_STYLE }} className="w-full" />
              </SField>
              <SField label="CVV">
                <CardCvcElement options={{ style: ELEMENT_STYLE }} className="w-full" />
              </SField>
              {metodo === 'credito' && maxParcelas > 1 && (
                <select
                  value={parcelas}
                  onChange={(e) => setParcelas(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl text-base text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={String(n)}>
                      {n === 1 ? `À vista — R$ ${valor.toFixed(2)}` : `${n}x de R$ ${(valor / n).toFixed(2)}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </>
        )}

        {erro && (
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: '#ef444415', border: '1px solid #ef444430' }}>
            <AlertCircle size={14} color="#ef4444" className="mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-400">{erro}</p>
          </div>
        )}
      </div>

      {/* Botão */}
      <div className="px-5 pt-2 pb-5 border-t mt-2" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <button
          type="button"
          onClick={pagar}
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
          style={{
            background: metodo === 'pix'
              ? 'linear-gradient(135deg, #00E87A, #059669)'
              : 'linear-gradient(135deg, #635bff, #00AAFF)',
          }}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Processando...</>
            : metodo === 'pix'
              ? <><Smartphone size={16} /> Gerar PIX — R$ {valor.toFixed(2)}</>
              : <><CreditCard size={16} /> Pagar R$ {valor.toFixed(2)}</>}
        </button>
        <p className="text-[10px] text-center text-slate-600 mt-2 flex items-center justify-center gap-1">
          <Lock size={10} /> Pagamento seguro via Stripe
        </p>
      </div>
    </>
  );
}

export default function ModalCheckoutStripe({ transacao, aluno, onClose, onSucesso }) {
  const [metodo, setMetodo] = useState('credito');
  const [publishableKey, setPublishableKey] = useState('');
  const [loadingKey, setLoadingKey] = useState(true);
  const [keyErro, setKeyErro] = useState('');

  const valor = parseFloat(transacao?.valor || 0);
  const maxParcelas = (() => {
    try { return parseInt(JSON.parse(localStorage.getItem('fitpro_stripe_config') || '{}').parcelasMax) || 12; }
    catch { return 12; }
  })();

  useEffect(() => {
    let cancelled = false;
    resolvePublishableKey()
      .then((pk) => { if (!cancelled) { setPublishableKey(pk || ''); setLoadingKey(false); } })
      .catch(() => { if (!cancelled) { setLoadingKey(false); setKeyErro('Erro ao carregar configuração do Stripe.'); } });
    return () => { cancelled = true; };
  }, []);

  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  if (typeof document === 'undefined') return null;

  const conteudo = (
    loadingKey ? (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 size={28} className="animate-spin text-slate-500" />
        <p className="text-xs text-slate-500">Carregando configuração...</p>
      </div>
    ) : keyErro || !publishableKey && metodo !== 'pix' ? (
      <div className="py-10 px-5 text-center">
        <AlertCircle size={32} color="#fbbf24" className="mx-auto mb-3" />
        <p className="text-sm text-white font-semibold mb-2">Stripe não configurado</p>
        <p className="text-xs text-slate-400">
          {keyErro || 'O administrador precisa salvar as chaves em Financeiro → Stripe.'}
        </p>
        {metodo === 'pix' && <p className="text-xs text-slate-400 mt-2">Para PIX, selecione PIX acima.</p>}
      </div>
    ) : null
  );

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center p-3"
      style={{ background: 'rgba(0,0,0,0.82)', zIndex: 9999 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ background: '#080d1a', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: '#635bff20', border: '1px solid #635bff40' }}>
              <CreditCard size={15} color="#a5b4fc" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Pagamento Seguro</p>
              <p className="text-[10px] text-slate-500">Stripe</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
            <X size={18} color="#9ca3af" />
          </button>
        </div>

        {/* Seletor de método */}
        <div className="px-5 pt-3 pb-2">
          <div className="grid grid-cols-3 gap-2">
            {METODOS.map((m) => {
              const Icon = m.icon;
              const ativo = metodo === m.id;
              return (
                <button key={m.id} type="button"
                  onClick={() => setMetodo(m.id)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
                  style={{
                    background: ativo ? `${m.color}15` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${ativo ? `${m.color}40` : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  <Icon size={16} style={{ color: ativo ? m.color : '#64748b' }} />
                  <span className="text-[11px] font-semibold" style={{ color: ativo ? m.color : '#64748b' }}>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo */}
        {conteudo || (
          publishableKey || metodo === 'pix' ? (
            publishableKey ? (
              <Elements stripe={stripePromise}>
                <Formulario
                  transacao={transacao}
                  aluno={aluno}
                  metodo={metodo}
                  valor={valor}
                  maxParcelas={maxParcelas}
                  onClose={onClose}
                  onSucesso={onSucesso}
                />
              </Elements>
            ) : (
              /* PIX sem stripe key */
              <Formulario
                transacao={transacao}
                aluno={aluno}
                metodo={metodo}
                valor={valor}
                maxParcelas={maxParcelas}
                onClose={onClose}
                onSucesso={onSucesso}
                stripe={null}
                elements={null}
              />
            )
          ) : null
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
