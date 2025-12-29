import 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    userId: string;
    stravaId: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    stravaId?: number;
    userId?: string;
  }
}
