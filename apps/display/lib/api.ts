const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export type OrderStatus = 'NEW' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED';

export interface Order {
  id: string;
  queueNumber: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export async function fetchActiveOrders(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/api/orders`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Gagal mengambil data pesanan');
  return response.json();
}