'use client';

import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, Category, MenuItem, MenuItemInput, uploadMenuImage } from '@/lib/api';
import { Select } from './Select';

interface MenuItemFormProps {
  title: string;
  initial?: MenuItem; // kalau ada = mode edit, kalau tidak = mode tambah
  onSubmit: (input: MenuItemInput) => Promise<void>;
  onCancel: () => void;
}

type TabKey = 'dasar' | 'penyajian' | 'atribut';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'dasar', label: 'Info Dasar' },
  { key: 'penyajian', label: 'Detail Penyajian' },
  { key: 'atribut', label: 'Atribut & Meter' },
];

// BARU — id unik per baris, stabil sepanjang hidup baris itu (tidak berubah
// walau baris lain ditambah/dihapus/direorder). Dipakai sebagai React key di
// PairListEditor supaya tidak salah mengenali baris berdasarkan posisi index,
// yang sebelumnya menyebabkan value antar baris saling timpa.
function makeKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

type TextRow = { _key: string; value: string };
type AttributeRow = { _key: string; label: string; value: string };
type MeterRow = { _key: string; label: string; value: number };

// Gambar sekarang bisa di-upload langsung lewat tombol di bawah — ditulis
// apps/api langsung ke apps/kiosk/public/images/{id}.png. Preview di-refresh
// pakai query param cache-busting (?v=) supaya langsung update tanpa perlu
// hard refresh browser.
function ImagePreview({ id }: { id: string }) {
  const [failed, setFailed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cacheBust, setCacheBust] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFailed(false);
    setUploadError(null);
  }, [id]);

  const kioskBaseUrl = process.env.NEXT_PUBLIC_KIOSK_BASE_URL ?? 'http://localhost:3000';
  const src = `${kioskBaseUrl}/images/${id}.png?v=${cacheBust}`;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset supaya bisa pilih file yang sama lagi kalau perlu

    if (!file || !id) return;

    if (file.type !== 'image/png') {
      setUploadError('File harus format PNG (.png)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 2MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadMenuImage(id, file);
      setFailed(false);
      setCacheBust((v) => v + 1); // paksa <img> reload, bukan pakai cache lama
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Gagal upload gambar');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      {!id || failed ? (
        <div className="flex h-40 w-40 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-latte/20 bg-cream/40 p-3 text-center">
          <span className="text-xs font-medium text-ink/50">
            {!id ? 'Isi Id dulu' : 'Gambar belum ada'}
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Preview menu"
          onError={() => setFailed(true)}
          className="h-40 w-40 shrink-0 rounded-2xl object-cover"
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        type="button"
        disabled={!id || isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-full bg-latte px-4 py-1.5 text-xs font-semibold text-cream disabled:opacity-40"
      >
        {isUploading ? 'Mengunggah...' : 'Upload Gambar'}
      </button>

      {uploadError && (
        <p className="max-w-[160px] text-center text-[11px] font-medium text-red-500">
          {uploadError}
        </p>
      )}
    </div>
  );
}

function TextListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: TextRow[];
  onChange: (next: TextRow[]) => void;
  placeholder: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-bold text-ink">{label}</label>
        <button
          type="button"
          onClick={() => onChange([...values, { _key: makeKey(), value: '' }])}
          className="text-xs font-semibold text-latte"
        >
          + Tambah
        </button>
      </div>
      <div className="space-y-2">
        {values.map((row, index) => (
          <div key={row._key} className="flex min-w-0 gap-2">
            <input
              value={row.value}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...values];
                next[index] = { ...next[index], value: e.target.value };
                onChange(next);
              }}
              className="min-w-0 flex-1 rounded-xl bg-cream px-4 py-2 text-sm text-ink outline-none"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="shrink-0 rounded-xl px-3 text-sm font-semibold text-red-500"
            >
              Hapus
            </button>
          </div>
        ))}
        {values.length === 0 && <p className="text-xs text-ink/40">Belum ada item.</p>}
      </div>
    </div>
  );
}

function PairListEditor<T extends { _key: string; label: string; value: string | number }>({
  title,
  values,
  onChange,
  valueType,
}: {
  title: string;
  values: T[];
  onChange: (next: T[]) => void;
  valueType: 'text' | 'number';
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-bold text-ink">{title}</label>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...values,
              { _key: makeKey(), label: '', value: valueType === 'number' ? 1 : '' } as T,
            ])
          }
          className="text-xs font-semibold text-latte"
        >
          + Tambah
        </button>
      </div>
      <div className="space-y-2">
        {values.map((pair, index) => (
          <div key={pair._key} className="flex min-w-0 gap-2">
            <input
              value={pair.label}
              placeholder="Label"
              onChange={(e) => {
                const next = [...values];
                next[index] = { ...next[index], label: e.target.value };
                onChange(next);
              }}
              className="min-w-0 flex-1 rounded-xl bg-cream px-4 py-2 text-sm text-ink outline-none"
            />
            {valueType === 'number' ? (
              <input
                type="number"
                min={1}
                max={5}
                value={pair.value as number}
                onChange={(e) => {
                  const next = [...values];
                  next[index] = { ...next[index], value: Number(e.target.value) };
                  onChange(next);
                }}
                className="w-16 shrink-0 rounded-xl bg-cream px-3 py-2 text-sm text-ink outline-none"
              />
            ) : (
              <input
                value={pair.value as string}
                placeholder="Value"
                onChange={(e) => {
                  const next = [...values];
                  next[index] = { ...next[index], value: e.target.value };
                  onChange(next);
                }}
                className="min-w-0 flex-1 rounded-xl bg-cream px-4 py-2 text-sm text-ink outline-none"
              />
            )}
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="shrink-0 rounded-xl px-3 text-sm font-semibold text-red-500"
            >
              Hapus
            </button>
          </div>
        ))}
        {values.length === 0 && <p className="text-xs text-ink/40">Belum ada item.</p>}
      </div>
    </div>
  );
}

