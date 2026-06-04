import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const search = searchParams.get("search") || "";
    const categorySlug = searchParams.get("category") || "";
    const includeInactive = searchParams.get("includeInactive") === "true";

    const skip = (page - 1) * limit;

    // Build Prisma query condition
    const where: any = {
      deletedAt: null, // Always exclude soft-deleted items
    };

    if (!includeInactive) {
      where.status = "ACTIVE";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categorySlug) {
      where.category = {
        slug: categorySlug,
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar produtos." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
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

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        shortDescription,
        description,
        price: parseFloat(price),
        stock: parseInt(stock || "0", 10),
        sku,
        status: status || "ACTIVE",
        categoryId,
        images: {
          create: (images || []).map((url: string) => ({ url })),
        },
      },
      include: {
        images: true,
        category: true,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "CREATE_PRODUCT",
        details: JSON.stringify({ productId: product.id, name: product.name, sku: product.sku }),
        userId: (session.user as any).id,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Já existe um produto com este slug ou SKU." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar produto." }, { status: 500 });
  }
}
