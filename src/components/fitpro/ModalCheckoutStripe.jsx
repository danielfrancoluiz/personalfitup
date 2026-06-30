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
          billing_details: {
            name: comprador.nome,
            email: comprador.email,
          },
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
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-shrink-0 px-4 pt-3 pb-2 sm:px-5">
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

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
        {loadingKey ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-slate-500" />
          </div>
        ) : stripeNaoConfigurado ? (
          <div className="py-10 text-center">
            <AlertCircle size={32} color="#fbbf24" className="mx-auto mb-3" />
            <p className="text-sm text-white font-semibold mb-2">Stripe não configurado</p>
            <p className="text-xs text-slate-400">
              O administrador precisa salvar as chaves em Financeiro → Stripe.
            </p>
          </div>
        ) : resultado ? (
          <div className="py-6 text-center min-h-[280px] flex flex-col items-center justify-center">
            {resultado.novoStatus === 'pago' ? (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: '#00E87A20', border: '2px solid #00E87A' }}>
                  <CheckCircle2 size={32} color="#00E87A" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Pagamento Aprovado!</h3>
                <p className="text-slate-400 text-sm mb-2">{resultado.mensagem}</p>
                <p className="text-2xl font-black" style={{ color: '#00E87A' }}>R$ {valor.toFixed(2)}</p>
                {resultado.chargeId && <p className="text-xs text-slate-500 mt-2">ID: {resultado.chargeId}</p>}
              </>
            ) : metodo === 'pix' ? (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: '#00E87A20', border: '2px solid #00E87A' }}>
                  <Smartphone size={32} color="#00E87A" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">PIX Gerado!</h3>
                <p className="text-slate-400 text-sm mb-4">{resultado.mensagem}</p>
                <div className="w-full p-3 rounded-xl text-[11px] font-mono break-all text-slate-400 mb-3 text-left"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {pixCode}
                </div>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(pixCode); setPixCopiado(true); setTimeout(() => setPixCopiado(false), 2000); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: pixCopiado ? '#00E87A20' : '#1e2a3a', color: pixCopiado ? '#00E87A' : '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Copy size={14} />
                  {pixCopiado ? 'Copiado!' : 'Copiar código PIX'}
                </button>
              </>
            ) : (
              <>
                <Loader2 size={32} color="#fbbf24" className="animate-spin mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Pagamento em análise</h3>
                <p className="text-slate-400 text-sm">{resultado.mensagem}</p>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #00E87A, #059669)' }}
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            <div className="p-3 rounded-xl flex items-center justify-between gap-2"
              style={{ background: '#635bff10', border: '1px solid #635bff25' }}>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 truncate">{transacao?.descricao}</p>
                <p className="text-xs text-slate-500 truncate">{aluno?.nome}</p>
              </div>
              <p className="text-lg font-black flex-shrink-0" style={{ color: '#a5b4fc' }}>R$ {valor.toFixed(2)}</p>
            </div>

            {metodo === 'pix' ? (
              <div className="p-4 rounded-xl text-center space-y-3"
                style={{ background: '#00E87A08', border: '1px solid #00E87A20' }}>
                <QrCode size={40} className="mx-auto" color="#00E87A" />
                <p className="text-sm text-white font-semibold">Toque em &quot;Gerar PIX&quot; abaixo</p>
                <p className="text-xs text-slate-400">Após pagar, aguarde a confirmação.</p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wide">Dados do comprador</p>
                  <div className="space-y-2">
                    <input
                      value={comprador.nome}
                      onChange={(e) => setComprador((c) => ({ ...c, nome: e.target.value }))}
                      placeholder="Nome completo"
                      autoComplete="name"
                      className="w-full px-3 py-3 rounded-xl text-base text-white outline-none"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    <input
                      value={comprador.cpf}
                      onChange={(e) => setComprador((c) => ({ ...c, cpf: e.target.value }))}
                      placeholder="CPF"
                      inputMode="numeric"
                      autoComplete="off"
                      className="w-full px-3 py-3 rounded-xl text-base text-white outline-none"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    <input
                      value={comprador.email}
                      onChange={(e) => setComprador((c) => ({ ...c, email: e.target.value }))}
                      placeholder="E-mail"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      className="w-full px-3 py-3 rounded-xl text-base text-white outline-none"
                      style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                    {metodo === 'debito' ? 'Cartão de débito' : 'Cartão de crédito'}
                  </p>
                  <StripeField label="Número do cartão">
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
                      {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((n) => {
                        const vlr = (valor / n).toFixed(2);
                        return (
                          <option key={n} value={String(n)}>
                            {n === 1 ? `À vista — R$ ${valor.toFixed(2)}` : `${n}x de R$ ${vlr}`}
                          </option>
                        );
                      })}
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

            {!resultado && (
              <div className="flex items-center gap-2 justify-center text-xs text-slate-600 pb-1">
                <Lock size={11} />
                <span>Pagamento seguro via Stripe</span>
              </div>
            )}
          </div>
        )}
      </div>

      {!resultado && !loadingKey && !stripeNaoConfigurado && (
        <div
          className="flex-shrink-0 px-4 pt-2 border-t sm:px-5"
          style={{ borderColor: 'rgba(255,255,255,0.07)', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={handlePagar}
            disabled={loading || (metodo !== 'pix' && !stripe)}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{
              background: metodo === 'pix'
                ? 'linear-gradient(135deg, #00E87A, #059669)'
                : metodo === 'debito'
                  ? 'linear-gradient(135deg, #34d399, #059669)'
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
        </div>
      )}
    </div>
  );
}

export default function ModalCheckoutStripe({ transacao, aluno, onClose, onSucesso }) {
  const [metodo, setMetodo] = useState('credito');
  const [publishableKey, setPublishableKey] = useState('');
  const [loadingKey, setLoadingKey] = useState(true);

  const valor = parseFloat(transacao?.valor || 0);

  const maxParcelas = (() => {
    try { return parseInt(JSON.parse(localStorage.getItem('fitpro_stripe_config') || '{}').parcelasMax) || 12; }
    catch { return 12; }
  })();

  useEffect(() => {
    resolvePublishableKey().then((pk) => {
      setPublishableKey(pk);
      setLoadingKey(false);
    });
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  const content = (
    <div
      className="fixed inset-0 z-[200] flex flex-col sm:items-center sm:justify-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex flex-col w-full h-full sm:h-auto sm:max-h-[92dvh] sm:max-w-md sm:rounded-2xl overflow-hidden"
        style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0 sm:px-5 sm:py-4"
          style={{ background: '#080d1a', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#635bff20', border: '1px solid #635bff40' }}>
              <CreditCard size={16} color="#a5b4fc" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm truncate">Pagamento Seguro</h3>
              <p className="text-xs text-slate-500">Stripe</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 flex-shrink-0" aria-label="Fechar">
            <X size={18} color="#9ca3af" />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          {publishableKey ? (
            <Elements stripe={stripePromise} options={{ locale: 'pt-BR' }}>
              <CheckoutBody
                transacao={transacao}
                aluno={aluno}
                metodo={metodo}
                setMetodo={setMetodo}
                valor={valor}
                maxParcelas={maxParcelas}
                onClose={onClose}
                onSucesso={onSucesso}
                publishableKey={publishableKey}
                loadingKey={loadingKey}
              />
            </Elements>
          ) : (
            <CheckoutBody
              transacao={transacao}
              aluno={aluno}
              metodo={metodo}
              setMetodo={setMetodo}
              valor={valor}
              maxParcelas={maxParcelas}
              onClose={onClose}
              onSucesso={onSucesso}
              publishableKey={publishableKey}
              loadingKey={loadingKey}
            />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
