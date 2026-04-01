import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    /** Set when Google token refresh fails; client should prompt re-sign-in. */
    error?: "RefreshAccessTokenError"
    user: DefaultSession["user"] & { id: string }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    error?: "RefreshAccessTokenError"
  }
}
