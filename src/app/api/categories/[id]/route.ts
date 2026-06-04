import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e Slug são obrigatórios." }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Já existe uma categoria com este slug." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar categoria." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id } = await params;

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Categoria excluída com sucesso." });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao excluir categoria. Certifique-se de que não há produtos vinculados a ela." }, { status: 500 });
  }
}
