import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { homePathForRole } from '@/lib/access';
import { findUserByEmail, isAirtableConfigured } from '@/lib/airtable';
import { logAction } from '@/lib/auditLog';
import { ensureAuthUrl } from '@/lib/ensureAuthUrl';
import { portalFromEmail, type PortalId } from '@/lib/loginPortal';
import { authorizeTeacherAccount } from '@/lib/childRoom/teacherAccounts';
import {
  authUsesSecureCookies,
  nextAuthSecret,
  sessionTokenCookieName,
} from '@/lib/authConfig';
import {
  DEV_DEMO_PASSWORD,
  DEV_GUEST_SPECIALIST_PASSWORD,
  demoFallbackHash,
} from '@/lib/demoAccounts';
import { verifyPassword } from '@/lib/password';
import { normalizeSessionRole } from '@/lib/permissions';
import { verifyPrivilegedLogin } from '@/lib/privilegedCredentials';
import { parentStageForUser } from '@/lib/server/clinicalRecordService';
import { authorizeUserAccount } from '@/lib/userAccounts';

const authUrl = ensureAuthUrl();
const secureCookies = authUsesSecureCookies(authUrl);

export { homePathForRole };

/** حسابات @taaluf.local — سياسة كلمات المرور في lib/demoAccounts.ts */
const DEMO_USERS = [
  {
    id: 'usr_admin',
    email: 'admin@taaluf.local',
    devPassword: DEV_DEMO_PASSWORD,
    name: 'حازم',
    role: 'admin',
  },
  {
    id: 'usr_advisor',
    email: 'samer@taaluf.local',
    devPassword: DEV_DEMO_PASSWORD,
    name: 'د. سامر',
    role: 'scientific_advisor',
  },
  {
    id: 'usr_specialist',
    email: 'specialist@taaluf.local',
    devPassword: DEV_DEMO_PASSWORD,
    name: 'أخصائي تآلف',
    role: 'specialist',
  },
  {
    id: 'usr_teacher',
    email: 'teacher@taaluf.local',
    devPassword: DEV_DEMO_PASSWORD,
    name: 'معلّم تآلف',
    role: 'teacher',
  },
  {
    id: 'usr_parent',
    email: 'parent@taaluf.local',
    devPassword: DEV_DEMO_PASSWORD,
    name: 'ولي أمر',
    role: 'parent',
  },
  {
    id: 'usr_specialist_guest',
    email: 'guest-specialist@taaluf.local',
    devPassword: DEV_GUEST_SPECIALIST_PASSWORD,
    name: 'مختص (بعد الدفع)',
    role: 'specialist',
  },
] as const;

export const authOptions: NextAuthOptions = {
  // يساعد على Vercel عند اختلال بناء روابط الاستضافة
  ...( { trustHost: true } as Partial<NextAuthOptions> ),
  useSecureCookies: secureCookies,
  cookies: {
    sessionToken: {
      name: sessionTokenCookieName(authUrl),
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: secureCookies },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'البريد', type: 'email' },
        password: { label: 'كلمة المرور', type: 'password' },
        portal: { label: 'البوابة', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password || '';
        const portal = String(credentials?.portal || '') as PortalId;
        if (!email || !password) return null;

        const emailPortal = portalFromEmail(email);
        if (emailPortal && portal && emailPortal !== portal) {
          return null;
        }

        const dev = DEMO_USERS.find((u) => u.email === email);
        if (dev) {
          const isValid = await verifyPrivilegedLogin(
            email,
            password,
            demoFallbackHash(dev.devPassword)
          );
          if (!isValid) return null;
          return {
            id: dev.id,
            email: dev.email,
            name: dev.name,
            role: dev.role,
          };
        }

        const selfRegistered = await authorizeUserAccount(email, password).catch(() => null);
        if (selfRegistered) return selfRegistered;

        if (isAirtableConfigured()) {
          try {
            const user = await findUserByEmail(email);
            if (user?.password_hash) {
              const isValid = await verifyPassword(
                password,
                user.password_hash
              );
              if (!isValid) return null;
              const role = normalizeSessionRole(user.role);
              if (!role) return null;
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role,
              };
            }
          } catch {
            /* fall through */
          }
        }

        const teacher = await authorizeTeacherAccount(email, password);
        if (teacher) return teacher;

        return null;
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  events: {
    async signIn({ user }) {
      await logAction({
        userId: user.id || '',
        action: 'login',
        entityType: 'user',
        entityId: user.id || '',
      });
    },
    async signOut({ token }) {
      await logAction({
        userId: String(token?.id || token?.sub || ''),
        action: 'logout',
        entityType: 'user',
        entityId: String(token?.id || token?.sub || ''),
      });
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // إصلاح روابط تالفة مثل https://https الناتجة عن NEXTAUTH_URL الخاطئ
      try {
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) return url;
      } catch {
        /* ignore */
      }
      if (url.includes('/admin')) return `${baseUrl}/admin`;
      if (url.includes('/hub')) return `${baseUrl}/hub`;
      if (url.includes('/parent')) return `${baseUrl}/parent`;
      if (url.includes('/dashboard')) return `${baseUrl}/dashboard`;
      return baseUrl;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = normalizeSessionRole((user as { role?: string }).role) ?? 'guest';
        token.id = user.id;
      }
      if ((user || trigger === 'update') && token.role === 'parent' && token.id) {
        token.parentStage = (await parentStageForUser(token.id).catch(() => null)) ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      const role = normalizeSessionRole(token.role);
      // دور مجهول/ضيف: جلسة بلا مستخدم → كل مسار API يتحقق من session.user يرفض تلقائياً
      if (!role) return { expires: session.expires };
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = role;
        session.user.parentStage = token.parentStage;
      }
      return session;
    },
  },
  secret: nextAuthSecret(),
};
