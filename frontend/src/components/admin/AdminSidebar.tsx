'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Products', icon: '🎁' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/categories', label: 'Categories', icon: '🗂️' },
  { href: '/admin/occasions', label: 'Occasions', icon: '🎉' },
  { href: '/admin/coupons', label: 'Coupons', icon: '🏷️' },
  { href: '/admin/returns', label: 'Returns', icon: '↩️' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/bulk-inquiries', label: 'Bulk Inquiries', icon: '🏢' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-gray-100 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-700">
        <span className="text-lg font-semibold tracking-tight">Radhvi Admin</span>
      </div>
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {NAV.map(({ href, label, icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-gray-700 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
