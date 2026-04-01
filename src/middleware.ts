import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const path = req.nextUrl.pathname
  const isDashboard = path.startsWith("/dashboard")
  const isLogin = path === "/login"

  if (isDashboard && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl.origin))
  }
  if (isLogin && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
