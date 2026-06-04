"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useState, useEffect } from "react";
import { ImageUploader } from "./image-uploader";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Search,
  Eye,
  EyeOff,
  Sparkles
} from "lucide-react";

// Form validation schema
const productSchema = zod.object({
  name: zod.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  slug: zod.string().min(2, "Slug inválido.").regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hifens."),
  shortDescription: zod.string().min(5, "A descrição curta deve ter pelo menos 5 caracteres."),
  description: zod.string().min(10, "A descrição completa deve ter pelo menos 10 caracteres."),
  price: zod.preprocess(
    (val) => (val === "" || val === undefined ? undefined : parseFloat(val as string)),
    zod.number({ message: "Preço inválido." }).min(0.01, "O preço deve ser maior que zero.")
  ),
  stock: zod.preprocess(
    (val) => (val === "" || val === undefined ? 0 : parseInt(val as string, 10)),
    zod.number().min(0, "O estoque não pode ser negativo.")
  ),
  sku: zod.string().min(2, "O SKU deve ter pelo menos 2 caracteres."),
  status: zod.string().default("ACTIVE"),
  categoryId: zod.string().min(1, "Selecione uma categoria."),
  images: zod.array(zod.string()).min(1, "Envie pelo menos uma imagem do produto.")
});

type ProductFormValues = zod.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductImage {
  id: string;
  url: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  status: string; // ACTIVE / INACTIVE
  categoryId: string;
  category: Category;
  images: ProductImage[];
  createdAt: string;
}

