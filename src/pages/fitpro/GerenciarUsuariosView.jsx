import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Edit2, Eye, EyeOff, Key, Copy, CheckCircle2, Search, Shield, UserCheck, Users, X } from 'lucide-react';
import { getCredentials, addCredential, updateCredential, deleteCredential } from '../../lib/fitpro-storage';
import { useApp } from '../../context/FitProContext';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';
const roleColors = { admin: '#00d4ff', professor: '#34d399', aluno: '#a78bfa' };
const roleLabels = { admin: 'Administrador', professor: 'Professor', aluno: 'Aluno' };
const emptyForm = { nome: '', email: '', password: '', role: 'aluno', linkedId: '', ativo: true };

function gerarSenha() {
  return Math.random().toString(36).substr(2, 8) + Math.random().toString(36).substr(2, 4).toUpperCase();
}

export default function GerenciarUsuariosView() {
  const { alunos, professores } = useApp();
  const [creds, setCreds] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showFormPass, setShowFormPass] = useState(false);
  const [saved, setSaved] = useState(false);
  const [revealedIds, setRevealedIds] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);
  const [changingPassId, setChangingPassId] = useState(null);
  const [newPass, setNewPass] = useState('');

  useEffect(() => {
    getCredentials().then(data => setCreds(data));
  }, []);
  const refresh = () => getCredentials().then(data => setCreds(data));

  const filtered = creds.filter(c => {
    const matchRole = filterRole === 'todos' || c.role === filterRole;
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const handleSave = async () => {
    if (!form.nome || !form.email || !form.password) return alert('Preencha todos os campos obrigatórios');
    if (editId) await updateCredential(editId, form);
    else await addCredential({ ...form, autoRegistrado: false });
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setEditId(null); setForm(emptyForm); refresh(); }, 1000);
  };

  const handleEdit = (c) => {
    setForm({ nome: c.nome, email: c.email, password: c.password, role: c.role, linkedId: c.linkedId || '', ativo: c.ativo });
    setEditId(c.id); setShowForm(true); setChangingPassId(null);
  };

  const handleDelete = async (id) => {
    if (confirm('Excluir este usuário?')) { await deleteCredential(id); refresh(); }
  };

  const toggleReveal = (id) => setRevealedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const copiarSenha = (id, senha) => {
    navigator.clipboard.writeText(senha).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); });
  };

  const saveNewPass = async (id) => {
    if (newPass.length < 6) return alert('Senha deve ter mínimo 6 caracteres');
    await updateCredential(id, { password: newPass });
    setChangingPassId(null); setNewPass(''); refresh();
  };

  const linkedOptions = form.role === 'professor'
    ? professores.map(p => ({ value: p.id, label: p.nome }))
    : form.role === 'aluno'
    ? alunos.map(a => ({ value: a.id, label: a.nome }))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-white">Usuários & Acessos</h2><p className="text-xs text-slate-500">Gerencie contas e permissões</p></div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); setChangingPassId(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#e879f920', color: '#e879f9', border: '1px solid #e879f930' }}>
          <Plus size={14} />Novo Usuário
        </button>
      </div>

      <div className="p-3 rounded-xl text-xs text-slate-400" style={{ background: '#fbbf2408', border: '1px solid #fbbf2420' }}>
        ⚠️ <strong className="text-slate-300">Área restrita ao Administrador.</strong> Gerencie senhas com responsabilidade.
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <div className="flex gap-1">
          {['todos', 'admin', 'professor', 'aluno'].map(r => (
            <button key={r} onClick={() => setFilterRole(r)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: filterRole === r ? `${r === 'todos' ? '#e879f9' : roleColors[r]}20` : 'rgba(255,255,255,0.03)', color: filterRole === r ? (r === 'todos' ? '#e879f9' : roleColors[r]) : '#64748b', border: filterRole === r ? `1px solid ${r === 'todos' ? '#e879f930' : roleColors[r] + '30'}` : '1px solid rgba(255,255,255,0.06)' }}>
              {r === 'todos' ? 'Todos' : roleLabels[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((cred, i) => {
          const color = roleColors[cred.role];
          const revealed = revealedIds.has(cred.id);
          const isChangingPass = changingPassId === cred.id;
          const RoleIcon = cred.role === 'admin' ? Shield : cred.role === 'professor' ? UserCheck : Users;
          return (
            <div key={cred.id} className="p-4 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white" style={{ background: `${color}25` }}>
                  {cred.nome.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{cred.nome}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>{roleLabels[cred.role]}</span>
                    {!cred.ativo && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#ef444415', color: '#ef4444' }}>Inativo</span>}
                  </div>
                  <div className="text-xs text-slate-500">{cred.email}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => isChangingPass ? setChangingPassId(null) : (setChangingPassId(cred.id), setNewPass(''))}
                    className="p-2 rounded-xl text-xs hover:bg-white/5 transition-all flex items-center gap-1"
                    style={{ color: isChangingPass ? '#fbbf24' : '#94a3b8' }}>
                    <Key size={14} />
                  </button>
                  <button onClick={() => handleEdit(cred)} className="p-2 rounded-xl hover:bg-white/5" style={{ color: '#94a3b8' }}><Edit2 size={14} /></button>
                  {cred.role !== 'admin' && <button onClick={() => handleDelete(cred.id)} className="p-2 rounded-xl hover:bg-red-500/10" style={{ color: '#ef4444' }}><Trash2 size={14} /></button>}
                </div>
              </div>

              {/* Senha */}
              <div className="flex items-center gap-2 mt-3 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-xs text-slate-500">Senha:</span>
                <span className="text-xs text-slate-300 flex-1 font-mono">{revealed ? cred.password : '••••••••'}</span>
                <button onClick={() => toggleReveal(cred.id)} className="p-1 hover:bg-white/5 rounded" style={{ color: '#64748b' }}>{revealed ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                {revealed && (
                  <button onClick={() => copiarSenha(cred.id, cred.password)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs transition-all"
                    style={{ background: copiedId === cred.id ? '#34d39915' : '#00d4ff10', color: copiedId === cred.id ? '#34d399' : '#00d4ff' }}>
                    {copiedId === cred.id ? <><CheckCircle2 size={10} />Copiada</> : <><Copy size={10} />Copiar</>}
                  </button>
                )}
              </div>

              {/* Redefinir senha inline */}
              {isChangingPass && (
                <div className="mt-3 flex gap-2">
                  <input value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Nova senha (mín. 6 chars)"
                    className="flex-1 px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <button onClick={() => setNewPass(gerarSenha())} className="px-2 py-2 rounded-xl text-xs" style={{ background: '#fbbf2415', color: '#fbbf24' }}>Gerar</button>
                  <button onClick={() => saveNewPass(cred.id)} className="px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: '#34d39920', color: '#34d399' }}>Salvar</button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-12 text-slate-500"><Settings size={32} className="mx-auto mb-2 opacity-30" /><p>Nenhum usuário encontrado</p></div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{editId ? 'Editar' : 'Novo'} Usuário</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={18} color="#6b7280" /></button>
            </div>
            <div className="space-y-3">
              {[{ label: 'Nome', field: 'nome', placeholder: 'Nome completo' }, { label: 'Email', field: 'email', placeholder: 'email@exemplo.com' }].map(f => (
                <div key={f.field}><label className="text-xs text-slate-400 block mb-1">{f.label}</label><input value={form[f.field] || ''} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))} placeholder={f.placeholder} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} /></div>
              ))}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Senha</label>
                <div className="flex gap-2">
                  <input type={showFormPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Mínimo 6 caracteres" className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <button type="button" onClick={() => setForm(p => ({ ...p, password: gerarSenha() }))} className="px-2 py-2.5 rounded-xl text-xs" style={{ background: '#1e2a3a', color: '#64748b' }}>Gerar</button>
                  <button type="button" onClick={() => setShowFormPass(!showFormPass)} className="px-2 py-2.5 rounded-xl" style={{ background: '#1e2a3a', color: '#64748b' }}>{showFormPass ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Papel</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value, linkedId: '' }))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="admin">Administrador</option><option value="professor">Professor</option><option value="aluno">Aluno</option>
                </select>
              </div>
              {linkedOptions.length > 0 && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Vincular a</label>
                  <select value={form.linkedId} onChange={e => setForm(p => ({ ...p, linkedId: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <option value="">Selecionar...</option>
                    {linkedOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => setForm(p => ({ ...p, ativo: e.target.checked }))} className="w-4 h-4" />
                <label htmlFor="ativo" className="text-sm text-slate-300 cursor-pointer">Usuário Ativo</label>
              </div>
            </div>
            <button onClick={handleSave} className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white" style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #e879f9, #9333ea)' }}>
              {saved ? '✓ Salvo!' : `${editId ? 'Salvar' : 'Criar'} Usuário`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}