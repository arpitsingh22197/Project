import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { NextAuthConfig } from "next-auth"

export default {
    trustHost: true,
    providers: [
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
    ]
} satisfies NextAuthConfig