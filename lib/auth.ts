import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { homePathForRole } from '@/lib/access';
import { findUserByEmail, isAirtableConfigured } from '@/lib/airtable';
import { logAction } from '@/lib/auditLog';
import { ensureAuthUrl } from '@/lib/ensureAuthUrl';
import { portalFromEmail, type PortalId } from '@/lib/loginPortal';
import { hashPasswordSync, verifyPassword } from '@/lib/password';
import { verifyPrivilegedLogin } from '@/lib/privilegedCredentials';

ensureAuthUrl();

export { homePathForRole };

function envFlag(name: string) {
  return (
    String(process.env[name] || '')
      .trim()
      .toLowerCase() === 'true'
  );
}

/** حسابات تجريبية — تُفعَّل في الطيّار أو عند غياب Tap */
function demoUsersAllowed() {
  return (
    process.env.NODE_ENV !== 'production' ||
    envFlag('ALLOW_DEMO_USERS') ||
    envFlag('TAALUF_PILOT_MODE') ||
    envFlag('NEXT_PUBLIC_PAYMENTS_DISABLED') ||
    envFlag('NEXT_PUBLIC_TAALUF_PILOT_MODE') ||
    envFlag('PAYMENTS_DISABLED') ||
    !String(process.env.TAP_SECRET_KEY || '').trim()
  );
}

const DEMO_USERS = [
  {
    id: 'usr_admin',
    email: 'admin@taaluf.local',
    password_hash: hashPasswordSync('taaluf123'),
    name: 'حازم',
    role: 'admin',
  },
  {
    id: 'usr_advisor',
    email: 'samer@taaluf.local',
    password_hash: hashPasswordSync('taaluf123'),
    name: 'د. سامر',
    role: 'scientific_advisor',
  },
  {
    id: 'usr_specialist',
    email: 'specialist@taaluf.local',
    password_hash: hashPasswordSync('taaluf123'),
    name: 'أخصائي تآلف',
    role: 'specialist',
  },
  {
    id: 'usr_teacher',
    email: 'teacher@taaluf.local',
    password_hash: hashPasswordSync('taaluf123'),
    name: 'معلّم تآلف',
    role: 'teacher',
  },
  {
    id: 'usr_parent',
    email: 'parent@taaluf.local',
    password_hash: hashPasswordSync('taaluf123'),
    name: 'ولي أمر',
    role: 'parent',
  },
  {
    id: 'usr_specialist_guest',
    email: 'guest-specialist@taaluf.local',
    password_hash: hashPasswordSync('paid-access'),
    name: 'مختص (بعد الدفع)',
    role: 'specialist',
  },
] as const;

export const authOptions: NextAuthOptions = {
  // يساعد على Vercel عند اختلال بناء روابط الاستضافة
  ...( { trustHost: true } as Partial<NextAuthOptions> ),
  useSecureCookies: String(process.env.NEXTAUTH_URL || '').startsWith(
    'https://'
  ),
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

        if (demoUsersAllowed()) {
          const dev = DEMO_USERS.find((u) => u.email === email);
          if (dev) {
            const isValid = await verifyPrivilegedLogin(
              email,
              password,
              dev.password_hash
            );
            if (!isValid) return null;
            return {
              id: dev.id,
              email: dev.email,
              name: dev.name,
              role: dev.role,
            };
          }
        }

        if (isAirtableConfigured()) {
          try {
            const user = await findUserByEmail(email);
            if (user?.password_hash) {
              const isValid = await verifyPassword(
                password,
                user.password_hash
              );
              if (!isValid) return null;
              const role = String(user.role || 'specialist');
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
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role || 'specialist';
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || 'specialist';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'taaluf-dev-secret-change-me',
};
