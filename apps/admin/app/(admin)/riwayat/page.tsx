'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Order, PAYMENT_STATUS_LABEL, STATUS_LABEL, fetchOrderHistory } from '@/lib/api';
import { DatePicker } from '@/components/DatePicker';

function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function RiwayatPage() {
  const [date, setDate] = useState(todayDateInputValue());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchOrderHistory(date)
      .then((data) => {
        if (!cancelled) {
          setOrders(data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Tidak bisa mengambil riwayat pesanan. Pastikan apps/api jalan.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const totalOmzet = orders
    .filter((order) => order.orderStatus === 'COMPLETED')
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <main className="p-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-ink">Riwayat Pesanan</h1>
        <DatePicker value={date} onChange={setDate} max={todayDateInputValue()} />
      </div>

      {error && (
        <p className="mb-6 rounded-2xl bg-red-50 px-6 py-4 text-[15px] font-medium text-red-600">
          {error}
        </p>
      )}

      {!error && !loading && (
        <p className="mb-6 text-sm text-ink/50">
          {orders.length} pesanan pada tanggal ini · Omzet selesai:{' '}
          <span className="font-semibold text-latte">
            Rp {new Intl.NumberFormat('id-ID').format(totalOmzet)}
          </span>
        </p>
      )}

      {loading ? (
        <p className="text-ink/50">Memuat data...</p>
      ) : (
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-[8px_8px_18px_rgba(122,74,38,0.15),-8px_-8px_18px_rgba(255,255,255,0.9)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-latte/10 text-ink/50">
                <th className="px-6 py-4 font-semibold">Antrian</th>
                <th className="px-6 py-4 font-semibold">Nama Pelanggan</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Pembayaran</th>
                <th className="px-6 py-4 font-semibold">Dilayani</th>
                <th className="px-6 py-4 font-semibold">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-latte/5 last:border-0 hover:bg-cream/30">
                  <td className="px-6 py-4">
                    <Link
                      href={`/riwayat/${order.id}`}
                      className="font-semibold text-latte underline decoration-latte/30 underline-offset-4"
                    >
                      {order.queueNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-ink/70">{order.customerName}</td>
                  <td className="px-6 py-4 text-ink/70">
                    Rp {new Intl.NumberFormat('id-ID').format(order.total)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink/70">
                      {STATUS_LABEL[order.orderStatus]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-ink/70">{PAYMENT_STATUS_LABEL[order.paymentStatus]}</td>
                  <td className="px-6 py-4 text-ink/70">{order.servedByStaffName ?? '—'}</td>
                  <td className="px-6 py-4 text-ink/50">
                    {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-ink/40">
                    Tidak ada pesanan pada tanggal ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}