"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  FolderTree,
  Package,
  LogOut,
  Store,
  Menu,
  X,
  PackageSearch
} from "lucide-react";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      name: "Visão Geral",
      href: "/admin/dashboard",
      icon: LayoutDashboard
    },
    {
      name: "Produtos",
      href: "/admin/dashboard/produtos",
      icon: Package
    },
    {
      name: "Categorias",
      href: "/admin/dashboard/categorias",
      icon: FolderTree
    }
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/admin" });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        {/* Header */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
          <PackageSearch className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">Painel Admin</span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4.5 w-4.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
          
          <Link
            href="/"
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <Store className="h-4.5 w-4.5" />
            <span>Ir para a Loja</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <PackageSearch className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">Painel Admin</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md hover:bg-muted"
            aria-label="Alternar menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border flex flex-col">
            <nav className="flex-1 px-6 py-6 space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-6 border-t border-border bg-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">Tema</span>
                <ThemeToggle />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
                >
                  <Store className="h-4 w-4" />
                  <span>Ver Loja</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 py-2.5 bg-destructive/10 rounded-lg text-sm font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
