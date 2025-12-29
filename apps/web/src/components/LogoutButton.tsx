'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
    >
      Sign Out
    </button>
  );
}
