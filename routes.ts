/**
 * Public routes (no authentication required)
 */
export const publicRoutes: string[] = [
  "/",
  "/about",
  "/pricing",
  "/docs",
];

/**
 * Protected routes (authentication required)
 */
export const protectedRoutes: string[] = [
  "/dashboard",
  "/playground",
  "/settings",
];

/**
 * Auth routes (redirect if already logged in)
 */
export const authRoutes: string[] = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/error",
  "/auth/forgot-password",
];

/**
 * API auth prefix (NextAuth / custom auth APIs)
 */
export const apiAuthPrefix: string = "/api/auth";

/**
 * Default redirect after login
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";