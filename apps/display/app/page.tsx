'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchActiveOrders, type Order } from '@/lib/api';
import { playNotifySound } from '@/lib/useNotifySound';

const POLL_INTERVAL_MS = 4000;
const HIGHLIGHT_DURATION_MS = 3000;

export default function DisplayPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(true);
  const [now, setNow] = useState(new Date());
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  const prevReadyIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await fetchActiveOrders();
        if (cancelled) return;

        setOrders(data);
        setConnected(true);

        const currentReadyIds = new Set(
          data.filter((o) => o.orderStatus === 'READY').map((o) => o.id),
        );

        if (!isFirstLoadRef.current) {
          const newlyReady = [...currentReadyIds].filter(
            (id) => !prevReadyIdsRef.current.has(id),
          );

          if (newlyReady.length > 0) {
            playNotifySound();
            setHighlightedIds((prev) => new Set([...prev, ...newlyReady]));
            newlyReady.forEach((id) => {
              setTimeout(() => {
                setHighlightedIds((prev) => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
              }, HIGHLIGHT_DURATION_MS);
            });
          }
        }

        prevReadyIdsRef.current = currentReadyIds;
        isFirstLoadRef.current = false;
      } catch {
        if (!cancelled) setConnected(false);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const clockInterval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const ready = orders
    .filter((o) => o.orderStatus === 'READY')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const preparing = orders
    .filter((o) => o.orderStatus === 'NEW' || o.orderStatus === 'IN_PROGRESS')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const timeLabel = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const isIdle = orders.length === 0;

  return (
    <div className="flex h-screen w-screen flex-col bg-board text-paper">
      <header className="flex items-center justify-between border-b border-seam px-10 py-4">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold uppercase tracking-[0.15em]">OrderPoint</span>
          <span className="text-sm uppercase tracking-[0.2em] text-paper/40">Papan Antrian</span>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`h-2 w-2 rounded-full ${connected ? 'bg-signal' : 'bg-red-500'}`}
            title={connected ? 'Terhubung' : 'Menyambung ulang...'}
          />
          <span className="font-led text-2xl text-paper/70">{timeLabel}</span>
        </div>
      </header>

      {isIdle ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <p className="text-4xl font-semibold uppercase tracking-wide text-paper/50">
            Menunggu Pesanan
          </p>
          <p className="font-led text-xl text-paper/30">Nomor antrian akan tampil di sini</p>
        </div>
      ) : (
        <>
          {/* Siap Diambil — dominan, kontras maksimal */}
          <section className="flex flex-[2.4] flex-col items-center justify-center gap-8 px-8 py-4">
            <h2 className="text-xl font-semibold uppercase tracking-[0.35em] text-signal">
              Siap Diambil
            </h2>

            {ready.length === 0 ? (
              <p className="text-2xl uppercase tracking-wide text-paper/25">Belum ada nomor</p>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6">
                {ready.map((order) => (
                  <div
                    key={order.id}
                    className={`border-b-4 border-signal-dim px-2 pb-1 ${
                      highlightedIds.has(order.id) ? 'animate-led-ignite' : ''
                    }`}
                  >
                    <span className="font-led text-[clamp(4.5rem,13vw,12rem)] leading-none text-signal">
                      {order.queueNumber}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sedang Disiapkan — subordinat, statis, tanpa animasi */}
          <section className="flex flex-1 flex-col items-center justify-center gap-3 border-t border-seam px-8 py-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-paper/40">
              Sedang Disiapkan
            </h3>

            {preparing.length === 0 ? (
              <p className="text-base uppercase text-paper/20">Antrian dapur kosong</p>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
                {preparing.map((order) => (
                  <span key={order.id} className="font-led text-3xl text-signal-dim md:text-4xl">
                    {order.queueNumber}
                  </span>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}