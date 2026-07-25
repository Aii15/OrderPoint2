'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchActiveStaff, loginStaff, StaffOption } from '@/lib/auth';
import { Select } from '@/components/Select';

export default function CashierLoginPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(true);

  useEffect(() => {
    fetchActiveStaff()
      .then((list) => {
        setStaffList(list);
        if (list.length > 0) setStaffId(list[0].id);
      })
      .catch(() => setError('Tidak bisa mengambil daftar staf. Pastikan apps/api jalan.'))
      .finally(() => setLoadingStaff(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await loginStaff(staffId, pin);
      router.push('/');
    } catch {
      setError('PIN salah. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[2.5rem] bg-white p-10 shadow-[8px_8px_18px_rgba(122,74,38,0.28),-8px_-8px_18px_rgba(255,255,255,0.95)]"
      >
        <h1 className="mb-2 font-serif text-3xl text-ink">Monitor Kasir</h1>
        <p className="mb-8 text-[15px] text-ink/60">Pilih nama & masukkan PIN untuk masuk.</p>

        {loadingStaff ? (
          <p className="mb-4 text-sm text-ink/50">Memuat daftar staf...</p>
        ) : staffList.length === 0 ? (
          <p className="mb-4 text-sm text-red-500">
            Belum ada staf terdaftar. Minta admin menambah staf lewat halaman Admin &rarr; Staf.
          </p>
        ) : (
          <div className="mb-4">
            <Select
              value={staffId}
              onChange={setStaffId}
              placeholder="Pilih nama staf"
              options={staffList.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>
        )}

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          className="mb-4 w-full rounded-2xl bg-cream px-5 py-4 text-center text-2xl tracking-[0.3em] text-ink outline-none"
        />

        {error && <p className="mb-4 text-center text-sm font-medium text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || pin.length === 0 || staffList.length === 0}
          className="w-full rounded-full bg-latte px-6 py-4 text-[15px] font-semibold text-cream transition active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? 'Memeriksa...' : 'Masuk'}
        </button>
      </form>
    </main>
  );
}