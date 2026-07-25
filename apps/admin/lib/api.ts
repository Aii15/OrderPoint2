import { authHeaders } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

// --- Tipe menu (sinkron dengan apps/api model MenuItem & apps/kiosk MenuItem) ---

export type Category = 'Coffee' | 'Pastries' | 'Beverages' | 'Side Dishes';

export interface MenuAttribute {
  label: string;
  value: string;
}

export interface MenuMeter {
  label: string;
  value: number;
}

export interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string;
  composition: string[];
  attributes: MenuAttribute[];
  meters: MenuMeter[];
  servingDetails: string[];
  price: number;
  availability: string;
  imageAlt: string;
  sortOrder: number;
}

export type MenuItemInput = Omit<MenuItem, 'sortOrder'> & { sortOrder?: number };

export const CATEGORIES: Category[] = ['Coffee', 'Pastries', 'Beverages', 'Side Dishes'];

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/menu`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Gagal mengambil data menu');
  return response.json();
}

// BARU — satu menu item, dipakai halaman /menu/[id]/edit
export async function fetchMenuItem(id: string): Promise<MenuItem> {
  const response = await fetch(`${API_BASE_URL}/api/menu/${id}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Menu item tidak ditemukan');
  return response.json();
}

export async function createMenuItem(input: MenuItemInput): Promise<MenuItem> {
  const response = await fetch(`${API_BASE_URL}/api/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Gagal menambah menu item (cek apakah id sudah dipakai)');
  return response.json();
}

export async function updateMenuItem(
  id: string,
  input: Partial<MenuItemInput>,
): Promise<MenuItem> {
  const response = await fetch(`${API_BASE_URL}/api/menu/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Gagal memperbarui menu item');
  return response.json();
}

export async function deleteMenuItem(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/menu/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error('Gagal menghapus menu item');
}

// --- Tipe order (subset dari apps/cashier/lib/api.ts, dipakai dashboard & riwayat) ---

export type OrderStatus = 'NEW' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED';

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
  servedByStaffId: string | null;   // BARU
  servedByStaffName: string | null; // BARU
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

// `order.items` disimpan sebagai JSON string mentah di database (lihat
// apps/api CreateOrderDto) — helper ini mem-parsing-nya jadi array, dengan
// fallback array kosong kalau datanya rusak/tidak valid.
export function parseOrderItems(order: Order): OrderItem[] {
  try {
    const parsed = JSON.parse(order.items);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function fetchActiveOrders(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Gagal mengambil data pesanan aktif');
  return response.json();
}

export async function fetchFailedOrders(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders/failed`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Gagal mengambil data pesanan gagal bayar');
  return response.json();
}

export async function fetchCompletedToday(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders/completed-today`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Gagal mengambil riwayat pesanan hari ini');
  return response.json();
}

// BARU — riwayat semua order (semua status) pada satu tanggal, dipilih lewat kalender
export async function fetchOrderHistory(date: string): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders/history?date=${date}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Gagal mengambil riwayat pesanan');
  return response.json();
}

// BARU — detail satu order lewat id internal, dipakai halaman /riwayat/[id]
export async function fetchOrderById(id: string): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/api/orders/detail/${id}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Order tidak ditemukan');
  return response.json();
}

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

// --- BARU — kelola staf kasir ---

export interface StaffMember {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export async function fetchStaffList(): Promise<StaffMember[]> {
  const response = await fetch(`${API_BASE_URL}/api/staff`, {
    cache: 'no-store',
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error('Gagal mengambil daftar staf');
  return response.json();
}

export async function createStaff(input: { name: string; pin: string }): Promise<StaffMember> {
  const response = await fetch(`${API_BASE_URL}/api/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Gagal menambah staf (cek apakah nama sudah dipakai)');
  return response.json();
}

export async function updateStaff(
  id: string,
  input: Partial<{ name: string; pin: string; active: boolean }>,
): Promise<StaffMember> {
  const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Gagal memperbarui staf');
  return response.json();
}

export async function deleteStaff(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error('Gagal menghapus staf');
}