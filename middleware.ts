import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Check if token is invalid (has error flag or missing id)
    const isTokenInvalid = !token || (token as any).error || !(token as any).id;

    // If token is invalid and trying to access protected routes, redirect to sign in
    if (isTokenInvalid) {
      if (pathname.startsWith("/dashboard")) {
        const response = NextResponse.redirect(new URL("/auth/signin", req.url));
        // Clear the session cookie
        response.cookies.delete("next-auth.session-token");
        response.cookies.delete("__Secure-next-auth.session-token");
        return response;
      }
      // For other routes, allow through (they'll handle auth themselves)
      return NextResponse.next();
    }

    // If the user is authenticated (and token is valid) and trying to access auth pages
    if (!isTokenInvalid && (
      pathname.startsWith("/auth") ||
      pathname === "/"
    )) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // Let the middleware function handle the auth logic
    },
  }
);

// Only run middleware on specific routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/:path*",
    "/"
  ],
}; 