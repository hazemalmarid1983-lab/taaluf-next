import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import {
  arePaymentsDisabled,
  canAccessAssessment,
  canAccessSpecialistPortal,
  ENTITLEMENTS_COOKIE,
  parseEntitlements,
} from '@/lib/access';
import { CONSENT_COOKIE } from '@/lib/consentConstants';

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as string | undefined;
    const path = req.nextUrl.pathname;
    const paymentsOff = arePaymentsDisabled();
    const entitlements = parseEntitlements(
      req.cookies.get(ENTITLEMENTS_COOKIE)?.value
    );

    // صفحات الدفع معطّلة في الوضع التجريبي
    if (
      paymentsOff &&
      (path.startsWith('/parent/pay-assessment') ||
        path.startsWith('/parent/booking/pay') ||
        path.startsWith('/specialist/pay') ||
        path.startsWith('/payments/'))
    ) {
      const dest =
        role === 'parent'
          ? '/parent'
          : role === 'admin'
            ? '/admin'
            : role
              ? '/dashboard'
              : '/login';
      return NextResponse.redirect(new URL(dest, req.url));
    }

    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/login?portal=admin', req.url));
    }

    if (path.startsWith('/parent')) {
      if (role !== 'parent' && role !== 'admin') {
        return NextResponse.redirect(new URL('/login?portal=parent', req.url));
      }
      if (
        !paymentsOff &&
        role !== 'admin' &&
        (path.startsWith('/parent/assessment') ||
          path.startsWith('/parent/assess')) &&
        !canAccessAssessment(entitlements)
      ) {
        return NextResponse.redirect(new URL('/parent/pay-assessment', req.url));
      }
    }

    if (path.startsWith('/dashboard')) {
      const parentAllowed =
        path.startsWith('/dashboard/screening') ||
        path.startsWith('/dashboard/parent-assessment') ||
        path.startsWith('/dashboard/games') ||
        path.startsWith('/dashboard/messages') ||
        path.startsWith('/dashboard/goals');

      if (role === 'parent' && !parentAllowed) {
        return NextResponse.redirect(new URL('/parent', req.url));
      }
      if (role === 'admin') {
        // الإدارة تصل للوحة المختص للاطلاع
      } else if (
        !paymentsOff &&
        role !== 'parent' &&
        !canAccessSpecialistPortal(entitlements, role)
      ) {
        return NextResponse.redirect(new URL('/specialist/pay', req.url));
      }
    }

    if (
      path.startsWith('/dashboard/assessments/new') &&
      req.cookies.get(CONSENT_COOKIE)?.value !== 'true'
    ) {
      return NextResponse.redirect(new URL('/consent', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith('/specialist/pay')) return true;
        if (path.startsWith('/payments/callback')) return true;
        if (arePaymentsDisabled() && path.startsWith('/payments/')) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/parent/:path*',
    '/specialist/:path*',
    '/payments/:path*',
    '/consent',
  ],
};
