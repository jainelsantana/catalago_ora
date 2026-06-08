import { withAuth } from "next-auth/middleware";
import { NextResponse, type NextRequest } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

async function customMiddleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  const response = NextResponse.next();
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value as string);
  });
  return response;
}

export default withAuth(customMiddleware, {
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
    "/admin/produtos/:path*",
    "/admin/categorias/:path*",
    "/api/:path*",
    "/uploads/:path*",
  ],
};
