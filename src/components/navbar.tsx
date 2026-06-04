"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { Package, ShieldAlert, LogOut, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
          <Package className="h-6 w-6" />
          <span>Premium Catalog</span>
        </Link>

        <nav className="flex items-center gap-4">
          {session ? (
            <>
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors duration-200"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Painel</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1.5 text-sm font-medium hover:text-destructive transition-colors duration-200 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </>
          ) : (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors duration-200"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          )}

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
