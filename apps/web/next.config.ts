import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  agentRules: false, // не создавать AGENTS.md в репозитории
  cacheLife: {
    // Контент меняется редко, а заходят на сайт нечасто. Длинный expire нужен,
    // чтобы посетитель всегда сразу получал страницу, а не ждал ответа API,
    // который мог заснуть или упасть. Обновление идёт в фоне раз в час.
    content: {
      stale: 300,
      revalidate: 3600,
      expire: 60 * 60 * 24 * 365,
    },
  },
};

export default nextConfig;
