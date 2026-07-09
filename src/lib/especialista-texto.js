/** Texto exibido ao aluno/professor: descrição + observações comerciais em sequência. */
export function textoServicoEspecialista(esp, { incluirObsComerciais = false } = {}) {
  const partes = [esp?.descricao?.trim()];
  if (incluirObsComerciais) partes.push(esp?.observacoesComerciais?.trim());
  return partes.filter(Boolean).join('\n\n');
}
