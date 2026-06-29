import { base44 } from '@/api/base44Client';

const STRIPE_KEY = 'fitpro_stripe_config';

export function getLocalStripeConfig() {
  try {
    return JSON.parse(localStorage.getItem(STRIPE_KEY) || '{}');
  } catch {
    return {};
  }
}

export async function resolvePublishableKey() {
  const local = getLocalStripeConfig().publishableKey;
  if (local?.startsWith('pk_')) return local;

  try {
    const rows = await base44.entities.ConfiguracaoStripe.list();
    const pk = rows[0]?.publishableKey || rows[0]?.email;
    if (pk?.startsWith('pk_')) return pk;
  } catch {
    /* ignore */
  }

  const envPk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  return envPk?.startsWith('pk_') ? envPk : '';
}
