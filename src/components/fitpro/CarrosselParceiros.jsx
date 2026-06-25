import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, ShoppingBag, Stethoscope } from 'lucide-react';

const ESPECIALIDADE_EMOJI = {
  'Nutricionista': '🥗',
  'Fisioterapeuta': '🩺',
  'Médico': '👨‍⚕️',
  'Psicólogo': '🧠',
  'Cardiologista': '❤️',
  'Ortopedista': '🦴',
  'Endocrinologista': '🔬',
};

const CATEGORIA_EMOJI = {
  'Suplemento': '💊',
  'Roupas': '👕',
  'Equipamento': '🏋️',
  'Acessório': '🎽',
  'Alimentação': '🥑',
};

export default function CarrosselParceiros({ parceiros = [], produtos = [], onNavServicos, onNavLoja }) {
  const [idx, setIdx] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const timerRef = useRef(null);

  // Monta os slides: parceiros + produtos (apenas ativos)
  const slides = [
    ...parceiros.map(p => ({ tipo: 'parceiro', data: p })),
    ...produtos.filter(p => p.ativo !== false).slice(0, 6).map(p => ({ tipo: 'produto', data: p })),
  ];

  const total = slides.length;

  useEffect(() => {
    if (!autoplay || total === 0) return;
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % total);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [autoplay, total]);

  const go = (dir) => {
    setAutoplay(false);
    setIdx(i => (i + dir + total) % total);
    clearInterval(timerRef.current);
    timerRef.current = setTimeout(() => setAutoplay(true), 8000);
  };

  if (total === 0) return null;

  const slide = slides[idx];
  const isParceiro = slide.tipo === 'parceiro';
  const item = slide.data;

  // Cores por tipo
  const cor = isParceiro ? '#00AAFF' : '#fb923c';
  const corBg = isParceiro ? '#00AAFF' : '#fb923c';

  return (
    <div className="rounded-2xl overflow-hidden relative select-none"
      style={{ background: '#0d1525', border: `1px solid rgba(255,255,255,0.07)` }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="font-semibold text-white flex items-center gap-2">
          {isParceiro
            ? <><Stethoscope size={15} color="#60a5fa" />Serviços & Parceiros</>
            : <><ShoppingBag size={15} color="#fb923c" />Loja</>}
        </h3>
        <div className="flex gap-2">
          <button onClick={() => isParceiro ? onNavServicos?.() : onNavLoja?.()}
            className="text-xs flex items-center gap-1 transition-all hover:opacity-80"
            style={{ color: cor }}>
            Ver todos <ExternalLink size={10} />
          </button>
        </div>
      </div>

      {/* Banner principal */}
      <div className="relative mx-4 mb-4 rounded-2xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${corBg}18, #080d1a)`, border: `1px solid ${cor}25` }}>

        {/* Conteúdo do slide — layout vertical estilo e-commerce */}
        <div className="flex flex-col">
          {/* Imagem quadrada padrão e-commerce */}
          <div className="w-full overflow-hidden flex items-center justify-center"
            style={{ background: `${cor}10`, borderBottom: `1px solid ${cor}20`, height: 260 }}>
            {item.imagemUrl ? (
              <img src={item.imagemUrl} alt={item.nome} className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-6xl">
                {isParceiro
                  ? (ESPECIALIDADE_EMOJI[item.especialidade] || '🏥')
                  : (CATEGORIA_EMOJI[item.categoria] || '🛒')}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-2 font-semibold"
              style={{ background: `${cor}20`, color: cor, border: `1px solid ${cor}30` }}>
              {isParceiro ? (item.especialidade || 'Parceiro') : (item.categoria || 'Produto')}
            </span>

            <h4 className="text-sm font-black text-white leading-snug mb-1">{item.nome}</h4>

            {isParceiro ? (
              <div className="flex items-end justify-between gap-2 flex-wrap">
                <div>
                  {item.descricao && <p className="text-xs text-slate-400 line-clamp-2">{item.descricao}</p>}
                  {item.valorConsulta > 0 && (
                    <div className="mt-1 flex items-center gap-1 flex-wrap">
                      <span className="text-base font-bold" style={{ color: '#34d399' }}>R$ {parseFloat(item.valorConsulta).toFixed(2)}</span>
                      <span className="text-xs text-slate-500">/ consulta</span>
                    </div>
                  )}
                  {item.disponibilidade && <p className="text-xs text-slate-500 mt-0.5">📅 {item.disponibilidade}</p>}
                </div>
                <button onClick={() => onNavServicos?.()}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, #00AAFF, #0077cc)`, color: '#fff' }}>
                  Contratar
                </button>
              </div>
            ) : (
              <div className="flex items-end justify-between gap-2 flex-wrap">
                <div>
                  {item.descricao && <p className="text-xs text-slate-400 line-clamp-2">{item.descricao}</p>}
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {item.precoPromocional > 0 && item.precoPromocional < item.preco ? (
                      <>
                        <span className="text-xs text-slate-500 line-through">R$ {parseFloat(item.preco).toFixed(2)}</span>
                        <span className="text-base font-black" style={{ color: '#34d399' }}>R$ {parseFloat(item.precoPromocional).toFixed(2)}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#34d39920', color: '#34d399' }}>PROMO</span>
                      </>
                    ) : (
                      <span className="text-base font-black" style={{ color: '#fb923c' }}>R$ {parseFloat(item.preco || 0).toFixed(2)}</span>
                    )}
                    {item.estoque != null && item.estoque <= 5 && item.estoque > 0 && (
                      <span className="text-xs text-amber-400">⚠️ Últimas {item.estoque}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => item.linkLoja ? window.open(item.linkLoja, '_blank') : onNavLoja?.()}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, #fb923c, #f97316)`, color: '#fff' }}>
                  Comprar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navegação prev/next */}
        {total > 1 && (
          <>
            <button onClick={() => go(-1)}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ChevronLeft size={12} color="#fff" />
            </button>
            <button onClick={() => go(1)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ChevronRight size={12} color="#fff" />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5 pb-3">
          {slides.map((s, i) => (
            <button key={i} onClick={() => { setIdx(i); setAutoplay(false); }}
              className="rounded-full transition-all"
              style={{
                width: i === idx ? 20 : 6,
                height: 6,
                background: i === idx
                  ? (s.tipo === 'parceiro' ? '#60a5fa' : '#fb923c')
                  : 'rgba(255,255,255,0.15)',
              }} />
          ))}
        </div>
      )}
    </div>
  );
}