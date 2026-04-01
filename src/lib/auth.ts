import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

/** Required for YouTube Data API v3 (including private/unlisted); omitting it yields 403. */
const YOUTUBE_READONLY_SCOPE = "https://www.googleapis.com/auth/youtube.readonly"

const googleProviderScopes = [
  "openid",
  "profile",
  "email",
  YOUTUBE_READONLY_SCOPE,
  "https://www.googleapis.com/auth/yt-analytics.readonly",
].join(" ")

const authSecret =
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  trustHost: process.env.NODE_ENV === "development",
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: googleProviderScopes,
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined
      return session
    },
  },
})
