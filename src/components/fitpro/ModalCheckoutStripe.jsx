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
    fontFamily: 'system-ui, sans-serif',
    fontSize: '16px',
    lineHeight: '24px',
    '::placeholder': { color: '#64748b' },
  },
  invalid: { color: '#ef4444', iconColor: '#ef4444' },
};

function StripeField({ label, children }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500 mb-1.5 font-medium">{label}</p>
      <div
        className="px-3 py-3 rounded-xl min-h-[48px] flex items-center"
        style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {children}
      </div>
    </div>
  );
}

function CheckoutBody({
  transacao, aluno, metodo, setMetodo, valor, maxParcelas, onClose, onSucesso,
  publishableKey, loadingKey,
}) {
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
  const [resultado, setResultado] = useState(null);
  const [pixCopiado, setPixCopiado] = useState(false);

  const pixCode = `00020126580014BR.GOV.BCB.PIX0136personalfitup@pagamento.com.br5204000053039865802BR5913Personal Fit Up6009SAO PAULO62070503***6304ABCD`;
  const stripeNaoConfigurado = !loadingKey && metodo !== 'pix' && !publishableKey;

  const handlePagar = async () => {
    if (metodo === 'pix') {
      setErro('');
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setResultado({
          ok: true,
          novoStatus: 'pendente',
          mensagem: 'PIX gerado! Aguardando confirmação do pagamento.',
        });
      }, 600);
      return;
    }

    if (!stripe || !elements) {
      setErro('Stripe ainda está carregando. Aguarde um instante.');
      return;
    }

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      setErro('Formulário de cartão indisponível. Recarregue a página.');
      return;
    }

    if (!comprador.nome?.trim() || !comprador.email?.includes('@')) {
      setErro('Preencha nome e e-mail do comprador.');
      return;
    }
    if (!comprador.cpf || comprador.cpf.replace(/\D/g, '').length < 11) {
      setErro('Informe o CPF do titular.');
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
        setErro(data?.error || 'Não foi possível iniciar o pagamento.');
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: { name: comprador.nome, email: comprador.email },
        },
      });

      if (confirmError) {
        setErro(confirmError.message || 'Pagamento recusado. Verifique os dados do cartão.');
        return;
      }

      const novoStatus = paymentIntent?.status === 'succeeded' ? 'pago' : 'pendente';
      setResultado({
        ok: true,
        novoStatus,
        chargeId: paymentIntent?.id,
        mensagem: novoStatus === 'pago'
          ? 'Pagamento aprovado com sucesso!'
          : 'Pagamento em processamento. Aguarde a confirmação.',
      });
      if (novoStatus === 'pago') onSucesso?.();
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="px-5 pt-3 pb-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <p className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wide">Método</p>
        <div className="grid grid-cols-3 gap-2">
          {METODOS.map((m) => {
            const Icon = m.icon;
            const ativo = metodo === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => { setMetodo(m.id); setErro(''); }}
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

      <div className="overflow-y-auto overscroll-contain px-5 py-4" style={{ maxHeight: 'min(55vh, 420px)' }}>
        {loadingKey ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin text-slate-500" />
          </div>
        ) : stripeNaoConfigurado ? (
          <div className="py-8 text-center">
            <AlertCircle size={32} color="#fbbf24" className="mx-auto mb-3" />
            <p className="text-sm text-white font-semibold mb-2">Stripe não configurado</p>
            <p className="text-xs text-slate-400">O administrador precisa salvar as chaves em Financeiro → Stripe.</p>
          </div>
        ) : resultado ? (
          <div className="py-4 text-center">
            {resultado.novoStatus === 'pago' ? (
              <>
                <CheckCircle2 size={48} color="#00E87A" className="mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Pagamento Aprovado!</h3>
                <p className="text-slate-400 text-sm mb-2">{resultado.mensagem}</p>
                <p className="text-2xl font-black" style={{ color: '#00E87A' }}>R$ {valor.toFixed(2)}</p>
              </>
            ) : metodo === 'pix' ? (
              <>
                <Smartphone size={48} color="#00E87A" className="mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">PIX Gerado!</h3>
                <p className="text-slate-400 text-sm mb-3">{resultado.mensagem}</p>
                <div className="w-full p-3 rounded-xl text-[11px] font-mono break-all text-slate-400 mb-3 text-left"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {pixCode}
                </div>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(pixCode); setPixCopiado(true); setTimeout(() => setPixCopiado(false), 2000); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: pixCopiado ? '#00E87A20' : '#1e2a3a', color: pixCopiado ? '#00E87A' : '#94a3b8' }}
                >
                  <Copy size={14} />
                  {pixCopiado ? 'Copiado!' : 'Copiar código PIX'}
                </button>
              </>
            ) : (
              <>
                <Loader2 size={40} color="#fbbf24" className="animate-spin mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Pagamento em análise</h3>
                <p className="text-slate-400 text-sm">{resultado.mensagem}</p>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-5 px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #00E87A, #059669)' }}
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl flex items-center justify-between gap-2"
              style={{ background: '#635bff10', border: '1px solid #635bff25' }}>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 truncate">{transacao?.descricao}</p>
                <p className="text-xs text-slate-500 truncate">{aluno?.nome}</p>
              </div>
              <p className="text-lg font-black flex-shrink-0" style={{ color: '#a5b4fc' }}>R$ {valor.toFixed(2)}</p>
            </div>

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
                  <input
                    value={comprador.nome}
                    onChange={(e) => setComprador((c) => ({ ...c, nome: e.target.value }))}
                    placeholder="Nome completo"
                    className="w-full px-3 py-3 rounded-xl text-base text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <input
                    value={comprador.cpf}
                    onChange={(e) => setComprador((c) => ({ ...c, cpf: e.target.value }))}
                    placeholder="CPF"
                    inputMode="numeric"
                    className="w-full px-3 py-3 rounded-xl text-base text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <input
                    value={comprador.email}
                    onChange={(e) => setComprador((c) => ({ ...c, email: e.target.value }))}
                    placeholder="E-mail"
                    type="email"
                    className="w-full px-3 py-3 rounded-xl text-base text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Cartão</p>
                  <StripeField label="Número">
                    <CardNumberElement options={{ style: ELEMENT_STYLE, showIcon: true }} className="w-full" />
                  </StripeField>
                  <div className="grid grid-cols-2 gap-2">
                    <StripeField label="Validade">
                      <CardExpiryElement options={{ style: ELEMENT_STYLE }} className="w-full" />
                    </StripeField>
                    <StripeField label="CVV">
                      <CardCvcElement options={{ style: ELEMENT_STYLE }} className="w-full" />
                    </StripeField>
                  </div>
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
        )}
      </div>

      {!resultado && !loadingKey && !stripeNaoConfigurado && (
        <div className="px-5 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <button
            type="button"
            onClick={handlePagar}
            disabled={loading || (metodo !== 'pix' && !stripe)}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{
              background: metodo === 'pix'
                ? 'linear-gradient(135deg, #00E87A, #059669)'
                : 'linear-gradient(135deg, #635bff, #00AAFF)',
            }}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" />Processando...</>
            ) : metodo === 'pix' ? (
              <><Smartphone size={16} />Gerar PIX — R$ {valor.toFixed(2)}</>
            ) : (
              <><CreditCard size={16} />Pagar R$ {valor.toFixed(2)}</>
            )}
          </button>
          <p className="text-[10px] text-center text-slate-600 mt-2 flex items-center justify-center gap-1">
            <Lock size={10} /> Pagamento seguro via Stripe
          </p>
        </div>
      )}
    </>
  );
}

