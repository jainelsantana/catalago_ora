import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => token?.role === "ADMIN",
  },
  pages: {
    signIn: "/admin",
  },
});

export const config = {
  matcher: [
    "/admin/dashboard/:path*",
  ],
};
