import { NextResponse } from 'next/server';
import { hashPasswordSync } from '@/lib/password';
import {
  changePrivilegedPassword,
  isPrivilegedLoginEmail,
  privilegedAccountIdForEmail,
} from '@/lib/privilegedCredentials';
import { portalFromEmail, type PortalId } from '@/lib/loginPortal';

const DEFAULT_DEMO_HASH = hashPasswordSync('taaluf123');

function portalForAccount(
  account: ReturnType<typeof privilegedAccountIdForEmail>
): PortalId | null {
  if (account === 'admin') return 'admin';
  if (account === 'advisor') return 'hub';
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
      portal?: string;
    };

    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    const confirmPassword = String(body.confirmPassword || '');
    const portal = String(body.portal || '') as PortalId;

    if (!email || !isPrivilegedLoginEmail(email)) {
      return NextResponse.json(
        {
          error: 'NOT_ALLOWED',
          message: 'تغيير كلمة المرور متاح للإدارة والمستشار فقط',
        },
        { status: 403 }
      );
    }

    const account = privilegedAccountIdForEmail(email);
    const expectedPortal = portalForAccount(account);
    const emailPortal = portalFromEmail(email);
    if (
      portal !== expectedPortal ||
      (emailPortal && emailPortal !== expectedPortal)
    ) {
      return NextResponse.json(
        {
          error: 'PORTAL_MISMATCH',
          message:
            'اختر البوابة الصحيحة لحسابك — لا يمكن مشاركة كلمة المرور بين البوابات',
        },
        { status: 403 }
      );
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'أكمل جميع حقول كلمة المرور' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'CONFIRM_MISMATCH', message: 'تأكيد كلمة المرور غير متطابق' },
        { status: 400 }
      );
    }

    const result = await changePrivilegedPassword({
      email,
      currentPassword,
      newPassword,
      fallbackHash: DEFAULT_DEMO_HASH,
    });

    if (!result.ok) {
      const messages: Record<string, string> = {
        CURRENT_INVALID: 'كلمة المرور الحالية غير صحيحة',
        PASSWORD_TOO_SHORT: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل',
        PASSWORD_SPACES: 'لا تضف مسافات في بداية أو نهاية كلمة المرور',
        PASSWORD_SAME: 'اختر كلمة مرور جديدة مختلفة عن الحالية',
        NOT_PRIVILEGED: 'غير مسموح',
      };
      return NextResponse.json(
        {
          error: result.code,
          message: messages[result.code] || 'تعذر تحديث كلمة المرور',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'تم حفظ كلمة المرور الخاصة بك بنجاح',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CHANGE_PASSWORD_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
