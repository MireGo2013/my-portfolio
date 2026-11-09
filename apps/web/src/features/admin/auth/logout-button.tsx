'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/features/admin/auth/auth-api';
import { ADMIN_LOGIN } from '@/features/admin/shell/paths';

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
    await logout();
    router.replace(ADMIN_LOGIN);
  };

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={pending}
      className="text-sm text-muted underline decoration-line underline-offset-4 transition-colors hover:text-accent disabled:opacity-60"
    >
      Выйти
    </button>
  );
}
