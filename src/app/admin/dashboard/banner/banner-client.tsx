"use client";

import { DEFAULT_BANNER_CONTENT } from "@/lib/banner-content";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as zod from "zod";

const bannerSchema = zod.object({
  bannerEyebrow: zod.string().trim().min(2, "O selo deve ter pelo menos 2 caracteres.").max(60, "O selo deve ter no máximo 60 caracteres."),
  bannerTitle: zod.string().trim().min(5, "O título deve ter pelo menos 5 caracteres.").max(90, "O título deve ter no máximo 90 caracteres."),
  bannerDescription: zod.string().trim().min(10, "A descrição deve ter pelo menos 10 caracteres.").max(220, "A descrição deve ter no máximo 220 caracteres."),
});

type BannerFormValues = zod.infer<typeof bannerSchema>;

export function BannerClient() {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: DEFAULT_BANNER_CONTENT,
  });

  const { data: bannerSettings, isLoading } = useQuery<BannerFormValues>({
    queryKey: ["banner-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings/banner");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar o banner.");
      return data;
    },
  });

  useEffect(() => {
    if (bannerSettings) {
      reset(bannerSettings);
    }
  }, [bannerSettings, reset]);

  const updateMutation = useMutation({
    mutationFn: async (values: BannerFormValues) => {
      const res = await fetch("/api/settings/banner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar o banner.");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["banner-settings"] });
      reset(data);
      setErrorMessage("");
      setSuccessMessage("Banner atualizado com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err) => {
      setSuccessMessage("");
      setErrorMessage(err instanceof Error ? err.message : "Erro ao salvar o banner.");
    },
  });

  const previewValues = useWatch({ control });
  const preview = {
    bannerEyebrow: previewValues.bannerEyebrow || DEFAULT_BANNER_CONTENT.bannerEyebrow,
    bannerTitle: previewValues.bannerTitle || DEFAULT_BANNER_CONTENT.bannerTitle,
    bannerDescription: previewValues.bannerDescription || DEFAULT_BANNER_CONTENT.bannerDescription,
  };

  const handleRestoreDefaults = () => {
    reset(DEFAULT_BANNER_CONTENT);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const onSubmit = (values: BannerFormValues) => {
    setErrorMessage("");
    setSuccessMessage("");
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm">Carregando banner...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Banner Inicial</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Edite o texto principal exibido no topo da vitrine.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRestoreDefaults}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors cursor-pointer self-start sm:self-auto"
          disabled={updateMutation.isPending}
        >
          <RotateCcw className="h-4.5 w-4.5" />
          <span>Restaurar padrão</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="xl:col-span-2 bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 space-y-5"
        >
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Selo Pequeno
            </label>
            <input
              type="text"
              placeholder="Ex: Novidades Exclusivas"
              {...register("bannerEyebrow")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={updateMutation.isPending}
            />
            {errors.bannerEyebrow && (
              <p className="text-xs text-destructive mt-1">{errors.bannerEyebrow.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Título Principal
            </label>
            <input
              type="text"
              placeholder="Ex: Explore Nossos Melhores Produtos"
              {...register("bannerTitle")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={updateMutation.isPending}
            />
            {errors.bannerTitle && (
              <p className="text-xs text-destructive mt-1">{errors.bannerTitle.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Descrição
            </label>
            <textarea
              rows={5}
              placeholder="Escreva a frase de apoio do banner..."
              {...register("bannerDescription")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              disabled={updateMutation.isPending}
            />
            {errors.bannerDescription && (
              <p className="text-xs text-destructive mt-1">{errors.bannerDescription.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-border/50">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-70"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Salvar Banner</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="xl:col-span-3 bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-4.5 w-4.5 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Prévia</h2>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 py-12 px-6 sm:px-10 shadow-xl">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-52 w-52 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative z-10 max-w-2xl text-white">
              <span className="inline-block px-3 py-1 text-[11px] font-semibold uppercase tracking-wider bg-white/20 rounded-full mb-4">
                {preview.bannerEyebrow}
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                {preview.bannerTitle}
              </h3>
              <p className="text-base sm:text-lg text-indigo-100 font-light leading-relaxed">
                {preview.bannerDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
