import { authHeaders } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export type OrderStatus = 'NEW' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  queueNumber: string;
  customerName: string;
  items: string;
  subtotal: number;
  tax: number;
  total: number;
  midtransOrderId: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  // BARU — staf kasir terakhir yang menangani order ini (null kalau belum
  // pernah ditangani lewat aksi berbasis login).
  servedByStaffId: string | null;
  servedByStaffName: string | null;
  createdAt: string;
  updatedAt: string;
}

export function parseOrderItems(order: Order): OrderItem[] {
  try {
    return JSON.parse(order.items);
  } catch {
    return [];
  }
}

export async function fetchActiveOrders(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Gagal mengambil data pesanan');
  return response.json();
}

export async function fetchFailedOrders(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders/failed`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Gagal mengambil data pesanan gagal bayar');
  return response.json();
}

export async function fetchCompletedToday(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders/completed-today`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Gagal mengambil riwayat pesanan');
  return response.json();
}

// BARU — sekarang mengirim Authorization header staf yang login (kalau ada),
// supaya apps/api bisa mencatat siapa yang menangani order ini.
export async function updateOrderStatus(id: string, orderStatus: OrderStatus): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ orderStatus }),
  });
  if (!response.ok) throw new Error('Gagal update status pesanan');
  return response.json();
}

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  NEW: 'IN_PROGRESS',
  IN_PROGRESS: 'READY',
  READY: 'COMPLETED',
  COMPLETED: null,
  CANCELLED: null,
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: 'Baru',
  IN_PROGRESS: 'Diproses',
  READY: 'Siap Diambil',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Menunggu Bayar',
  PAID: 'Sudah Dibayar',
  EXPIRED: 'Kedaluwarsa',
};