'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Login page doesn't need the guard
    if (pathname === '/admin/login') {
      setReady(true);
      return;
    }

    const token = localStorage.getItem('auth_token');
    const raw = localStorage.getItem('user_data');

    if (!token || !raw) {
      router.replace('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(raw);
      if (!user.is_staff) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        router.replace('/admin/login');
        return;
      }
      setUsername(user.username || user.email || 'Admin');
      setReady(true);
    } catch {
      router.replace('/admin/login');
    }
  }, [pathname, router]);

  if (!ready) return null;

  // Login page renders without the shell
  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar username={username} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