export function MenuItemForm({ title, initial, onSubmit, onCancel }: MenuItemFormProps) {
  const isEdit = Boolean(initial);
  const [activeTab, setActiveTab] = useState<TabKey>('dasar');
  const [id, setId] = useState(initial?.id ?? '');
  const [category, setCategory] = useState<Category>((initial?.category as Category) ?? CATEGORIES[0]);
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [composition, setComposition] = useState<TextRow[]>(() =>
  (initial?.composition ?? []).map((v) => ({ _key: makeKey(), value: v })),
  );
  const [servingDetails, setServingDetails] = useState<TextRow[]>(() =>
  (initial?.servingDetails ?? []).map((v) => ({ _key: makeKey(), value: v })),
  );
  const [attributes, setAttributes] = useState<AttributeRow[]>(() =>
    (initial?.attributes ?? []).map((a) => ({ ...a, _key: makeKey() })),
  );
  const [meters, setMeters] = useState<MeterRow[]>(() =>
    (initial?.meters ?? []).map((m) => ({ ...m, _key: makeKey() })),
  );
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [availability, setAvailability] = useState(initial?.availability ?? 'Available all day');
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const idChanged = isEdit && initial ? id !== initial.id : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name) {
      setFormError('Id dan nama wajib diisi.');
      setActiveTab('dasar');
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        id,
        category,
        name,
        description,
        composition: composition.map((r) => r.value),
        servingDetails: servingDetails.map((r) => r.value),
        attributes: attributes.map(({ _key, ...rest }) => rest),
        meters: meters.map(({ _key, ...rest }) => rest),
        price,
        availability,
        imageAlt,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan menu item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-10">
      <button
        type="button"
        onClick={onCancel}
        className="mb-6 text-sm font-semibold text-latte"
      >
        &larr; Kembali ke Menu
      </button>

      <h1 className="mb-6 font-serif text-3xl text-ink">{title}</h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-6 flex gap-2 rounded-full bg-cream/70 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key ? 'bg-latte text-cream' : 'text-ink/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-[8px_8px_18px_rgba(122,74,38,0.15),-8px_-8px_18px_rgba(255,255,255,0.9)]">
          {activeTab === 'dasar' && (
            <div className="space-y-4">
              <div className="flex gap-6">
                <ImagePreview id={id} />
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-bold text-ink">
                      Id (slug, dipakai untuk nama file gambar)
                    </label>
                    <input
                      value={id}
                      onChange={(e) => setId(e.target.value.trim().toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="mis. caramel-latte"
                      className="w-full rounded-xl bg-cream px-4 py-2 text-sm text-ink outline-none"
                    />
                    {idChanged && (
                      <p className="mt-1 text-xs font-medium text-amber-600">
                        Id berubah dari &quot;{initial?.id}&quot; — jangan lupa rename juga file gambarnya
                        secara manual di apps/kiosk/public/images/ dari {initial?.id}.png menjadi {id}.png.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-bold text-ink">Kategori</label>
                    <Select
                      value={category}
                      onChange={(v) => setCategory(v as Category)}
                      options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-ink">Nama</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-cream px-4 py-2 text-sm text-ink outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-ink">Deskripsi</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl bg-cream px-4 py-2 text-sm text-ink outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-bold text-ink">Harga (IDR)</label>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-xl bg-cream px-4 py-2 text-sm text-ink outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-ink">Ketersediaan</label>
                  <input
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    placeholder="mis. Available all day"
                    className="w-full rounded-xl bg-cream px-4 py-2 text-sm text-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-ink">Alt teks gambar</label>
                <input
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full rounded-xl bg-cream px-4 py-2 text-sm text-ink outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'penyajian' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <TextListEditor
                label="Composition"
                values={composition}
                onChange={setComposition}
                placeholder="mis. Espresso"
              />
              <TextListEditor
                label="Serving Details"
                values={servingDetails}
                onChange={setServingDetails}
                placeholder="mis. Size: 240 ml"
              />
            </div>
          )}

          {activeTab === 'atribut' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <PairListEditor
                title="Attributes"
                values={attributes}
                onChange={setAttributes}
                valueType="text"
              />
              <PairListEditor
                title="Meters (skala 1-5)"
                values={meters}
                onChange={setMeters}
                valueType="number"
              />
            </div>
          )}
        </div>

        {formError && <p className="mt-4 text-sm font-medium text-red-500">{formError}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full bg-cream px-6 py-3 text-[15px] font-semibold text-ink/70 transition active:scale-95 sm:flex-none sm:px-10"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-full bg-latte px-6 py-3 text-[15px] font-semibold text-cream transition active:scale-95 disabled:opacity-50 sm:flex-none sm:px-10"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </main>
  );
}