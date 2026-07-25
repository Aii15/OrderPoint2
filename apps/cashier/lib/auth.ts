const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
const TOKEN_KEY = 'orderpoint_cashier_token';
const STAFF_NAME_KEY = 'orderpoint_cashier_staff_name';

export interface StaffOption {
  id: string;
  name: string;
}

export async function fetchActiveStaff(): Promise<StaffOption[]> {
  const response = await fetch(`${API_BASE_URL}/api/staff/active`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Gagal mengambil daftar staf');
  return response.json();
}

export async function loginStaff(staffId: string, pin: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/staff-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId, pin }),
  });

  if (!response.ok) {
    throw new Error('PIN salah, coba lagi');
  }

  const data: { token: string; staffName: string } = await response.json();
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(STAFF_NAME_KEY, data.staffName);
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(STAFF_NAME_KEY);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStaffName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STAFF_NAME_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}