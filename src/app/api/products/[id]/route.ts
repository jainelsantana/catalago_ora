import { authOptions } from "@/lib/auth";
import { getErrorCode } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type ProductPayload = {
  name?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  price?: string | number;
  stock?: string | number;
  sku?: string;
  status?: string;
  categoryId?: string;
  images?: string[];
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if the parameter is a UUID or a slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const product = await prisma.product.findFirst({
      where: isUuid
        ? { id, deletedAt: null }
        : { slug: id, deletedAt: null },
      include: {
        category: true,
        images: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar produto." }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id } = await params;
    const body = (await req.json()) as ProductPayload;
    const {
      name,
      slug,
      shortDescription,
      description,
      price,
      stock,
      sku,
      status,
      categoryId,
      images, // array of image urls
    } = body;

    // Validate fields
    if (!name || !slug || !shortDescription || !description || price === undefined || !sku || !categoryId) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    // Update product inside a transaction to ensure atomic updates (especially image replacement)
    const product = await prisma.$transaction(async (tx) => {
      // Delete existing images first
      await tx.productImage.deleteMany({
        where: { productId: id },
      });

      // Update product details and create new images
      return tx.product.update({
        where: { id },
        data: {
          name,
          slug,
          shortDescription,
          description,
          price: parseFloat(String(price)),
          stock: parseInt(String(stock ?? "0"), 10),
          sku,
          status: status || "ACTIVE",
          categoryId,
          images: {
            create: (images ?? []).map((url) => ({ url })),
          },
        },
        include: {
          images: true,
          category: true,
        },
      });
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "UPDATE_PRODUCT",
        details: JSON.stringify({ productId: product.id, name: product.name, sku: product.sku }),
        userId: session.user.id,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    if (getErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }
    if (getErrorCode(error) === "P2002") {
      return NextResponse.json({ error: "Já existe um produto com este slug ou SKU." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar produto." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id } = await params;

    // Perform Soft Delete
    const product = await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "DELETE_PRODUCT",
        details: JSON.stringify({ productId: product.id, name: product.name, sku: product.sku }),
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: "Produto excluído com sucesso." });
  } catch (error) {
    if (getErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao excluir produto." }, { status: 500 });
  }
}
