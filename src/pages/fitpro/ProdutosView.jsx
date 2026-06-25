import React, { useState, useRef } from 'react';
import { ShoppingBag, Plus, X, Trash2, Edit2, Search, Tag, Package, ImagePlus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp, useAuth } from '../../context/FitProContext';
import { base44 } from '@/api/base44Client';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';
const CATEGORIAS = ['Suplementos', 'Roupas', 'Equipamentos', 'Acessórios', 'Livros', 'Serviços', 'Outros'];
const CATEGORIA_COLOR = {
  'Suplementos': '#34d399', 'Roupas': '#f472b6', 'Equipamentos': '#60a5fa',
  'Acessórios': '#fbbf24', 'Livros': '#a78bfa', 'Serviços': '#fb923c', 'Outros': '#64748b',
};

function emptyProduto() {
  return { nome: '', descricao: '', categoria: 'Suplementos', preco: '', precoPromocional: '', estoque: '', unidade: 'un', imagemUrl: '', linkLoja: '', ativo: true, destaque: false };
}

export default function ProdutosView() {
  const { produtos, addProduto, updateProduto, deleteProduto } = useApp();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyProduto());
  const [saved, setSaved] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const imgInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, imagemUrl: file_url }));
    setUploadingImg(false);
  };

  const lista = (produtos || []);
  const filtered = lista.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filtroCategoria || p.categoria === filtroCategoria;
    return matchSearch && matchCat;
  });

  const handleSave = () => {
    if (!form.nome.trim()) return alert('Nome é obrigatório');
    if (!form.preco) return alert('Preço é obrigatório');
    const data = { ...form, preco: parseFloat(form.preco) || 0, precoPromocional: parseFloat(form.precoPromocional) || 0, estoque: parseInt(form.estoque) || 0 };
    if (editId) updateProduto(editId, data);
    else addProduto(data);
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setEditId(null); setForm(emptyProduto()); }, 1200);
  };

  const toggleAtivo = (id, ativo) => updateProduto(id, { ativo: !ativo });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><ShoppingBag size={20} color="#fb923c" />Produtos</h2>
          <p className="text-xs text-slate-500">{filtered.length} produto(s)</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setForm(emptyProduto()); setEditId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: '#fb923c20', color: '#fb923c', border: '1px solid #fb923c30' }}>
            <Plus size={14} />Novo Produto
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm text-white outline-none"
          style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="">Todas categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: lista.length, color: '#fb923c' },
          { label: 'Ativos', value: lista.filter(p => p.ativo).length, color: '#34d399' },
          { label: 'Em destaque', value: lista.filter(p => p.destaque).length, color: '#fbbf24' },
        ].map(k => (
          <div key={k.label} className="p-3 rounded-xl text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500"><ShoppingBag size={40} className="mx-auto mb-3 opacity-30" /><p>Nenhum produto cadastrado</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((prod, i) => {
            const color = CATEGORIA_COLOR[prod.categoria] || '#64748b';
            const temPromocao = prod.precoPromocional > 0 && prod.precoPromocional < prod.preco;
            return (
              <motion.div key={prod.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-xl overflow-hidden flex flex-col" style={{ background: CARD, border: `1px solid ${prod.ativo ? BORDER : 'rgba(255,255,255,0.03)'}`, opacity: prod.ativo ? 1 : 0.6 }}>
                {/* Imagem */}
                <div className="w-full overflow-hidden flex items-center justify-center relative"
                  style={{ aspectRatio: '1/1', background: prod.imagemUrl ? '#f0f0f0' : `${color}12` }}>
                  {prod.imagemUrl ? (
                    <img src={prod.imagemUrl} alt={prod.nome} className="w-full h-full" style={{ objectFit: 'contain' }} />
                  ) : (
                    <Package size={28} style={{ color }} />
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
                        <div className="text-slate-500 line-through" style={{ fontSize: 10 }}>R$ {prod.preco.toFixed(2)}</div>
                        <div className="text-sm font-bold text-green-400">R$ {prod.precoPromocional.toFixed(2)}</div>
                      </>
                    ) : (
                      <div className="text-sm font-bold" style={{ color: '#34d399' }}>R$ {parseFloat(prod.preco || 0).toFixed(2)}</div>
                    )}
                    <div className="text-slate-600 mt-0.5" style={{ fontSize: 10 }}>Estoque: {prod.estoque || 0} {prod.unidade}</div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <button onClick={() => toggleAtivo(prod.id, prod.ativo)}
                        className="flex-1 py-1 rounded-lg text-center transition-all"
                        style={{ background: prod.ativo ? '#34d39915' : '#64748b15', color: prod.ativo ? '#34d399' : '#64748b', fontSize: 10 }}>
                        {prod.ativo ? '✓ Ativo' : 'Inativo'}
                      </button>
                      <button onClick={() => { setForm({ ...prod, preco: String(prod.preco), precoPromocional: String(prod.precoPromocional || ''), estoque: String(prod.estoque || '') }); setEditId(prod.id); setShowForm(true); }}
                        className="p-1 rounded-lg hover:bg-white/5" style={{ color: '#94a3b8' }}><Edit2 size={11} /></button>
                      <button onClick={() => { if (confirm('Excluir?')) deleteProduto(prod.id); }}
                        className="p-1 rounded-lg hover:bg-red-500/10" style={{ color: '#ef4444' }}><Trash2 size={11} /></button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 my-4" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{editId ? 'Editar' : 'Novo'} Produto</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={18} color="#6b7280" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nome</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do produto"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Categoria</label>
                <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Descrição</label>
                <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Preço (R$)</label>
                  <input type="number" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Preço Promocional (R$)</label>
                  <input type="number" value={form.precoPromocional} onChange={e => setForm(f => ({ ...f, precoPromocional: e.target.value }))} placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Estoque</label>
                  <input type="number" value={form.estoque} onChange={e => setForm(f => ({ ...f, estoque: e.target.value }))} placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Unidade</label>
                  <select value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {['un','kg','g','L','mL','cx'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Imagem do Produto</label>
                <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                {form.imagemUrl ? (
                  <div className="relative mb-2 rounded-xl overflow-hidden" style={{ background: '#f8f8f8', aspectRatio: '1/1' }}>
                    <img src={form.imagemUrl} alt="preview"
                      className="w-full h-full"
                      style={{ objectFit: 'contain', objectPosition: 'center' }} />
                    <button onClick={() => setForm(f => ({ ...f, imagemUrl: '' }))}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 hover:bg-red-500">
                      <X size={12} color="#fff" />
                    </button>
                    <button onClick={() => imgInputRef.current?.click()} disabled={uploadingImg}
                      className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                      style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
                      {uploadingImg ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
                      Trocar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => imgInputRef.current?.click()} disabled={uploadingImg}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all mb-2"
                    style={{ background: '#1e2a3a', border: '1px dashed rgba(255,255,255,0.15)', color: '#64748b' }}>
                    {uploadingImg ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                    {uploadingImg ? 'Enviando...' : 'Clique para anexar imagem'}
                  </button>
                )}
                <input value={form.imagemUrl} onChange={e => setForm(f => ({ ...f, imagemUrl: e.target.value }))} placeholder="Ou cole uma URL de imagem..."
                  className="w-full px-3 py-2 rounded-xl text-xs text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">🔗 Link da Loja Parceira</label>
                <input value={form.linkLoja || ''} onChange={e => setForm(f => ({ ...f, linkLoja: e.target.value }))} placeholder="https://lojaparceira.com.br/produto"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                <p className="text-xs text-slate-600 mt-1">Ao clicar em "Comprar na loja parceira", o usuário será redirecionado para este link.</p>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} className="w-4 h-4" />
                  <span className="text-sm text-slate-300">Ativo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.destaque} onChange={e => setForm(f => ({ ...f, destaque: e.target.checked }))} className="w-4 h-4" />
                  <span className="text-sm text-slate-300">Destaque ⭐</span>
                </label>
              </div>
            </div>
            <button onClick={handleSave} className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #fb923c, #ea580c)' }}>
              {saved ? '✓ Salvo!' : `${editId ? 'Salvar' : 'Cadastrar'} Produto`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}