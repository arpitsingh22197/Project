import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import authConfig from "./auth.config";
import { db } from "./lib/db";
import { UserRole } from "@prisma/client";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // Attach custom data to JWT
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },

    // Attach data to session
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