import React, { useState, useRef } from 'react';
import { Stethoscope, Plus, X, Star, Edit2, Trash2, Percent, ShoppingCart, Upload, ImageIcon } from 'lucide-react';
import { useApp, useAuth } from '../../context/FitProContext';
import ModalPagamentoParceiro from '../../components/fitpro/ModalPagamentoParceiro';
import MaskedInput from '../../components/fitpro/MaskedInput';
import { base44 } from '@/api/base44Client';

const CARD = '#0d1525';
const BORDER = 'rgba(255,255,255,0.07)';

const emptyEsp = {
  nome: '', especialidade: 'Nutricionista', email: '', telefone: '', whatsapp: '',
  descricao: '', valorConsulta: '', disponibilidade: '', parceiro: false, avaliacao: 5.0,
  percentualComissao: 10, modeloComissao: 'por_contratacao', observacoesComerciais: '',
  formasPagamento: ['pix'], imagemUrl: '',
  endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' }
};

const ESPECIALIDADES = ['Médico', 'Nutricionista', 'Fisioterapeuta', 'Psicólogo', 'Cardiologista', 'Ortopedista', 'Professor de Educação Física', 'Personal Trainer'];
const EMOJIS = { Médico: '👨‍⚕️', Nutricionista: '🥗', Fisioterapeuta: '🏥', Psicólogo: '🧠', Cardiologista: '❤️', Ortopedista: '🦴', 'Professor de Educação Física': '💪', 'Personal Trainer': '🏋️' };

