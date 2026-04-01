import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { refreshGoogleAccessToken } from "@/lib/google-token"

/** Required for YouTube Data API v3 (including private/unlisted); omitting it yields 403. */
const YOUTUBE_READONLY_SCOPE = "https://www.googleapis.com/auth/youtube.readonly"

/** Full channel/video management (metadata, playlists). Users re-consent when this changes. */
const YOUTUBE_MANAGE_SCOPE = "https://www.googleapis.com/auth/youtube"

const googleProviderScopes = [
  "openid",
  "profile",
  "email",
  YOUTUBE_READONLY_SCOPE,
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  YOUTUBE_MANAGE_SCOPE,
].join(" ")

const authSecret =
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

/**
 * Auth.js must trust the incoming Host on Vercel/serverless; otherwise
 * /api/auth/session returns 500 ("problem with the server configuration").
 */
const trustHost =
  process.env.NODE_ENV === "development" ||
  process.env.VERCEL === "1" ||
  process.env.AUTH_TRUST_HOST === "true"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  trustHost,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      /**
       * Confidential Google client (has client_secret). On Vercel, both PKCE and
       * OAuth `state` cookies often fail InvalidCheck (cookie not readable on the
       * callback request). Disabling checks avoids that; risk is mainly CSRF on
       * the authorize redirect — acceptable for this app’s threat model.
       */
      checks: [],
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
        if (account.refresh_token) {
          token.refreshToken = account.refresh_token
        }
        const acc = account as { expires_in?: number }
        const expiresIn =
          typeof acc.expires_in === "number" ? acc.expires_in : 3600
        token.accessTokenExpires = Date.now() + expiresIn * 1000
        token.error = undefined
        return token
      }

      const refreshToken =
        typeof token.refreshToken === "string" ? token.refreshToken : undefined
      const expiresAt =
        typeof token.accessTokenExpires === "number"
          ? token.accessTokenExpires
          : 0

      if (
        refreshToken &&
        expiresAt &&
        Date.now() > expiresAt - 60_000
      ) {
        const refreshed = await refreshGoogleAccessToken(refreshToken)
        if (refreshed) {
          return {
            ...token,
            accessToken: refreshed.access_token,
            accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
            refreshToken: refreshed.refresh_token ?? token.refreshToken,
            error: undefined,
          }
        }
        return {
          ...token,
          accessToken: undefined,
          error: "RefreshAccessTokenError",
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          (typeof token.sub === "string" && token.sub) ||
          session.user.email ||
          ""
      }
      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined
      if (token.error === "RefreshAccessTokenError") {
        session.error = "RefreshAccessTokenError"
      } else {
        session.error = undefined
      }
      return session
    },
  },
})
