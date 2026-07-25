'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Order,
  PAYMENT_STATUS_LABEL,
  STATUS_LABEL,
  fetchOrderById,
  parseOrderItems,
} from '@/lib/api';

export default function RiwayatDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderById(params.id)
      .then(setOrder)
      .catch(() => setError('Order tidak ditemukan.'));
  }, [params.id]);

  if (error) {
    return (
      <main className="p-10">
        <button
          onClick={() => router.push('/riwayat')}
          className="mb-6 text-sm font-semibold text-latte"
        >
          &larr; Kembali ke Riwayat
        </button>
        <p className="rounded-2xl bg-red-50 px-6 py-4 text-[15px] font-medium text-red-600">
          {error}
        </p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="p-10">
        <p className="text-ink/50">Memuat data...</p>
      </main>
    );
  }

  const items = parseOrderItems(order);

  return (
    <main className="p-10">
      <button
        onClick={() => router.push('/riwayat')}
        className="mb-6 text-sm font-semibold text-latte"
      >
        &larr; Kembali ke Riwayat
      </button>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Antrian {order.queueNumber}</h1>
          <p className="text-sm text-ink/50">{order.customerName}</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-cream px-4 py-2 text-xs font-semibold text-ink/70">
            {STATUS_LABEL[order.orderStatus]}
          </span>
          <span className="rounded-full bg-cream px-4 py-2 text-xs font-semibold text-ink/70">
            {PAYMENT_STATUS_LABEL[order.paymentStatus]}
          </span>
        </div>
      </div>

      <div className="mb-6 rounded-[2rem] bg-white p-8 shadow-[8px_8px_18px_rgba(122,74,38,0.15),-8px_-8px_18px_rgba(255,255,255,0.9)]">
        <h2 className="mb-4 font-serif text-xl text-ink">Item Pesanan</h2>
        <div className="divide-y divide-latte/5">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium text-ink">{item.name}</p>
                <p className="text-ink/50">x{item.quantity}</p>
              </div>
              <p className="text-ink/70">
                Rp {new Intl.NumberFormat('id-ID').format(item.price * item.quantity)}
              </p>
            </div>
          ))}
          {items.length === 0 && (
            <p className="py-3 text-sm text-ink/40">Data item tidak bisa dibaca.</p>
          )}
        </div>

        <div className="mt-4 space-y-1 border-t border-latte/10 pt-4 text-sm">
          <div className="flex justify-between text-ink/60">
            <span>Subtotal</span>
            <span>Rp {new Intl.NumberFormat('id-ID').format(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink/60">
            <span>Pajak</span>
            <span>Rp {new Intl.NumberFormat('id-ID').format(order.tax)}</span>
          </div>
          <div className="flex justify-between font-serif text-lg text-ink">
            <span>Total</span>
            <span>Rp {new Intl.NumberFormat('id-ID').format(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-8 shadow-[8px_8px_18px_rgba(122,74,38,0.15),-8px_-8px_18px_rgba(255,255,255,0.9)]">
        <h2 className="mb-4 font-serif text-xl text-ink">Detail Lainnya</h2>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink/50">ID Order (Midtrans)</dt>
            <dd className="font-medium text-ink">{order.midtransOrderId}</dd>
          </div>
          <div>
            <dt className="text-ink/50">Dibuat</dt>
            <dd className="font-medium text-ink">
              {new Date(order.createdAt).toLocaleString('id-ID')}
            </dd>
          </div>
          <div>
            <dt className="text-ink/50">Dilayani oleh</dt>
            <dd className="font-medium text-ink">{order.servedByStaffName ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-ink/50">Terakhir diperbarui</dt>
            <dd className="font-medium text-ink">
              {new Date(order.updatedAt).toLocaleString('id-ID')}
            </dd>
          </div>
        </dl>
      </div>
    </main>
  );
}