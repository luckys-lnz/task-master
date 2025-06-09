import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If the user is not authenticated and trying to access protected routes
    if (!req.nextauth.token && req.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    // If the user is authenticated and trying to access auth pages
    if (req.nextauth.token && (
      req.nextUrl.pathname.startsWith("/auth") ||
      req.nextUrl.pathname === "/"
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