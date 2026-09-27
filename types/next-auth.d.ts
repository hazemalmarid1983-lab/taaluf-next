import 'next-auth';
import 'next-auth/jwt';
import type { ParentStage } from '@/lib/parentRouteGuard';

declare module 'next-auth' {
  interface Session {
    /** غائب لدور مجهول/ضيف (رفض افتراضي) */
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      /** من سجل الخادم عند الدخول أو update() — لا من كوكي العميل */
      parentStage?: ParentStage;
    };
  }

  interface User {
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    parentStage?: ParentStage;
  }
}
