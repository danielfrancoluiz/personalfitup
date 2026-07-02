import React from 'react';

export const formInputClass = 'w-full min-h-[42px] px-3 py-2.5 rounded-xl text-sm text-white outline-none box-border';
export const formInputStyle = { background: '#1e2a3a', border: '1px solid rgba(255,255,255,0.08)' };
export const formRowClass = 'grid grid-cols-1 sm:grid-cols-2 gap-3';
export const formRow3Class = 'grid grid-cols-1 sm:grid-cols-3 gap-3';

export default function FormField({ label, children, className = '' }) {
  return (
    <div className={`min-w-0 flex flex-col ${className}`}>
      {label && (
        <label className="text-xs text-slate-400 block mb-1 min-h-[2.5rem] leading-snug flex items-end">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}
