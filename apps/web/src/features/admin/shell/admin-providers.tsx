'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { createAdminQueryClient } from '@/features/admin/shell/query-client';

export function AdminProviders({ children }: { children: ReactNode }) {
  // Клиент создаётся один раз на вкладку. В переменной модуля он стал бы
  // общим для всех запросов на сервере, и кэш одного посетителя увидел бы другой
  const [client] = useState(createAdminQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
