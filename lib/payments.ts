/**
 * Tap Payments integration
 * Sandbox key: from env TAP_SECRET_KEY
 * Production key: same var with TAP_ENVIRONMENT=production
 */

export interface CreateChargeParams {
  amount: number;
  currency: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  redirectUrl: string;
  description: string;
  reference: string;
  metadata?: Record<string, string>;
}

export type TapChargeResponse = {
  id?: string;
  status?: string;
  transaction?: { url?: string };
  redirect?: { url?: string };
  url?: string;
  message?: string;
  errors?: unknown;
  [key: string]: unknown;
};

function tapBaseUrl() {
  return 'https://api.tap.company/v2';
}

function tapSecret() {
  return process.env.TAP_SECRET_KEY || '';
}

export function isTapConfigured() {
  return Boolean(tapSecret());
}

export async function createCharge(
  params: CreateChargeParams
): Promise<TapChargeResponse> {
  if (!isTapConfigured()) {
    // وضع تطوير بدون مفتاح Tap — يرجع رابط callback محلي
    const fakeId = `chg_dev_${Date.now().toString(36)}`;
    const url = `${params.redirectUrl}${
      params.redirectUrl.includes('?') ? '&' : '?'
    }tap_id=${fakeId}&dev=1&reference=${encodeURIComponent(params.reference)}`;
    return {
      id: fakeId,
      status: 'INITIATED',
      transaction: { url },
      url,
      _dev: true,
    };
  }

  const base =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  const res = await fetch(`${tapBaseUrl()}/charges`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tapSecret()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      threeDS_enable: true,
      customer: {
        first_name: params.customer.name,
        email: params.customer.email,
        phone: {
          country_code: '966',
          number: params.customer.phone.replace(/\D/g, '').slice(-9) || '500000000',
        },
      },
      source: { id: 'src_all' },
      redirect: { url: params.redirectUrl },
      post: { url: `${base}/api/payments/webhook` },
      description: params.description,
      reference: { transaction: params.reference },
      metadata: params.metadata || {},
    }),
  });

  return (await res.json()) as TapChargeResponse;
}

export async function verifyCharge(chargeId: string): Promise<boolean> {
  if (!chargeId) return false;

  if (!isTapConfigured()) {
    // في التطوير نقبل معرفات chg_dev_* بعد التأكيد من صفحة الـ callback
    return chargeId.startsWith('chg_dev_') || chargeId.startsWith('chg_');
  }

  const res = await fetch(`${tapBaseUrl()}/charges/${chargeId}`, {
    headers: { Authorization: `Bearer ${tapSecret()}` },
  });
  const data = (await res.json()) as TapChargeResponse;
  return data.status === 'CAPTURED';
}

export async function fetchCharge(chargeId: string): Promise<TapChargeResponse> {
  if (!isTapConfigured()) {
    return {
      id: chargeId,
      status: chargeId.startsWith('chg_dev_') ? 'CAPTURED' : 'FAILED',
      _dev: true,
    };
  }
  const res = await fetch(`${tapBaseUrl()}/charges/${chargeId}`, {
    headers: { Authorization: `Bearer ${tapSecret()}` },
  });
  return (await res.json()) as TapChargeResponse;
}

export function extractCheckoutUrl(charge: TapChargeResponse): string | null {
  return (
    charge.transaction?.url ||
    charge.redirect?.url ||
    charge.url ||
    null
  );
}
