import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import {
  arePaymentsDisabled,
  canAccessAssessment,
  canAccessSpecialistPortal,
  ENTITLEMENTS_COOKIE,
  homePathForRole,
  parseEntitlements,
} from '@/lib/access';
import { CONSENT_COOKIE } from '@/lib/consentConstants';
import { ensureAuthUrl } from '@/lib/ensureAuthUrl';
import {
  isLearningDifficultiesEnabled,
  isLearningDifficultiesRoute,
} from '@/lib/featureFlags';

ensureAuthUrl();

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as string | undefined;
    const path = req.nextUrl.pathname;
    const paymentsOff = arePaymentsDisabled();
    const entitlements = parseEntitlements(
      req.cookies.get(ENTITLEMENTS_COOKIE)?.value
    );

    // صفحات الدفع معطّلة في الوضع التجريبي → لا نوقف الحجز/Tap الخلفي
    if (paymentsOff) {
      if (path.startsWith('/parent/booking/pay')) {
        return NextResponse.redirect(new URL('/parent/booking', req.url));
      }
      if (path.startsWith('/specialist/pay') || path.startsWith('/payments/')) {
        const dest =
          role === 'parent'
            ? '/parent'
            : role === 'admin'
              ? '/admin'
              : role === 'scientific_advisor'
                ? '/hub'
                : role
                  ? '/dashboard'
                  : '/login?portal=specialist';
        return NextResponse.redirect(new URL(dest, req.url));
      }
    }

    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(
        new URL(role ? homePathForRole(role) : '/login?portal=admin', req.url)
      );
    }

    if (
      path.startsWith('/hub') &&
      role !== 'admin' &&
      role !== 'scientific_advisor'
    ) {
      return NextResponse.redirect(
        new URL(role ? homePathForRole(role) : '/login?portal=hub', req.url)
      );
    }

    if (!isLearningDifficultiesEnabled() && isLearningDifficultiesRoute(path)) {
      const dest =
        path.startsWith('/dashboard/pathways') ||
        path.startsWith('/dashboard/screening-learning')
          ? '/dashboard/screening'
          : role === 'parent'
            ? '/parent'
            : '/dashboard';
      return NextResponse.redirect(new URL(dest, req.url));
    }

    if (path.startsWith('/parent')) {
      if (role !== 'parent' && role !== 'admin') {
        return NextResponse.redirect(
          new URL(role ? homePathForRole(role) : '/login?portal=parent', req.url)
        );
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
        path.startsWith('/dashboard/pathways') ||
        path.startsWith('/dashboard/academic') ||
        path.startsWith('/dashboard/results') ||
        path.startsWith('/dashboard/screening') ||
        path.startsWith('/dashboard/parent-assessment') ||
        path.startsWith('/dashboard/games') ||
        path.startsWith('/dashboard/home-classroom') ||
        path.startsWith('/dashboard/tools-bank') ||
        path.startsWith('/dashboard/messages') ||
        path.startsWith('/dashboard/goals') ||
        path.startsWith('/dashboard/parent');

      if (role === 'parent' && !parentAllowed) {
        return NextResponse.redirect(new URL('/parent', req.url));
      }

      const paidParentPath =
        path.startsWith('/dashboard/parent-assessment') ||
        path.startsWith('/dashboard/games') ||
        path.startsWith('/dashboard/goals');

      if (
        !paymentsOff &&
        role === 'parent' &&
        paidParentPath &&
        !canAccessAssessment(entitlements)
      ) {
        return NextResponse.redirect(new URL('/parent/pay-assessment', req.url));
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
      (path.startsWith('/dashboard/assessments/new') ||
        path.startsWith('/parent/assessment')) &&
      req.cookies.get(CONSENT_COOKIE)?.value !== 'true'
    ) {
      return NextResponse.redirect(new URL('/consent', req.url));
    }

    return NextResponse.next();
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
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
    '/hub',
    '/hub/:path*',
    '/parent',
    '/parent/:path*',
    '/specialist/:path*',
    '/payments/:path*',
    '/consent',
    '/assessment/:path*',
    '/games/:path*',
    '/messages',
    '/bookings/:path*',
    '/video-analysis',
    '/sensory-room',
    '/sensory-room/:path*',
    '/sensory-rooms',
    '/sensory-rooms/:path*',
    '/sensory-matching',
    '/sensory-matching/:path*',
  ],
};
