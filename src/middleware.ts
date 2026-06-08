import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => token?.role === "ADMIN",
  },
  pages: {
    // Redireciona para a página de login se o usuário não estiver autorizado
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    // Protege todas as rotas dentro de /admin, exceto a própria página de login
    "/admin/:path*",
  ],
};
