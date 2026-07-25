'use client';

import { useEffect, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export function Select({ value, onChange, options, placeholder, disabled }: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-2xl bg-cream px-5 py-3.5 text-left text-[15px] text-ink shadow-[inset_3px_3px_6px_rgba(122,74,38,0.12),inset_-3px_-3px_6px_rgba(255,255,255,0.6)] transition active:scale-[0.99] disabled:opacity-50 ${
          open ? 'ring-2 ring-latte/40' : ''
        }`}
      >
        <span className={selected ? 'text-ink' : 'text-ink/40'}>
          {selected ? selected.label : placeholder ?? 'Pilih...'}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-latte transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-white p-2 shadow-[8px_8px_18px_rgba(122,74,38,0.22),-8px_-8px_18px_rgba(255,255,255,0.95)]">
          {options.length === 0 && (
            <li className="px-4 py-3 text-sm text-ink/40">Tidak ada pilihan.</li>
          )}
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-[15px] transition ${
                  option.value === value
                    ? 'bg-cream font-semibold text-ink'
                    : 'text-ink/70 hover:bg-cream/60'
                }`}
              >
                {option.label}
                {option.value === value && (
                  <svg className="h-4 w-4 text-latte" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4 10.5L8 14.5L16 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}