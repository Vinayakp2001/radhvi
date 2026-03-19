'use client';

import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Props {
  username: string;
}

export default function AdminTopbar({ username }: Props) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await api.post('/auth/logout/');
    } catch {
      // ignore
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    router.replace('/admin/login');
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <span className="text-sm text-gray-500">Welcome back, <span className="font-medium text-gray-800">{username}</span></span>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        Sign out
      </button>
    </header>
  );
}