export function ProductsClient() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    register: registerField, // Para registro manual de campos customizados
    formState: { errors, isSubmitting }
  } = useForm<ProductFormValues & { createdBy?: string }>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      shortDescription: "",
      description: "",
      price: 0,
      stock: 0,
      sku: "",
      status: "ACTIVE",
      categoryId: "",
      images: []
    }
  });

  // Simulação de dados de login (em um cenário real, viria de um useSession ou Context)
  const [userSession] = useState({
    name: "Administrador",
    email: "admin@exemplo.com",
    role: "ADMIN"
  });

  // Registra manualmente o campo de imagens para que o watch e a validação funcionem
  useEffect(() => {
    registerField("images");
  }, [registerField]);

  // Watch fields for automatic updates
  const watchedName = watch("name");
  const uploadedImages = watch("images") || [];

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Erro ao carregar categorias.");
      return res.json();
    }
  });

  // Fetch products
  const { data: productsData, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ["products", searchQuery],
    queryFn: async () => {
      const url = `/api/products?includeInactive=true&limit=100&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro ao carregar produtos.");
      return res.json();
    }
  });

  const products = productsData?.products || [];

  // Slugify helper
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameValue = e.target.value;
    setValue("name", nameValue);
    setValue("slug", slugify(nameValue), { shouldValidate: true });
  };

  const handleGenerateSku = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = watchedName ? watchedName.substring(0, 3).toUpperCase() : "PROD";
    setValue("sku", `${prefix}-${randomSuffix}`, { shouldValidate: true });
  };

  // Open creation modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    reset({
      name: "",
      slug: "",
      shortDescription: "",
      description: "",
      price: 0,
      stock: 0,
      sku: "",
      status: "ACTIVE",
      categoryId: categories[0]?.id || "",
      images: []
    });
    setErrorMessage("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      price: product.price,
      stock: product.stock,
      sku: product.sku,
      status: product.status,
      categoryId: product.categoryId,
      images: product.images.map((img) => img.url)
    });
    setErrorMessage("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = { ...values, createdBy: userSession.email };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar produto.");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSuccessMessage("Produto cadastrado com sucesso!");
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
    mutationFn: async ({ id, values }: { id: string; values: ProductFormValues }) => {
      const payload = { ...values, updatedBy: userSession.email };
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar produto.");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSuccessMessage("Produto atualizado com sucesso!");
      setTimeout(() => {
        setModalOpen(false);
        setEditingProduct(null);
        reset();
      }, 1500);
    },
    onError: (err: any) => {
      setErrorMessage(err.message);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status, product }: { id: string; status: string; product: Product }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription,
          description: product.description,
          price: product.price,
          stock: product.stock,
          sku: product.sku,
          status: status,
          categoryId: product.categoryId,
          images: product.images.map((img) => img.url)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao alterar status.");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir produto.");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSuccessMessage("Produto excluído com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const onSubmit = (values: ProductFormValues) => {
    setErrorMessage("");
    setSuccessMessage("");
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza de que deseja excluir o produto "${name}"? Esta ação realiza exclusão lógica (Soft Delete) e pode ser revertida administrativamente se necessário.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (product: Product) => {
    const nextStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    toggleStatusMutation.mutate({ id: product.id, status: nextStatus, product });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Produtos</h1>
            <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
              Painel de {userSession.name}
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <p>Crie e gerencie seus produtos no catálogo.</p>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="text-xs italic opacity-70">Logado como: {userSession.email}</span>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm font-semibold shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Search & Alerts */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Pesquisar por nome, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
        
        {successMessage && !modalOpen && (
          <div className="p-2 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium animate-pulse">
            {successMessage}
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm">Carregando produtos...</span>
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-semibold uppercase tracking-wider bg-muted/20">
                  <th className="px-6 py-4 font-semibold">Produto</th>
                  <th className="px-6 py-4 font-semibold">Categoria</th>
                  <th className="px-6 py-4 font-semibold">Preço</th>
                  <th className="px-6 py-4 font-semibold">Estoque</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-muted/20 transition-colors">
                    {/* Name, SKU and Thumbnail */}
                    <td className="px-6 py-4 font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                          {prod.images[0]?.url ? (
                            <img
                              src={prod.images[0].url}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-foreground line-clamp-1">{prod.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">SKU: {prod.sku}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-muted-foreground">{prod.category.name}</td>
                    
                    <td className="px-6 py-4 font-bold text-foreground">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      }).format(prod.price)}
                    </td>

                    <td className="px-6 py-4 text-muted-foreground">{prod.stock} un.</td>

                    {/* Status Toggler */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(prod)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border cursor-pointer transition-all ${
                          prod.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                        }`}
                      >
                        {prod.status === "ACTIVE" ? (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            <span>Inativo</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* CRUD Actions */}
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="inline-flex items-center justify-center p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id, prod.name)}
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
            <Package className="h-12 w-12 text-muted-foreground stroke-[1.5] mb-3" />
            <h3 className="font-bold text-lg mb-1">Nenhum produto cadastrado</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Cadastre seu primeiro produto para que ele apareça na vitrine do seu catálogo.
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-2xl rounded-xl shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200">
            {/* Top decorative stripe */}
            <div className="h-1.5 w-full bg-primary" />
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {errorMessage && (
                <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium">
                  {successMessage}
                </div>
              )}

              {/* Row 1: Name, Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Nome do Produto
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Notebook Gamer Nitro 5"
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
                    Slug (URL Amigável)
                  </label>
                  <input
                    type="text"
                    placeholder="notebook-gamer-nitro-5"
                    {...register("slug")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    disabled={isSubmitting}
                  />
                  {errors.slug && (
                    <p className="text-xs text-destructive mt-1">{errors.slug.message}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Category, Price, Stock, SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Category Dropdown */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Categoria
                  </label>
                  <select
                    {...register("categoryId")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    disabled={isSubmitting}
                  >
                    <option value="">Selecione...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-xs text-destructive mt-1">{errors.categoryId.message}</p>
                  )}
                </div>

                {/* SKU Generator */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    SKU / Identificador
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: NOT-8492"
                      {...register("sku")}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      className="px-3 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-muted text-foreground transition-all cursor-pointer flex items-center gap-1.5"
                      title="Gerar SKU automático"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>Gerar</span>
                    </button>
                  </div>
                  {errors.sku && (
                    <p className="text-xs text-destructive mt-1">{errors.sku.message}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Price, Stock, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2999.90"
                    {...register("price")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    disabled={isSubmitting}
                  />
                  {errors.price && (
                    <p className="text-xs text-destructive mt-1">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Estoque
                  </label>
                  <input
                    type="number"
                    placeholder="10"
                    {...register("stock")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    disabled={isSubmitting}
                  />
                  {errors.stock && (
                    <p className="text-xs text-destructive mt-1">{errors.stock.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Status
                  </label>
                  <select
                    {...register("status")}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    disabled={isSubmitting}
                  >
                    <option value="ACTIVE">Exibir no catálogo (Ativo)</option>
                    <option value="INACTIVE">Esconder do catálogo (Inativo)</option>
                  </select>
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Descrição Curta (Vitrine)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Notebook gamer potente com placa dedicada RTX 3050 e processador Intel Core i5."
                  {...register("shortDescription")}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled={isSubmitting}
                />
                {errors.shortDescription && (
                  <p className="text-xs text-destructive mt-1">{errors.shortDescription.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Descrição Completa (Detalhes do Produto)
                </label>
                <textarea
                  placeholder="Escreva todos os detalhes técnicos do produto, especificações, dimensões, garantias..."
                  rows={4}
                  {...register("description")}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled={isSubmitting}
                />
                {errors.description && (
                  <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Imagens do Produto
                </label>
                <ImageUploader
                  value={uploadedImages}
                  onChange={(urls) => setValue("images", urls, { shouldValidate: true, shouldDirty: true })}
                />
                {errors.images && (
                  <p className="text-xs text-destructive mt-1">{errors.images.message as string}</p>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/50">
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
                    <span>Salvar Produto</span>
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
