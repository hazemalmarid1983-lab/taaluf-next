/** رموز الاشتراك — للخادم فقط، لا تُستورد من مكوّنات العميل */

const SUBSCRIPTION_CODES = [
  'TAALUF-VIP',
  'مشترك-تآلف',
  'SUB-TAALUF-2026',
];

export function normalizeCode(code: string) {
  return code.trim().replace(/\s+/g, '');
}

export function isValidSubscriptionCode(code: string) {
  const n = normalizeCode(code);
  return SUBSCRIPTION_CODES.some(
    (c) => normalizeCode(c).toLowerCase() === n.toLowerCase()
  );
}
