'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Order,
  OrderStatus,
  fetchActiveOrders,
  fetchFailedOrders,
  fetchCompletedToday,
  updateOrderStatus,
  parseOrderItems,
  NEXT_STATUS,
  STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from '@/lib/api';
import { getStaffName, logout } from '@/lib/auth';
import { playNotifySound } from '@/lib/useNotifySound';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Toast } from '@/components/Toast';

const POLL_INTERVAL_MS = 4000;
const TABS: (OrderStatus | 'ALL')[] = ['ALL', 'NEW', 'IN_PROGRESS', 'READY'];
type ViewMode = 'active' | 'failed' | 'history';

const SOFT_SHADOW =
  'shadow-[8px_8px_18px_rgba(122,74,38,0.28),-8px_-8px_18px_rgba(255,255,255,0.95)]';
const INSET_SHADOW = 'shadow-[inset_3px_3px_6px_rgba(122,74,38,0.1)]';

function formatWaitTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  return `${hours} jam ${minutes % 60} menit lalu`;
}

function isWaitingTooLong(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > 10 * 60 * 1000;
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

const STATUS_BADGE_STYLE: Record<string, string> = {
  NEW: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  READY: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-ink/10 text-ink/50',
  CANCELLED: 'bg-red-100 text-red-600',
  PENDING: 'bg-amber-100 text-amber-700',
  EXPIRED: 'bg-red-100 text-red-600',
};

const PAYMENT_LABEL: Record<string, string> = {
  PENDING: 'Menunggu Bayar',
  EXPIRED: 'Kedaluwarsa',
  PAID: 'Lunas',
};

export default function CashierPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmCancelOrder, setConfirmCancelOrder] = useState<Order | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null,
  );
  const [readyAlertIds, setReadyAlertIds] = useState<Set<string>>(new Set());
  const [, forceTick] = useState(0);

  const knownIdsRef = useRef<Set<string>>(new Set());
  const lastStatusRef = useRef<Map<string, OrderStatus>>(new Map());
  const isFirstLoadRef = useRef(true);

  const staffName = getStaffName();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const loadOrders = async (mode: ViewMode) => {
    try {
      const data =
        mode === 'active'
          ? await fetchActiveOrders()
          : mode === 'failed'
          ? await fetchFailedOrders()
          : await fetchCompletedToday();

      setConnectionError(false);

      if (mode === 'active') {
        if (!isFirstLoadRef.current) {
          const newOnes = data.filter((o) => !knownIdsRef.current.has(o.id));

          const justBecameReady = data.filter(
            (o) => o.orderStatus === 'READY' && lastStatusRef.current.get(o.id) !== 'READY',
          );

          if (newOnes.length > 0) {
            playNotifySound();
          }

          if (justBecameReady.length > 0) {
            playNotifySound();
            const names = justBecameReady.map((o) => o.queueNumber).join(', ');
            setToast({
              message: `Pesanan ${names} siap diambil!`,
              variant: 'success',
            });
            setReadyAlertIds((prev) => {
              const next = new Set(prev);
              justBecameReady.forEach((o) => next.add(o.id));
              return next;
            });
          }
        }

        isFirstLoadRef.current = false;
        knownIdsRef.current = new Set(data.map((o) => o.id));
        lastStatusRef.current = new Map(data.map((o) => [o.id, o.orderStatus]));
      }

      setOrders(data);
    } catch {
      setConnectionError(true);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders(viewMode);
    const interval = setInterval(() => loadOrders(viewMode), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useEffect(() => {
    const tickInterval = setInterval(() => forceTick((t) => t + 1), 30000);
    return () => clearInterval(tickInterval);
  }, []);

  const dismissReadyAlert = (id: string) => {
    setReadyAlertIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleAdvanceStatus = async (order: Order) => {
    const next = NEXT_STATUS[order.orderStatus];
    if (!next) return;
    try {
      await updateOrderStatus(order.id, next);
      dismissReadyAlert(order.id);
      await loadOrders(viewMode);
      setSelectedOrder(null);
      setToast({ message: `${order.queueNumber} ditandai ${STATUS_LABEL[next]}`, variant: 'success' });
    } catch {
      setToast({ message: 'Gagal update status. Coba lagi.', variant: 'error' });
    }
  };

  const handleConfirmCancel = async () => {
    if (!confirmCancelOrder) return;
    try {
      await updateOrderStatus(confirmCancelOrder.id, 'CANCELLED');
      dismissReadyAlert(confirmCancelOrder.id);
      await loadOrders(viewMode);
      setSelectedOrder(null);
      setToast({ message: `Pesanan ${confirmCancelOrder.queueNumber} dibatalkan`, variant: 'success' });
    } catch {
      setToast({ message: 'Gagal membatalkan pesanan.', variant: 'error' });
    } finally {
      setConfirmCancelOrder(null);
    }
  };

  const searchFiltered = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return o.queueNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
  });

  const filteredOrders =
    viewMode === 'active' && activeTab !== 'ALL'
      ? searchFiltered.filter((o) => o.orderStatus === activeTab)
      : searchFiltered;

  const VIEW_TABS: { key: ViewMode; label: string }[] = [
    { key: 'active', label: 'Antrian Aktif' },
    { key: 'failed', label: 'Gagal Bayar' },
    { key: 'history', label: 'Riwayat Hari Ini' },
  ];

  const readyCount = orders.filter((o) => o.orderStatus === 'READY').length;

  return (
    <main className="min-h-screen bg-cream px-6 py-10 md:px-16">
      <header className="mx-auto mb-8 flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-serif text-2xl text-ink">
          <img src="/images/icons/logo.png" alt="" aria-hidden className="h-7 w-7" />
          <span>OrderPoint</span>
        </div>
        <h1 className="font-serif text-4xl text-ink">Monitor Kasir</h1>

        <div className="flex items-center gap-3">
          {readyCount > 0 && (
            <button
              onClick={() => {
                setViewMode('active');
                setActiveTab('READY');
              }}
              className={`flex animate-pulse items-center gap-2 rounded-full bg-green-100 px-5 py-2 text-sm font-semibold text-green-700 ${SOFT_SHADOW}`}
            >
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {readyCount} siap diambil
            </button>
          )}
          <span
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold ${SOFT_SHADOW} ${
              connectionError ? 'bg-red-50 text-red-600' : 'bg-white text-ink'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connectionError ? 'animate-pulse bg-red-500' : 'bg-green-500'
              }`}
            />
            {connectionError ? 'Terputus dari server' : `${orders.length} pesanan`}
          </span>

          {/* BARU — badge staf yang login + tombol keluar */}
          <div className={`flex items-center gap-3 rounded-full bg-white px-5 py-2 ${SOFT_SHADOW}`}>
            <span className="text-sm font-semibold text-ink">{staffName ?? 'Staf'}</span>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-red-500 hover:underline"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto mb-6 flex max-w-6xl flex-wrap gap-3">
        {VIEW_TABS.map((v) => (
          <button
            key={v.key}
            onClick={() => {
              setViewMode(v.key);
              setActiveTab('ALL');
              setSearchQuery('');
            }}
            className={`rounded-full px-6 py-3 text-[15px] font-semibold transition active:scale-95 ${
              viewMode === v.key ? `bg-ink text-cream ${SOFT_SHADOW}` : `bg-white/60 text-ink/50`
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="mx-auto mb-6 max-w-6xl">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nomor antrian atau nama pelanggan..."
          className={`w-full rounded-full bg-white px-6 py-4 text-[15px] text-ink outline-none placeholder:text-ink/30 ${INSET_SHADOW}`}
        />
      </div>

      {viewMode === 'active' && (
        <div className="mx-auto mb-8 flex max-w-6xl flex-wrap gap-3">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-6 py-3 text-[15px] font-medium transition active:scale-95 ${
                activeTab === tab
                  ? `bg-latte text-cream ${SOFT_SHADOW}`
                  : `bg-white text-ink/60 hover:text-ink ${SOFT_SHADOW}`
              }`}
            >
              {tab === 'ALL' ? 'Semua' : STATUS_LABEL[tab]}
              {tab !== 'ALL' && (
                <span className="ml-1.5 opacity-60">
                  ({orders.filter((o) => o.orderStatus === tab).length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        {filteredOrders.length === 0 ? (
          <div className="rounded-[3rem] border border-latte/10 bg-white/50 p-16 text-center shadow-sm">
            <p className="text-ink/40">
              {searchQuery
                ? 'Tidak ada pesanan yang cocok dengan pencarian.'
                : 'Tidak ada pesanan di kategori ini.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => {
              const overdue = viewMode === 'active' && isWaitingTooLong(order.createdAt);
              const justReady = readyAlertIds.has(order.id);
              return (
                <button
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    dismissReadyAlert(order.id);
                  }}
                  className={`relative rounded-[3rem] border bg-white/50 p-8 text-left shadow-sm transition hover:shadow-md active:scale-[0.98] ${
                    justReady
                      ? 'border-green-400/60 ring-2 ring-green-300/50'
                      : overdue
                      ? 'border-amber-400/60 ring-2 ring-amber-300/40'
                      : 'border-latte/10'
                  }`}
                >
                  {justReady && (
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                      !
                    </span>
                  )}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-serif text-4xl text-ink">{order.queueNumber}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        viewMode === 'failed'
                          ? STATUS_BADGE_STYLE[order.paymentStatus]
                          : STATUS_BADGE_STYLE[order.orderStatus]
                      }`}
                    >
                      {viewMode === 'failed'
                        ? PAYMENT_LABEL[order.paymentStatus]
                        : STATUS_LABEL[order.orderStatus]}
                    </span>
                  </div>
                  <p className="text-[15px] text-ink/70">{order.customerName}</p>
                  <p
                    className={`mt-1 flex items-center gap-1.5 text-xs ${
                      overdue ? 'font-semibold text-amber-600' : 'text-ink/40'
                    }`}
                  >
                    {overdue && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                    {formatWaitTime(order.createdAt)}
                  </p>
                  {/* BARU — badge kecil siapa yang menangani, kalau sudah ada */}
                  {order.servedByStaffName && (
                    <p className="mt-1 text-xs text-ink/40">
                      Ditangani: <span className="font-medium text-ink/60">{order.servedByStaffName}</span>
                    </p>
                  )}
                  <p className="mt-4 font-serif text-2xl text-latte">
                    IDR {formatIDR(order.total)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-md rounded-[3rem] border border-latte/10 bg-white p-10 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-serif text-5xl text-ink">{selectedOrder.queueNumber}</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_STYLE[selectedOrder.orderStatus]}`}
              >
                {STATUS_LABEL[selectedOrder.orderStatus]}
              </span>
            </div>
            <p className="mb-1 text-sm text-ink/50">{formatWaitTime(selectedOrder.createdAt)}</p>
            <p className="text-[15px] text-ink/70">Atas nama: {selectedOrder.customerName}</p>

            {/* BARU — status pembayaran + waktu pasti + siapa yang menangani */}
            <div className="mb-6 mt-2 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_STYLE[selectedOrder.paymentStatus]}`}>
                {PAYMENT_STATUS_LABEL[selectedOrder.paymentStatus]}
              </span>
              {selectedOrder.servedByStaffName && (
                <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink/70">
                  Ditangani: {selectedOrder.servedByStaffName}
                </span>
              )}
            </div>

            <div className={`mb-6 space-y-3 rounded-2xl bg-cream/60 p-5 ${INSET_SHADOW}`}>
              {parseOrderItems(selectedOrder).map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-ink/80">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">
                    IDR {formatIDR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* BARU — rincian subtotal & pajak, bukan cuma total */}
            <div className="mb-8 space-y-1 border-t border-latte/10 pt-4 text-sm">
              <div className="flex justify-between text-ink/60">
                <span>Subtotal</span>
                <span>IDR {formatIDR(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>Pajak</span>
                <span>IDR {formatIDR(selectedOrder.tax)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-ink/70">Total</span>
                <span className="font-serif text-2xl font-bold text-latte">
                  IDR {formatIDR(selectedOrder.total)}
                </span>
              </div>
            </div>

            {/* BARU — waktu pasti + ID order, kecil di bawah */}
            <p className="mb-6 text-xs text-ink/30">
              Dibuat {new Date(selectedOrder.createdAt).toLocaleString('id-ID')} · ID{' '}
              {selectedOrder.midtransOrderId}
            </p>

            {viewMode === 'active' && (
              <div className="flex gap-3">
                {NEXT_STATUS[selectedOrder.orderStatus] && (
                  <button
                    onClick={() => handleAdvanceStatus(selectedOrder)}
                    className="flex-1 rounded-full bg-latte px-6 py-4 text-[15px] font-semibold text-cream transition active:scale-95"
                  >
                    Tandai {STATUS_LABEL[NEXT_STATUS[selectedOrder.orderStatus]!]}
                  </button>
                )}
                <button
                  onClick={() => setConfirmCancelOrder(selectedOrder)}
                  className="rounded-full bg-red-50 px-6 py-4 text-[15px] font-semibold text-red-600 transition active:scale-95"
                >
                  Batalkan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmCancelOrder && (
        <ConfirmModal
          title="Batalkan Pesanan?"
          message={`Pesanan ${confirmCancelOrder.queueNumber} atas nama ${confirmCancelOrder.customerName} akan ditandai dibatalkan. Tindakan ini tidak bisa diurungkan.`}
          confirmLabel="Ya, Batalkan"
          danger
          onConfirm={handleConfirmCancel}
          onCancel={() => setConfirmCancelOrder(null)}
        />
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      )}
    </main>
  );
}