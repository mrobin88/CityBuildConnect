import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (!token?.role) return false;
      const path = req.nextUrl.pathname;
      if (path.startsWith("/worker")) return token.role === "WORKER";
      if (path.startsWith("/employer")) return token.role === "EMPLOYER";
      if (path.startsWith("/admin")) return token.role === "ADMIN";
      return true;
    },
  },
});

export const config = {
  matcher: ["/worker/:path*", "/employer/:path*", "/admin/:path*"],
};
