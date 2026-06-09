import { authOptions } from "@/lib/auth";
import { getErrorCode } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type CategoryPayload = {
  name?: string;
  slug?: string;
};

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar categorias." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = (await req.json()) as CategoryPayload;
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e Slug são obrigatórios." }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { name, slug },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (getErrorCode(error) === "P2002") {
      return NextResponse.json({ error: "Já existe uma categoria com este slug." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar categoria." }, { status: 500 });
  }
}
