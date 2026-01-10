import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    const isAuth = !!token;
    const isAuthPage = pathname.startsWith("/auth");

    // Redirect authenticated users away from login pages
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Routes requiring authentication
        const protectedRoutes = ["/dashboard"];

        const isProtected = protectedRoutes.some((route) =>
          pathname.startsWith(route)
        );

        if (isProtected) return !!token;

        return true; // allow public pages
      },
    },
  }
);

// Middleware matchers
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/:path*", // login pages
  ],
};
