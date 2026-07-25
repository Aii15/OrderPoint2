'use client';

import { useEffect, useRef, useState } from 'react';

interface DatePickerProps {
  value: string; // format YYYY-MM-DD
  onChange: (value: string) => void;
  max?: string; // format YYYY-MM-DD
}

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_LABELS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function parseDateValue(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(value: string): string {
  const date = parseDateValue(value);
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

export function DatePicker({ value, onChange, max }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseDateValue(value));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setViewDate(parseDateValue(value));
  }, [open, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const maxDate = max ? parseDateValue(max) : null;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isNextMonthDisabled =
    !!maxDate && year === maxDate.getFullYear() && month >= maxDate.getMonth();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm text-ink shadow-[8px_8px_18px_rgba(122,74,38,0.15),-8px_-8px_18px_rgba(255,255,255,0.9)] transition active:scale-[0.99] ${
          open ? 'ring-2 ring-latte/40' : ''
        }`}
      >
        <svg className="h-4 w-4 text-latte" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6.5 3V5.5M13.5 3V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="font-medium">{formatDisplay(value)}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-[1.75rem] bg-white p-5 shadow-[8px_8px_18px_rgba(122,74,38,0.22),-8px_-8px_18px_rgba(255,255,255,0.95)]">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 hover:bg-cream/60"
            >
              &lsaquo;
            </button>
            <span className="text-sm font-semibold text-ink">
              {MONTH_LABELS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              disabled={isNextMonthDisabled}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 hover:bg-cream/60 disabled:opacity-20"
            >
              &rsaquo;
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-ink/30">
            {DAY_LABELS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <span key={i} />;
              const cellDate = new Date(year, month, day);
              const cellValue = formatDateValue(cellDate);
              const isSelected = cellValue === value;
              const isFuture = maxDate ? cellDate.getTime() > maxDate.getTime() : false;
              const isToday = cellValue === formatDateValue(new Date());

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isFuture}
                  onClick={() => {
                    onChange(cellValue);
                    setOpen(false);
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition ${
                    isSelected
                      ? 'bg-latte font-semibold text-cream'
                      : isToday
                      ? 'font-semibold text-latte'
                      : 'text-ink/70 hover:bg-cream/60'
                  } ${isFuture ? 'cursor-not-allowed opacity-20 hover:bg-transparent' : ''}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}