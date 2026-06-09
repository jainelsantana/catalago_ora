import { authOptions } from "@/lib/auth";
import { getBannerContent, saveBannerContent } from "@/lib/banner-settings";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import * as zod from "zod";

const bannerSettingsSchema = zod.object({
  bannerEyebrow: zod.string().trim().min(2, "O selo deve ter pelo menos 2 caracteres.").max(60, "O selo deve ter no máximo 60 caracteres."),
  bannerTitle: zod.string().trim().min(5, "O título deve ter pelo menos 5 caracteres.").max(90, "O título deve ter no máximo 90 caracteres."),
  bannerDescription: zod.string().trim().min(10, "A descrição deve ter pelo menos 10 caracteres.").max(220, "A descrição deve ter no máximo 220 caracteres."),
});

export async function GET() {
  const settings = await getBannerContent();
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bannerSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Campos inválidos." },
        { status: 400 }
      );
    }

    const settings = await saveBannerContent(parsed.data);

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_BANNER",
        details: JSON.stringify({ bannerTitle: settings.bannerTitle }),
        userId: session.user.id,
      },
    });

    revalidatePath("/");

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating banner settings:", error);

    return NextResponse.json({ error: "Erro ao atualizar o banner." }, { status: 500 });
  }
}