export default function EspecialistasView() {
  const { especialistas, addEspecialista, updateEspecialista, deleteEspecialista, alunos, professores } = useApp();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Resolve o perfil real do usuário logado (aluno ou professor)
  const usuarioPerfil = alunos.find(a => a.email?.toLowerCase() === user?.email?.toLowerCase())
    || professores.find(p => p.email?.toLowerCase() === user?.email?.toLowerCase());
  const tipoUsuario = alunos.some(a => a.email?.toLowerCase() === user?.email?.toLowerCase()) ? 'aluno' : 'professor';

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyEsp);
  const [filtro, setFiltro] = useState('todos');
  const [saved, setSaved] = useState(false);
  const [espModal, setEspModal] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, imagemUrl: file_url }));
    setUploadingImg(false);
  };

  const especialidadesUnicas = [...new Set(especialistas.map(e => e.especialidade))];
  const filtrados = filtro === 'todos' ? especialistas
    : filtro === 'parceiros' ? especialistas.filter(e => e.parceiro)
    : especialistas.filter(e => e.especialidade === filtro);

  const handleSave = () => {
    if (!form.nome.trim()) return alert('Nome é obrigatório');
    const data = {
      ...form,
      valorConsulta: parseFloat(form.valorConsulta) || 0,
      percentualComissao: parseFloat(form.percentualComissao) || 0,
    };
    if (editId) updateEspecialista(editId, data);
    else addEspecialista(data);
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowForm(false); setEditId(null); setForm(emptyEsp); }, 1200);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Especialistas</h2>
          <p className="text-xs text-slate-500">{especialistas.length} especialista(s)</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setForm(emptyEsp); setEditId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: '#60a5fa20', color: '#60a5fa', border: '1px solid #60a5fa30' }}>
            <Plus size={14} />Novo Especialista
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['todos', 'parceiros', ...especialidadesUnicas].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
            style={{ background: filtro === f ? '#60a5fa20' : 'rgba(255,255,255,0.03)', color: filtro === f ? '#60a5fa' : '#64748b', border: filtro === f ? '1px solid #60a5fa30' : '1px solid rgba(255,255,255,0.06)' }}>
            {f === 'todos' ? 'Todos' : f === 'parceiros' ? '🤝 Parceiros' : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtrados.map((esp) => (
          <div key={esp.id} className="p-5 rounded-2xl transition-all"
            style={{ background: CARD, border: `1px solid ${esp.parceiro ? '#34d39930' : BORDER}` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                  style={{ background: '#1e2a3a' }}>
                  {esp.imagemUrl
                    ? <img src={esp.imagemUrl} alt={esp.nome} className="w-full h-full object-cover" />
                    : <span className="text-2xl">{EMOJIS[esp.especialidade] || '👨‍⚕️'}</span>}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{esp.nome}</div>
                  <div className="text-xs text-slate-500">{esp.especialidade}</div>
                </div>
              </div>
              {esp.parceiro && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#34d39915', color: '#34d399', border: '1px solid #34d39925' }}>Parceiro</span>}
            </div>

            {esp.descricao && (
              <button
                type="button"
                onClick={() => setEspModal({ esp, foco: 'descricao' })}
                className="text-xs text-slate-400 mb-3 line-clamp-2 text-left w-full hover:text-slate-200 transition-colors cursor-pointer"
                title="Ver descrição completa"
              >
                {esp.descricao}
              </button>
            )}

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Star size={12} color="#fbbf24" fill="#fbbf24" />
                <span className="text-xs text-slate-300">{esp.avaliacao?.toFixed(1)}</span>
              </div>
              <span className="text-base font-bold" style={{ color: '#34d399' }}>R${esp.valorConsulta}</span>
            </div>

            {/* Comissão visível apenas para admin */}
            {isAdmin && esp.percentualComissao > 0 && (
              <div className="flex items-center gap-1 mb-2 px-2 py-1 rounded-lg" style={{ background: '#fbbf2410', border: '1px solid #fbbf2420' }}>
                <Percent size={11} color="#fbbf24" />
                <span className="text-xs font-semibold" style={{ color: '#fbbf24' }}>{esp.percentualComissao}% comissão plataforma</span>
              </div>
            )}

            {esp.disponibilidade && <p className="text-xs text-slate-500 mb-3">{esp.disponibilidade}</p>}

            <div className="flex gap-2 justify-end items-center">
              {esp.parceiro && !isAdmin && (
                <button onClick={() => setEspModal({ esp, foco: 'pagamento' })}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #34d399, #059669)', color: '#fff' }}>
                  <ShoppingCart size={14} />Contratar
                </button>
              )}
              {isAdmin && (
                <>

                  <button onClick={() => { setForm({ ...esp, valorConsulta: String(esp.valorConsulta) }); setEditId(esp.id); setShowForm(true); }}
                    className="px-3 py-2 rounded-xl hover:bg-white/5 transition-all" style={{ color: '#94a3b8' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => { if (confirm('Excluir?')) deleteEspecialista(esp.id); }}
                    className="px-3 py-2 rounded-xl hover:bg-red-500/10 transition-all" style={{ color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-16 text-slate-500"><Stethoscope size={40} className="mx-auto mb-3 opacity-30" /><p>Nenhum especialista encontrado</p></div>
      )}

      {espModal && (
        <ModalPagamentoParceiro
          especialista={espModal.esp}
          focoInicial={espModal.foco}
          podeContratar={espModal.esp.parceiro && !isAdmin}
          usuario={usuarioPerfil}
          tipoUsuario={tipoUsuario}
          onClose={() => setEspModal(null)}
          onSuccess={() => { setTimeout(() => setEspModal(null), 3000); }}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 my-4" style={{ background: '#0d1525', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{editId ? 'Editar' : 'Novo'} Especialista</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={18} color="#6b7280" /></button>
            </div>
            <div className="space-y-3">
              {/* Upload de imagem */}
              <div>
                <label className="text-xs text-slate-400 block mb-2">Foto do Especialista</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {form.imagemUrl
                      ? <img src={form.imagemUrl} alt="foto" className="w-full h-full object-cover" />
                      : <ImageIcon size={22} color="#475569" />}
                  </div>
                  <div className="flex-1">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImg}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: '#60a5fa15', color: '#60a5fa', border: '1px solid #60a5fa30', opacity: uploadingImg ? 0.6 : 1 }}>
                      <Upload size={13} />
                      {uploadingImg ? 'Enviando...' : 'Carregar Foto'}
                    </button>
                    <p className="text-xs text-slate-600 mt-1">JPG, PNG ou WEBP</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
              </div>

              {[
                { label: 'Nome', field: 'nome', placeholder: 'Nome completo' },
                { label: 'Email', field: 'email', placeholder: 'email@exemplo.com' },
              ].map(f => (
                <div key={f.field}>
                  <label className="text-xs text-slate-400 block mb-1">{f.label}</label>
                  <input value={form[f.field] || ''} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                    placeholder={f.placeholder} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Telefone</label>
                <MaskedInput mask="telefone" value={form.telefone || ''} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">WhatsApp</label>
                <MaskedInput mask="whatsapp" value={form.whatsapp || ''} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))}
                  placeholder="55 (11) 99999-9999" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Especialidade</label>
                <select value={form.especialidade} onChange={e => setForm(p => ({ ...p, especialidade: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Valor da Consulta (R$)</label>
                  <input type="number" value={form.valorConsulta} onChange={e => setForm(p => ({ ...p, valorConsulta: e.target.value }))}
                    placeholder="200" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1"><Percent size={10} />% Comissão Plataforma</label>
                  <input type="number" value={form.percentualComissao} onChange={e => setForm(p => ({ ...p, percentualComissao: e.target.value }))}
                    placeholder="10" min="0" max="100" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Modelo de Comissão</label>
                <select value={form.modeloComissao} onChange={e => setForm(p => ({ ...p, modeloComissao: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="por_contratacao">Por contratação</option>
                  <option value="mensalidade">Mensalidade fixa</option>
                  <option value="a_negociar">A negociar</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Disponibilidade</label>
                <input value={form.disponibilidade} onChange={e => setForm(p => ({ ...p, disponibilidade: e.target.value }))}
                  placeholder="Seg a Sex: 8h-18h" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Descrição</label>
                <textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Observações Comerciais</label>
                <textarea value={form.observacoesComerciais} onChange={e => setForm(p => ({ ...p, observacoesComerciais: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.parceiro} onChange={e => setForm(p => ({ ...p, parceiro: e.target.checked }))} className="w-4 h-4" id="parceiro" />
                <label htmlFor="parceiro" className="text-sm text-slate-300 cursor-pointer">Parceiro conveniado</label>
              </div>
            </div>
            <button onClick={handleSave} className="w-full mt-4 py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #60a5fa, #2563eb)' }}>
              {saved ? '✓ Salvo!' : `${editId ? 'Salvar' : 'Cadastrar'} Especialista`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}