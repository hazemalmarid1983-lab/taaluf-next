import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { homePathForRole } from '@/lib/access';
import { findUserByEmail, isAirtableConfigured } from '@/lib/airtable';
import { logAction } from '@/lib/auditLog';
import { hashPasswordSync, verifyPassword } from '@/lib/password';

// TODO: migrate existing users to bcrypt hashes on next login
// حسابات تجريبية — محلياً دائماً؛ وفي الإنتاج أثناء الطيّار أو عند غياب Tap
const allowDemoUsers =
  process.env.NODE_ENV !== 'production' ||
  process.env.ALLOW_DEMO_USERS === 'true' ||
  process.env.TAALUF_PILOT_MODE === 'true' ||
  process.env.NEXT_PUBLIC_PAYMENTS_DISABLED === 'true' ||
  !String(process.env.TAP_SECRET_KEY || '').trim();

const DEV_USERS = allowDemoUsers
  ? [
      {
        id: 'usr_admin',
        email: 'admin@taaluf.local',
        password_hash: hashPasswordSync('taaluf123'),
        name: 'إدارة تآلف',
        role: 'admin',
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
    ]
  : ([] as Array<{
      id: string;
      email: string;
      password_hash: string;
      name: string;
      role: string;
    }>);

export { homePathForRole };

export const authOptions: NextAuthOptions = {
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
        const portal = (credentials?.portal || '').trim();
        if (!email || !password) return null;

        const dev = DEV_USERS.find((u) => u.email === email);
        if (dev) {
          const isValid = await verifyPassword(password, dev.password_hash);
          if (!isValid) return null;
          if (portal === 'admin' && dev.role !== 'admin') return null;
          if (
            portal === 'specialist' &&
            !['specialist', 'teacher', 'admin'].includes(dev.role)
          )
            return null;
          if (portal === 'parent' && !['parent', 'admin'].includes(dev.role))
            return null;
          return {
            id: dev.id,
            email: dev.email,
            name: dev.name,
            role: dev.role,
          };
        }

        if (isAirtableConfigured()) {
          try {
            const user = await findUserByEmail(email);
            if (user?.password_hash) {
              const isValid = await verifyPassword(password, user.password_hash);
              if (!isValid) return null;
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
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
