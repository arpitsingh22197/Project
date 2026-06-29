import NextAuth from "next-auth";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  publicRoutes,
  authRoutes,
} from "@/routes";

import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const pathname = nextUrl.pathname;

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);

  // FIX: supports nested routes
  const isPublicRoute = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  const isAuthRoute = authRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  // Allow NextAuth API routes
  if (isApiAuthRoute) return;

  // Auth pages (sign-in/sign-up)
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(
        new URL(DEFAULT_LOGIN_REDIRECT, nextUrl)
      );
    }
    return;
  }

  // Protected routes
  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/auth/sign-in", nextUrl));
  }

  return;
});

export const config = {
  matcher: ["/(.*)"],
};