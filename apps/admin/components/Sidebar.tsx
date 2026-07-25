'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/menu', label: 'Menu' },
  { href: '/staf', label: 'Staf' },
  { href: '/riwayat', label: 'Riwayat' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-latte/10 bg-white px-6 py-8">
      <div>
        <div className="mb-10 flex items-center gap-2 font-serif text-2xl text-ink">
          <span>OrderPoint</span>
        </div>
        <p className="mb-6 px-2 text-xs font-semibold uppercase tracking-widest text-ink/40">
          Admin
        </p>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((navItem) => {
            const isActive = pathname === navItem.href || pathname.startsWith(`${navItem.href}/`);
            return (
              <Link
                key={navItem.href}
                href={navItem.href}
                className={`rounded-2xl px-4 py-3 text-[15px] font-medium transition ${
                  isActive ? 'bg-cream text-ink' : 'text-ink/60 hover:bg-cream/60'
                }`}
              >
                {navItem.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="rounded-2xl px-4 py-3 text-left text-[15px] font-medium text-red-500 transition hover:bg-red-50"
      >
        Keluar
      </button>
    </aside>
  );
}