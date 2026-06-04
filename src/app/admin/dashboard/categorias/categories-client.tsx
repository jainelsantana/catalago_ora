"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useState } from "react";
import { FolderTree, Plus, Edit2, Trash2, Loader2, X } from "lucide-react";

// Form validation schema
const categorySchema = zod.object({
  name: zod.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  slug: zod.string().min(2, "O slug deve ter pelo menos 2 caracteres.").regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hifens.")
});

type CategoryFormValues = zod.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function CategoriesClient() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "" }
  });

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Erro ao carregar categorias.");
      return res.json();
    }
  });

  // Slugify helper
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize("NFD") // normalize accents
      .replace(/[\u0300-\u036f]/g, "") // remove accent marks
      .replace(/\s+/g, "-") // replace spaces with -
      .replace(/[^\w-]+/g, "") // remove all non-word chars
      .replace(/--+/g, "-") // replace multiple - with single -
      .replace(/^-+/, "") // trim - from start
      .replace(/-+$/, ""); // trim - from end
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameValue = e.target.value;
    setValue("name", nameValue);
    // Auto-generate slug only if not editing (or custom logic)
    setValue("slug", slugify(nameValue), { shouldValidate: true });
  };

  // Open modal for creating
  const handleOpenCreate = () => {
    setEditingCategory(null);
    reset({ name: "", slug: "" });
    setErrorMessage("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    reset({ name: category.name, slug: category.slug });
    setErrorMessage("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar categoria.");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setSuccessMessage("Categoria criada com sucesso!");
      setTimeout(() => {
        setModalOpen(false);
        reset();
      }, 1500);
    },
    onError: (err: any) => {
      setErrorMessage(err.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: CategoryFormValues }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar categoria.");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setSuccessMessage("Categoria atualizada com sucesso!");
      setTimeout(() => {
        setModalOpen(false);
        setEditingCategory(null);
        reset();
      }, 1500);
    },
    onError: (err: any) => {
      setErrorMessage(err.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir categoria.");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setSuccessMessage("Categoria excluída com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const onSubmit = (values: CategoryFormValues) => {
    setErrorMessage("");
    setSuccessMessage("");
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza de que deseja excluir a categoria "${name}"? Os produtos vinculados a ela poderão ser impactados.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie as categorias utilizadas para organizar seus produtos.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm font-semibold shadow-md transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Messages */}
      {successMessage && !modalOpen && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium">
          {successMessage}
        </div>
      )}

      {/* Main Categories Table Card */}
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm">Carregando categorias...</span>
          </div>
        ) : categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase tracking-wider bg-muted/20">
                  <th className="px-6 py-4 font-semibold">Nome</th>
                  <th className="px-6 py-4 font-semibold">Slug (URL amigável)</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">{cat.name}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{cat.slug}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="inline-flex items-center justify-center p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="inline-flex items-center justify-center p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center p-6">
            <FolderTree className="h-12 w-12 text-muted-foreground stroke-[1.5] mb-3" />
            <h3 className="font-bold text-lg mb-1">Nenhuma categoria cadastrada</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Cadastre sua primeira categoria para começar a organizar o seu catálogo de produtos.
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Top decorative stripe */}
            <div className="h-1 w-full bg-primary" />
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
                  {successMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  placeholder="Ex: Eletrônicos, Moda..."
                  {...register("name")}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Slug (Preenchido Automático)
                </label>
                <input
                  type="text"
                  placeholder="ex-slug-categoria"
                  {...register("slug")}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled={isSubmitting}
                />
                {errors.slug && (
                  <p className="text-xs text-destructive mt-1">{errors.slug.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
