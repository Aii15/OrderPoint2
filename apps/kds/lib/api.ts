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
  servedByStaffId: string | null;   // BARU
  servedByStaffName: string | null; // BARU
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

export async function updateOrderStatus(id: string, orderStatus: OrderStatus): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderStatus }),
  });
  if (!response.ok) throw new Error('Gagal update status pesanan');
  return response.json();
}