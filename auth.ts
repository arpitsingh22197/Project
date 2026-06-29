import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";

import authConfig from "./auth.config";
import { db } from "./lib/db";
import { UserRole } from "@prisma/client";

console.log("ENV CHECK:", {
  hasSecret: !!process.env.AUTH_SECRET,
  hasGoogleId: !!process.env.AUTH_GOOGLE_ID,
  hasGoogleSecret: !!process.env.AUTH_GOOGLE_SECRET,
  hasGithubId: !!process.env.AUTH_GITHUB_ID,
  hasGithubSecret: !!process.env.AUTH_GITHUB_SECRET,
  hasDb: !!process.env.DATABASE_URL,
})

function CustomPrismaAdapter() {
  const adapter = PrismaAdapter(db);
  console.log("✅ Adapter created:", Object.keys(adapter));

  return {
    ...adapter,
    linkAccount: async (account: any) => {
      console.log("🔗 linkAccount called:", account);
      return db.account.create({
        data: {
          userId:            account.userId,
          type:              account.type,
          provider:          account.provider,
          providerAccountId: account.providerAccountId,
          accessToken:       account.access_token  ?? null,
          refreshToken:      account.refresh_token ?? null,
          idToken:           account.id_token      ?? null,
          expiresAt:         account.expires_at    ?? null,
          tokenType:         account.token_type    ?? null,
          scope:             account.scope         ?? null,
          sessionState:      account.session_state ?? null,
        },
      });
    },
  };
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: CustomPrismaAdapter() as Adapter,

  session: { strategy: "jwt" },

  events: {
    async signIn(message) { console.log("🟢 signIn event:", message) },
    async signOut(message) { console.log("🔴 signOut event:", message) },
    async createUser(message) { console.log("👤 createUser:", message) },
    async linkAccount(message) { console.log("🔗 linkAccount event:", message) },
    async session(message) { console.log("📦 session:", message) },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as unknown as UserRole;
      }
      return session;
    },
  },

  secret: process.env.AUTH_SECRET,

  ...authConfig,
});