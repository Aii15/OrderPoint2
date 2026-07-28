import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OrderPoint — Papan Antrian',
  description: 'Customer-facing display showing order pickup status',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}