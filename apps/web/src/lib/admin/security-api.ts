import type { components } from '../api/schema';
import { adminClient, unwrap, unwrapEmpty } from './admin-client';

export type TwoFactorStatus = components['schemas']['TwoFactorStatusDto'];
export type TwoFactorSetup = components['schemas']['TwoFactorSetupDto'];

export const twoFactorKey = () => ['admin', 'security', 'totp'] as const;

export async function fetchTwoFactorStatus(
  signal?: AbortSignal,
): Promise<TwoFactorStatus> {
  return unwrap(
    await adminClient().GET('/api/v1/admin/security/totp', { signal }),
  );
}

export async function startTwoFactorSetup(): Promise<TwoFactorSetup> {
  return unwrap(await adminClient().POST('/api/v1/admin/security/totp/setup'));
}

export async function enableTwoFactor(code: string): Promise<string[]> {
  const { backupCodes } = unwrap(
    await adminClient().POST('/api/v1/admin/security/totp/enable', {
      body: { code },
    }),
  );
  return backupCodes;
}

export async function disableTwoFactor(code: string): Promise<void> {
  unwrapEmpty(
    await adminClient().POST('/api/v1/admin/security/totp/disable', {
      body: { code },
    }),
  );
}
