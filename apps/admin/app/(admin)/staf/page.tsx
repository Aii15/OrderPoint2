'use client';

import { useEffect, useState } from 'react';
import {
  StaffMember,
  fetchStaffList,
  createStaff,
  updateStaff,
  deleteStaff,
} from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Toast } from '@/components/Toast';

const SOFT_SHADOW =
  'shadow-[8px_8px_18px_rgba(122,74,38,0.15),-8px_-8px_18px_rgba(255,255,255,0.9)]';

function StaffFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: StaffMember | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Nama wajib diisi');
      return;
    }
    if (!initial && pin.trim().length < 4) {
      setError('PIN minimal 4 digit');
      return;
    }
    setIsSubmitting(true);
    try {
      if (initial) {
        await updateStaff(initial.id, {
          name: name.trim(),
          ...(pin.trim() ? { pin: pin.trim() } : {}),
        });
        onSaved(`Staf "${name.trim()}" diperbarui`);
      } else {
        await createStaff({ name: name.trim(), pin: pin.trim() });
        onSaved(`Staf "${name.trim()}" ditambahkan`);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan staf');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-[2.5rem] bg-white p-10 ${SOFT_SHADOW}`}
      >
        <h2 className="mb-6 font-serif text-2xl text-ink">
          {initial ? 'Edit Staf' : 'Tambah Staf'}
        </h2>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-ink/40">
          Nama
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="mb-4 w-full rounded-2xl bg-cream px-5 py-3 text-[15px] text-ink outline-none"
        />

        <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-ink/40">
          PIN{' '}
          {initial && (
            <span className="normal-case text-ink/30">(kosongkan kalau tidak diubah)</span>
          )}
        </label>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="mb-4 w-full rounded-2xl bg-cream px-5 py-3 tracking-[0.3em] text-ink outline-none"
        />

        {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-cream px-6 py-3 text-[15px] font-semibold text-ink/60"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-full bg-latte px-6 py-3 text-[15px] font-semibold text-cream disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTarget, setFormTarget] = useState<StaffMember | null | 'new'>(null);
  const [confirmDelete, setConfirmDelete] = useState<StaffMember | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null,
  );

  const load = () => {
    setLoading(true);
    fetchStaffList()
      .then(setStaffList)
      .catch(() => setToast({ message: 'Gagal mengambil daftar staf', variant: 'error' }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleToggleActive = async (staff: StaffMember) => {
    try {
      await updateStaff(staff.id, { active: !staff.active });
      load();
      setToast({
        message: `${staff.name} ditandai ${!staff.active ? 'aktif' : 'nonaktif'}`,
        variant: 'success',
      });
    } catch {
      setToast({ message: 'Gagal mengubah status staf', variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteStaff(confirmDelete.id);
      load();
      setToast({ message: `Staf "${confirmDelete.name}" dihapus`, variant: 'success' });
    } catch {
      setToast({ message: 'Gagal menghapus staf', variant: 'error' });
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <main className="p-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Staf Kasir</h1>
          <p className="text-sm text-ink/50">
            Staf di sini bisa login di Monitor Kasir supaya pesanan yang mereka tangani tercatat.
          </p>
        </div>
        <button
          onClick={() => setFormTarget('new')}
          className={`rounded-full bg-latte px-6 py-3 text-[15px] font-semibold text-cream ${SOFT_SHADOW}`}
        >
          + Tambah Staf
        </button>
      </div>

      {loading ? (
        <p className="text-ink/50">Memuat data...</p>
      ) : (
        <div className={`overflow-hidden rounded-[2rem] bg-white ${SOFT_SHADOW}`}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-latte/10 text-ink/50">
                <th className="px-6 py-4 font-semibold">Nama</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Terdaftar</th>
                <th className="px-6 py-4 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr key={staff.id} className="border-b border-latte/5 last:border-0 hover:bg-cream/30">
                  <td className="px-6 py-4 font-medium text-ink">{staff.name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        staff.active ? 'bg-green-100 text-green-700' : 'bg-ink/10 text-ink/50'
                      }`}
                    >
                      {staff.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-ink/50">
                    {new Date(staff.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3 text-xs font-semibold">
                      <button onClick={() => setFormTarget(staff)} className="text-latte">
                        Edit
                      </button>
                      <button onClick={() => handleToggleActive(staff)} className="text-ink/60">
                        {staff.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button onClick={() => setConfirmDelete(staff)} className="text-red-500">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-ink/40">
                    Belum ada staf terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {formTarget && (
        <StaffFormModal
          initial={formTarget === 'new' ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={(message) => {
            load();
            setToast({ message, variant: 'success' });
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Hapus Staf?"
          message={`Staf "${confirmDelete.name}" akan dihapus permanen. Riwayat pesanan yang pernah mereka tangani tetap tersimpan (nama staf disimpan sebagai catatan, bukan referensi langsung).`}
          confirmLabel="Ya, Hapus"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      )}
    </main>
  );
}