function CheckoutModalShell({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: '#080d1a', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#635bff20', border: '1px solid #635bff40' }}>
              <CreditCard size={16} color="#a5b4fc" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Pagamento Seguro</h3>
              <p className="text-xs text-slate-500">Stripe</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/5" aria-label="Fechar">
            <X size={18} color="#9ca3af" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ModalCheckoutStripe({ transacao, aluno, onClose, onSucesso }) {
  const [metodo, setMetodo] = useState('credito');
  const [publishableKey, setPublishableKey] = useState('');
  const [loadingKey, setLoadingKey] = useState(true);
  const [mounted, setMounted] = useState(false);

  const valor = parseFloat(transacao?.valor || 0);
  const maxParcelas = (() => {
    try { return parseInt(JSON.parse(localStorage.getItem('fitpro_stripe_config') || '{}').parcelasMax) || 12; }
    catch { return 12; }
  })();

  useEffect(() => {
    setMounted(true);
    resolvePublishableKey().then((pk) => {
      setPublishableKey(pk);
      setLoadingKey(false);
    });
    return () => setMounted(false);
  }, []);

  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  const bodyProps = {
    transacao,
    aluno,
    metodo,
    setMetodo,
    valor,
    maxParcelas,
    onClose,
    onSucesso,
    publishableKey,
    loadingKey,
  };

  if (!mounted) return null;

  const modal = (
    <CheckoutModalShell onClose={onClose}>
      {publishableKey ? (
        <Elements stripe={stripePromise}>
          <CheckoutBody {...bodyProps} />
        </Elements>
      ) : (
        <CheckoutBody {...bodyProps} />
      )}
    </CheckoutModalShell>
  );

  return createPortal(modal, document.body);
}
