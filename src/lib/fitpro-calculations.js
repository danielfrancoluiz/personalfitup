export function calcularIMC(peso, altura) {
  const alturaM = altura / 100;
  return peso / (alturaM * alturaM);
}

export function classificarIMC(imc) {
  if (imc < 18.5) return 'Abaixo do Peso';
  if (imc < 25) return 'Peso Normal';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade Grau I';
  if (imc < 40) return 'Obesidade Grau II';
  return 'Obesidade Grau III';
}

export function calcularDensidadeCorporal(sexo, somaDobras, idade, protocolo = '7') {
  if (protocolo === '7') {
    if (sexo === 'M') return 1.112 - 0.00043499 * somaDobras + 0.00000055 * somaDobras * somaDobras - 0.00028826 * idade;
    else return 1.097 - 0.00046971 * somaDobras + 0.00000056 * somaDobras * somaDobras - 0.00012828 * idade;
  } else {
    if (sexo === 'M') return 1.10938 - 0.0008267 * somaDobras + 0.0000016 * somaDobras * somaDobras - 0.0002574 * idade;
    else return 1.0994921 - 0.0009929 * somaDobras + 0.0000023 * somaDobras * somaDobras - 0.0001392 * idade;
  }
}

export function calcularPercentualGordura(densidade) {
  return (495 / densidade) - 450;
}

export function classificarGordura(percentual, sexo, idade) {
  if (sexo === 'M') {
    if (percentual < 6) return 'Abaixo do Essencial';
    if (percentual < 14) return 'Atleta';
    if (percentual < 18) return 'Boa Forma';
    if (percentual < 25) return 'Aceitável';
    return 'Obesidade';
  } else {
    if (percentual < 14) return 'Abaixo do Essencial';
    if (percentual < 21) return 'Atleta';
    if (percentual < 25) return 'Boa Forma';
    if (percentual < 32) return 'Aceitável';
    return 'Obesidade';
  }
}

export function calcularIdade(dataNascimento) {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
}

export function calcularTMB(peso, altura, idade, sexo) {
  if (sexo === 'M') return 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * idade);
  else return 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * idade);
}

export function calcularGEB(tmb, nivelAtividade) {
  const fatores = { sedentario: 1.2, leve: 1.375, moderado: 1.55, ativo: 1.725, muitoAtivo: 1.9 };
  return tmb * (fatores[nivelAtividade] || 1.55);
}

export function getCorClassificacao(classificacao) {
  const cores = {
    'Atleta': '#10b981', 'Boa Forma': '#34d399', 'Aceitável': '#fbbf24',
    'Sobrepeso': '#f97316', 'Peso Normal': '#10b981', 'Abaixo do Peso': '#60a5fa',
    'Obesidade': '#ef4444', 'Obesidade Grau I': '#ef4444', 'Obesidade Grau II': '#dc2626',
    'Obesidade Grau III': '#991b1b', 'Abaixo do Essencial': '#60a5fa',
  };
  return cores[classificacao] || '#94a3b8';
}