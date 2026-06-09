import { prisma } from "@/lib/prisma";
import { Package, FolderTree, FileSpreadsheet, PlusCircle, ArrowUpRight, Activity } from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Disable server caching for admin pages

export default async function DashboardPage() {
  // Fetch metrics in parallel
  const [
    totalProducts,
    totalCategories,
    recentProducts,
    recentLogs
  ] = await Promise.all([
    prisma.product.count({
      where: { deletedAt: null }
    }),
    prisma.category.count(),
    prisma.product.findMany({
      where: { deletedAt: null },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Métricas de desempenho e atividade recente do seu catálogo.
          </p>
        </div>
        <Link
          href="/admin/dashboard/produtos"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm font-semibold shadow-md transition-all cursor-pointer"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          <span>Novo Produto</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Metric: Total Products */}
        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Total de Produtos</span>
            <h3 className="text-3xl font-bold tracking-tight">{totalProducts}</h3>
            <Link
              href="/admin/dashboard/produtos"
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 mt-2"
            >
              <span>Gerenciar</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-200">
            <Package className="h-6 w-6" />
          </div>
        </div>

        {/* Metric: Total Categories */}
        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Total de Categorias</span>
            <h3 className="text-3xl font-bold tracking-tight">{totalCategories}</h3>
            <Link
              href="/admin/dashboard/categorias"
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 mt-2"
            >
              <span>Gerenciar</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-200">
            <FolderTree className="h-6 w-6" />
          </div>
        </div>

        {/* Metric: Total Audit Logs */}
        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden group sm:col-span-2 lg:col-span-1">
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Operações Auditadas</span>
            <h3 className="text-3xl font-bold tracking-tight">Ativo</h3>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-2">
              <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span>Monitoramento em tempo real</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform duration-200">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Grid: Recent Products & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Products List */}
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span>Produtos Adicionados Recentemente</span>
          </h2>
          {recentProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Produto</th>
                    <th className="pb-3 font-semibold">Categoria</th>
                    <th className="pb-3 font-semibold">Preço</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 pr-3 font-medium">
                        <div className="font-semibold">{prod.name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {prod.sku}</div>
                      </td>
                      <td className="py-3.5 pr-3 text-muted-foreground">{prod.category.name}</td>
                      <td className="py-3.5 pr-3 font-semibold">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        }).format(prod.price)}
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            prod.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          }`}
                        >
                          {prod.status === "ACTIVE" ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhum produto cadastrado ainda.
            </div>
          )}
        </div>

        {/* Audit Logs List */}
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>Logs de Auditoria</span>
          </h2>
          {recentLogs.length > 0 ? (
            <div className="relative border-l border-border pl-4 space-y-6">
              {recentLogs.map((log) => {
                let actionText = log.action;
                
                if (log.action === "CREATE_PRODUCT") {
                  actionText = "Criou Produto";
                } else if (log.action === "UPDATE_PRODUCT") {
                  actionText = "Atualizou Produto";
                } else if (log.action === "DELETE_PRODUCT") {
                  actionText = "Excluiu Produto";
                }

                const details = JSON.parse(log.details);

                return (
                  <div key={log.id} className="relative">
                    {/* Circle bullet */}
                    <div className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-background ${
                      log.action === "CREATE_PRODUCT" ? "bg-emerald-500" : log.action === "UPDATE_PRODUCT" ? "bg-blue-500" : "bg-rose-500"
                    }`} />
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                          {actionText}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(log.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {details.name || "ID: " + details.productId}
                      </p>
                      <p className="text-[10px] text-muted-foreground italic">
                        {new Date(log.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhuma atividade registrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
