import React, { useState } from 'react';
import { ShoppingBag, ShoppingCart, Search, Star, X, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp, useAuth } from '../../context/FitProContext';
import { generateId } from '../../lib/fitpro-storage';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';
const CATEGORIA_COLOR = {
  'Suplementos': '#34d399', 'Roupas': '#f472b6', 'Equipamentos': '#60a5fa',
  'Acessórios': '#fbbf24', 'Livros': '#a78bfa', 'Serviços': '#fb923c', 'Outros': '#64748b',
};

export default function LojaView() {
  const { produtos, alunos, addTransacao } = useApp();
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fitpro_pedidos') || '[]'); } catch { return []; }
  });

  const [search, setSearch] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  const [showCarrinho, setShowCarrinho] = useState(false);
  const [showSucesso, setShowSucesso] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('pix');

  const listaProdutos = (produtos || []).filter(p => p.ativo !== false);
  const categorias = [...new Set(listaProdutos.map(p => p.categoria).filter(Boolean))];

  const filtered = listaProdutos.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) || (p.descricao || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !filtroCategoria || p.categoria === filtroCategoria;
    return matchSearch && matchCat;
  });

  const destaques = filtered.filter(p => p.destaque);
  const outros = filtered.filter(p => !p.destaque);

  const addCarrinho = (prod) => {
    setCarrinho(c => {
      const existe = c.find(i => i.produtoId === prod.id);
      if (existe) return c.map(i => i.produtoId === prod.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      return [...c, { id: generateId(), produtoId: prod.id, nome: prod.nome, preco: prod.precoPromocional > 0 ? prod.precoPromocional : prod.preco, quantidade: 1 }];
    });
  };

  const removeCarrinho = (id) => setCarrinho(c => c.filter(i => i.id !== id));
  const updateQtd = (id, delta) => setCarrinho(c => c.map(i => i.id === id ? { ...i, quantidade: Math.max(1, i.quantidade + delta) } : i));

  const totalCarrinho = carrinho.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
  const qtdItens = carrinho.reduce((acc, i) => acc + i.quantidade, 0);

  const finalizarPedido = () => {
    if (carrinho.length === 0) return;
    const alunoAtual = alunos.find(a => a.email?.toLowerCase() === user?.email?.toLowerCase());
    const novoPedido = {
      id: generateId(), alunoId: alunoAtual?.id || '', itens: carrinho.map(i => ({ id: i.id, produtoId: i.produtoId, quantidade: i.quantidade })),
      status: 'pendente', formaPagamento, total: totalCarrinho, dataPedido: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString(),
    };
    const novos = [novoPedido, ...pedidos];
    setPedidos(novos);
    localStorage.setItem('fitpro_pedidos', JSON.stringify(novos));
    if (alunoAtual) {
      addTransacao({ descricao: `Compra na loja — ${carrinho.length} item(s)`, tipo: 'Produto', valor: totalCarrinho, data: new Date().toISOString().split('T')[0], status: 'pendente', alunoId: alunoAtual.id, categoria: 'receita' });
    }
    setCarrinho([]);
    setShowCarrinho(false);
    setShowSucesso(true);
    setTimeout(() => setShowSucesso(false), 3000);
  };

  const ProductCard = ({ prod }) => {
    const color = CATEGORIA_COLOR[prod.categoria] || '#64748b';
    const temPromocao = prod.precoPromocional > 0 && prod.precoPromocional < prod.preco;
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden flex flex-col" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        {/* Imagem */}
        <div className="w-full overflow-hidden flex items-center justify-center relative"
          style={{ aspectRatio: '1/1', background: prod.imagemUrl ? '#f0f0f0' : `${color}12` }}>
          {prod.imagemUrl ? (
            <img src={prod.imagemUrl} alt={prod.nome} className="w-full h-full" style={{ objectFit: 'contain' }} />
          ) : (
            <ShoppingBag size={28} style={{ color }} />
          )}
          {prod.destaque && <span className="absolute top-1.5 left-1.5 text-xs">⭐</span>}
          {temPromocao && (
            <span className="absolute top-1.5 right-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: '#ef444490', color: '#fff' }}>OFF</span>
          )}
        </div>
        {/* Info */}
        <div className="p-2 flex flex-col flex-1">
          <p className="text-xs font-semibold text-white leading-tight line-clamp-2 mb-1">{prod.nome}</p>
          <span className="text-xs px-1.5 py-0.5 rounded-full inline-block mb-1 self-start" style={{ background: `${color}15`, color, fontSize: 10 }}>{prod.categoria}</span>
          <div className="mt-auto">
            {temPromocao ? (
              <>
                <div className="text-slate-500 line-through" style={{ fontSize: 10 }}>R$ {parseFloat(prod.preco).toFixed(2)}</div>
                <div className="text-sm font-bold text-green-400">R$ {parseFloat(prod.precoPromocional).toFixed(2)}</div>
              </>
            ) : (
              <div className="text-sm font-bold" style={{ color: '#34d399' }}>R$ {parseFloat(prod.preco || 0).toFixed(2)}</div>
            )}
          </div>
          {prod.linkLoja ? (
            <a href={prod.linkLoja} target="_blank" rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
              <ShoppingCart size={11} />Comprar
            </a>
          ) : (
            <div className="mt-2 py-1.5 rounded-lg text-center text-slate-600 italic" style={{ fontSize: 10, background: 'rgba(255,255,255,0.03)' }}>
              Sem link
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Sucesso */}
      <AnimatePresence>
        {showSucesso && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl"
            style={{ background: '#0d4429', border: '1px solid #34d39940' }}>
            <CheckCircle2 size={16} color="#34d399" />
            <span className="text-sm text-green-400 font-semibold">Pedido realizado com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><ShoppingBag size={20} color="#fb923c" />Loja</h2>
          <p className="text-xs text-slate-500">{listaProdutos.length} produto(s) disponíveis</p>
        </div>
        {qtdItens > 0 && (
          <button onClick={() => setShowCarrinho(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold relative"
            style={{ background: '#fb923c20', color: '#fb923c', border: '1px solid #fb923c30' }}>
            <ShoppingCart size={16} />
            Carrinho
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
              style={{ background: '#fb923c' }}>{qtdItens}</span>
          </button>
        )}
      </div>

      {/* Search + filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produtos..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFiltroCategoria('')}
          className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0"
          style={{ background: !filtroCategoria ? '#fb923c20' : 'rgba(255,255,255,0.03)', color: !filtroCategoria ? '#fb923c' : '#64748b', border: !filtroCategoria ? '1px solid #fb923c30' : '1px solid rgba(255,255,255,0.06)' }}>
          Todos
        </button>
        {categorias.map(cat => {
          const color = CATEGORIA_COLOR[cat] || '#64748b';
          return (
            <button key={cat} onClick={() => setFiltroCategoria(filtroCategoria === cat ? '' : cat)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
              style={{ background: filtroCategoria === cat ? `${color}20` : 'rgba(255,255,255,0.03)', color: filtroCategoria === cat ? color : '#64748b', border: filtroCategoria === cat ? `1px solid ${color}30` : '1px solid rgba(255,255,255,0.06)' }}>
              {cat}
            </button>
          );
        })}
      </div>

      {listaProdutos.length === 0 ? (
        <div className="text-center py-16 text-slate-500"><ShoppingBag size={40} className="mx-auto mb-3 opacity-30" /><p>Nenhum produto disponível na loja</p><p className="text-xs mt-1">O administrador ainda não cadastrou produtos.</p></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Nenhum produto encontrado</div>
      ) : (
        <>
          {destaques.length > 0 && (
            <div>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">⭐ Destaques</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {destaques.map(prod => <ProductCard key={prod.id} prod={prod} />)}
              </div>
            </div>
          )}
          {outros.length > 0 && (
            <div>
              {destaques.length > 0 && <h3 className="font-semibold text-white mb-3">Todos os Produtos</h3>}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {outros.map(prod => <ProductCard key={prod.id} prod={prod} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Carrinho modal */}
      {showCarrinho && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCarrinho(false); }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2"><ShoppingCart size={18} color="#fb923c" />Carrinho ({qtdItens} itens)</h3>
              <button onClick={() => setShowCarrinho(false)}><X size={18} color="#6b7280" /></button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {carrinho.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{item.nome}</div>
                    <div className="text-xs text-slate-500">R$ {item.preco.toFixed(2)} un.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQtd(item.id, -1)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#fb923c20', color: '#fb923c' }}><Minus size={10} /></button>
                    <span className="text-sm font-bold text-white w-4 text-center">{item.quantidade}</span>
                    <button onClick={() => updateQtd(item.id, 1)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#fb923c20', color: '#fb923c' }}><Plus size={10} /></button>
                  </div>
                  <div className="text-sm font-bold text-green-400 min-w-16 text-right">R$ {(item.preco * item.quantidade).toFixed(2)}</div>
                  <button onClick={() => removeCarrinho(item.id)} className="text-slate-600 hover:text-red-400"><X size={14} /></button>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 mb-4" style={{ borderColor: BORDER }}>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total</span>
                <span className="text-xl font-bold text-green-400">R$ {totalCarrinho.toFixed(2)}</span>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs text-slate-400 block mb-1">Forma de Pagamento</label>
              <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                {['pix','cartão de crédito','cartão de débito','dinheiro','boleto'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button onClick={finalizarPedido} className="w-full py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #fb923c, #ea580c)' }}>
              Finalizar Pedido — R$ {totalCarrinho.toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}