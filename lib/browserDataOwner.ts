/**
 * بيانات الطفل والتقييمات محفوظة في متصفح المستخدم (مفاتيح taaluf*) دون ربط بالحساب.
 * هذا الملف يربطها بالحساب الذي أنشأها: عند دخول حساب مختلف على نفس المتصفح تُمسح كلها
 * حتى لا يرى مستخدم جديد ملف طفل مستخدم آخر.
 */

import { ENTITLEMENTS_COOKIE } from '@/lib/access';

export const BROWSER_OWNER_KEY = 'taaluf.browserOwner.v1';

/** تفضيلات واجهة لا تخص طفلاً بعينه */
const DEVICE_PREFERENCE_KEYS = new Set([BROWSER_OWNER_KEY, 'taaluf_lang']);

type StorageLike = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'>;

export function browserOwnerKey(user: { email?: string | null; id?: string | null } | null | undefined) {
  const email = String(user?.email ?? '').trim().toLowerCase();
  if (email) return email;
  return String(user?.id ?? '').trim();
}

function accountScopedKeys(storage: StorageLike): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && key.startsWith('taaluf') && !DEVICE_PREFERENCE_KEYS.has(key)) keys.push(key);
  }
  return keys;
}

export function clearAccountBrowserData(storages: StorageLike[]): number {
  let removed = 0;
  for (const storage of storages) {
    for (const key of accountScopedKeys(storage)) {
      storage.removeItem(key);
      removed += 1;
    }
  }
  return removed;
}

function browserStorages(): StorageLike[] {
  const list: StorageLike[] = [];
  try {
    list.push(window.localStorage);
  } catch {}
  try {
    list.push(window.sessionStorage);
  } catch {}
  return list;
}

/**
 * يضمن أن بيانات المتصفح تخص الحساب الحالي. يعيد true إذا مُسحت بيانات حساب آخر.
 * بيانات بلا مالك مسجَّل تُعامل كبيانات حساب آخر.
 */
export function ensureBrowserDataOwner(
  ownerKey: string,
  storages: StorageLike[] = browserStorages()
): boolean {
  const primary = storages[0];
  if (!ownerKey || !primary) return false;
  if (primary.getItem(BROWSER_OWNER_KEY) === ownerKey) return false;
  const removed = clearAccountBrowserData(storages);
  if (typeof document !== 'undefined') {
    document.cookie = `${ENTITLEMENTS_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
  }
  primary.setItem(BROWSER_OWNER_KEY, ownerKey);
  return removed > 0;
}
