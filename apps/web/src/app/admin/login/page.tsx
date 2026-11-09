import type { Metadata } from 'next';
import { LoginForm } from '@/features/admin/auth/login-form';

export const metadata: Metadata = { title: 'Вход' };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold">Вход в админку</h1>
      <LoginForm />
    </main>
  );
}
