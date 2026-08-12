import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureAuthUrl } from '@/lib/ensureAuthUrl';

ensureAuthUrl();

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
