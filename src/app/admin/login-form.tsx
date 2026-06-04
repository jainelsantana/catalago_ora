"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Shield, Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Map common errors or show direct message
        setError(result.error || "E-mail ou senha inválidos.");
      } else {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-xl overflow-hidden relative">
      {/* Decorative top bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 to-indigo-600" />
      
      <div className="p-8">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Área Administrativa</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Faça login com suas credenciais para gerenciar o catálogo
          </p>
        </div>

        {error && (
          <div className="p-3.5 mb-6 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@catalog.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={loading}
              />
              <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-muted-foreground" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Senha
              </label>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={loading}
              />
              <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-muted-foreground" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border/50 text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar para a loja pública
          </Link>
        </div>
      </div>
    </div>
  );
}
