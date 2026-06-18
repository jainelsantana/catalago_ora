/* eslint-disable @typescript-eslint/no-require-imports */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const importedProductsPath = path.join(__dirname, "products.ora.json");

const bannerSettingsId = "homepage-banner";
const defaultBannerSettings = {
  bannerEyebrow: "Novidades Exclusivas",
  bannerTitle: "Explore Nossos Melhores Produtos",
  bannerDescription:
    "Encontre uma seleção especial de eletrônicos, vestuário, móveis e acessórios de alta performance. Qualidade garantida com atendimento premium.",
};

function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || "admin@catalog.com").trim().toLowerCase();
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

function loadImportedProducts() {
  if (!fs.existsSync(importedProductsPath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(importedProductsPath, "utf8").replace(/^\uFEFF/, ""));
}

async function seedImportedProducts() {
  const products = loadImportedProducts();

  if (products.length === 0) {
    console.log("No imported ORA products found.");
    return;
  }

  let seededProducts = 0;

  for (const product of products) {
    const price = Number(product.price);
    const stock = Number(product.stock ?? 1);

    if (
      !product.name ||
      !product.slug ||
      !product.shortDescription ||
      !product.description ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !product.sku ||
      !product.categoryName ||
      !product.categorySlug
    ) {
      console.warn(`Skipping invalid imported product: ${product.name || product.sku || "unknown"}`);
      continue;
    }

    const category = await prisma.category.upsert({
      where: { slug: product.categorySlug },
      update: { name: product.categoryName },
      create: {
        name: product.categoryName,
        slug: product.categorySlug,
      },
    });

    const productData = {
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      price,
      stock: Number.isFinite(stock) && stock >= 0 ? Math.trunc(stock) : 1,
      sku: product.sku,
      status: product.status || "ACTIVE",
      categoryId: category.id,
    };

    const images = Array.isArray(product.images)
      ? product.images.filter((url) => typeof url === "string" && url.trim())
      : [];

    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        ...productData,
        ...(images.length > 0
          ? {
              images: {
                create: images.map((url) => ({ url })),
              },
            }
          : {}),
      },
    });

    seededProducts += 1;
  }

  console.log(`ORA products seeded successfully: ${seededProducts}.`);
}

async function main() {
  const adminEmail = getAdminEmail();
  const adminPassword = getAdminPassword();

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administrador",
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log("Admin user seeded successfully!");
  } else {
    const updateData = {};

    if (existingAdmin.role !== "ADMIN") {
      updateData.role = "ADMIN";
    }

    if (!existingAdmin.name) {
      updateData.name = "Administrador";
    }

    if (process.env.ADMIN_PASSWORD) {
      updateData.password = await bcrypt.hash(adminPassword, 10);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { email: adminEmail },
        data: updateData,
      });
      console.log("Admin user synchronized successfully!");
    } else {
      console.log("Admin user already exists.");
    }
  }

  const categories = [
    { name: "Eletrônicos", slug: "eletronicos" },
    { name: "Móveis", slug: "moveis" },
    { name: "Vestuário", slug: "vestuario" },
    { name: "Esportes", slug: "esportes" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log("Default categories seeded successfully!");

  await prisma.siteSettings.upsert({
    where: { id: bannerSettingsId },
    update: {},
    create: {
      id: bannerSettingsId,
      ...defaultBannerSettings,
    },
  });
  console.log("Default banner settings seeded successfully!");

  await seedImportedProducts();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
