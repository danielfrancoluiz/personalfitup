import React, { useEffect, useState } from 'react';
import {
  aplicarMask,
  dataIsoParaBr,
  dataBrParaIso,
  isDataFuturaBr,
  maskData,
} from '../../lib/fitpro-masks';

const INPUT_PROPS = {
  telefone: { inputMode: 'tel', autoComplete: 'tel' },
  cpf: { inputMode: 'numeric', autoComplete: 'off' },
  cnpj: { inputMode: 'numeric', autoComplete: 'off' },
  cep: { inputMode: 'numeric', autoComplete: 'postal-code' },
  cref: { autoComplete: 'off' },
  data: { inputMode: 'numeric', autoComplete: 'bday', placeholder: 'DD/MM/AAAA' },
  whatsapp: { inputMode: 'tel', autoComplete: 'tel' },
};

export default function MaskedInput({ mask, value, onChange, className, style, ...rest }) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (mask === 'data') {
      if (!value) setDisplay('');
      else if (String(value).includes('-')) setDisplay(dataIsoParaBr(value));
      else setDisplay(maskData(value));
    } else {
      setDisplay(value ? aplicarMask(mask, value) : '');
    }
  }, [value, mask]);

  const handleChange = (e) => {
    const raw = e.target.value;
    const masked = aplicarMask(mask, raw);

    if (mask === 'data') {
      if (masked.length === 10 && isDataFuturaBr(masked)) return;
      setDisplay(masked);
      const iso = masked.length === 10 ? dataBrParaIso(masked) : '';
      onChange?.({ ...e, target: { ...e.target, value: iso } });
      return;
    }

    setDisplay(masked);
    onChange?.({ ...e, target: { ...e.target, value: masked } });
  };

  const extra = INPUT_PROPS[mask] || {};

  return (
    <input
      value={display}
      onChange={handleChange}
      className={className}
      style={style}
      {...extra}
      {...rest}
    />
  );
}
