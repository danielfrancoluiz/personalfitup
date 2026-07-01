/** Remove tudo que não for dígito */
export function apenasDigitos(value) {
  return (value || '').replace(/\D/g, '');
}

export function maskTelefone(value) {
  const digits = apenasDigitos(value).slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskCpf(value) {
  const digits = apenasDigitos(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function maskCnpj(value) {
  const digits = apenasDigitos(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function maskCep(value) {
  const digits = apenasDigitos(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** CREF: 000000-G/SP ou 000000-P/SP */
export function maskCref(value) {
  const raw = (value || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  const nums = raw.replace(/\D/g, '').slice(0, 6);
  if (nums.length < 6) return nums;

  const letters = raw.replace(/\d/g, '');
  const tipo = letters.includes('P') ? 'P' : letters.includes('G') ? 'G' : '';
  const uf = letters.replace(/[GP]/g, '').slice(0, 2);

  let out = `${nums}-`;
  if (tipo) {
    out += tipo;
    if (uf) out += `/${uf}`;
  }
  return out;
}

export function maskData(value) {
  const digits = apenasDigitos(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function maskWhatsApp(value) {
  const digits = apenasDigitos(value).slice(0, 13);
  if (!digits) return '';
  if (digits.length <= 2) return digits;
  if (digits.startsWith('55')) {
    const local = digits.slice(2);
    return local ? `55 ${maskTelefone(local)}` : '55';
  }
  return maskTelefone(digits);
}

export function maskPixChave(tipo, value) {
  switch (tipo) {
    case 'cpf': return maskCpf(value);
    case 'cnpj': return maskCnpj(value);
    case 'telefone': return maskTelefone(value);
    default: return value;
  }
}

export function dataIsoParaBr(iso) {
  if (!iso) return '';
  if (iso.includes('/')) return iso;
  const partes = iso.split('T')[0].split('-');
  if (partes.length !== 3) return '';
  const [y, m, d] = partes;
  return `${d}/${m}/${y}`;
}

export function dataBrParaIso(br) {
  const digits = apenasDigitos(br);
  if (digits.length !== 8) return '';
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  return `${y}-${m}-${d}`;
}

export function isDataFuturaBr(br) {
  const iso = dataBrParaIso(br);
  if (!iso) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const data = new Date(y, m - 1, d);
  if (data.getFullYear() !== y || data.getMonth() !== m - 1 || data.getDate() !== d) return true;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return data > hoje;
}

export function isDataFuturaIso(iso) {
  if (!iso) return false;
  return isDataFuturaBr(dataIsoParaBr(iso));
}

export function getDataMaxHoje() {
  return new Date().toISOString().split('T')[0];
}

const MASK_FNS = {
  telefone: maskTelefone,
  cpf: maskCpf,
  cnpj: maskCnpj,
  cep: maskCep,
  cref: maskCref,
  data: maskData,
  whatsapp: maskWhatsApp,
};

export function aplicarMask(tipo, value) {
  const fn = MASK_FNS[tipo];
  return fn ? fn(value) : value;
}

/** Handler para onChange com máscara — retorna valor formatado (data retorna ISO quando completa) */
export function onMaskedInput(tipo, value) {
  const masked = aplicarMask(tipo, value);
  if (tipo === 'data') {
    if (masked.length === 10 && isDataFuturaBr(masked)) return null;
    return masked.length === 10 ? dataBrParaIso(masked) : masked;
  }
  return masked;
}
