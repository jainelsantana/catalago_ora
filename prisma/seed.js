/* eslint-disable @typescript-eslint/no-require-imports */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const bannerSettingsId = "homepage-banner";
const defaultBannerSettings = {
  bannerEyebrow: "Novidades Exclusivas",
  bannerTitle: "Explore Nossos Melhores Produtos",
  bannerDescription:
    "Encontre uma seleção especial de eletrônicos, vestuário, móveis e acessórios de alta performance. Qualidade garantida com atendimento premium.",
};

async function main() {
  const adminEmail = "admin@catalog.com";
  
  // Check if admin user exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administrador",
        password: hashedPassword,
        role: "ADMIN"
      }
    });
    console.log("Admin user seeded successfully!");
  } else {
    console.log("Admin user already exists.");
  }

  // Seed default categories
  const categories = [
    { name: "Eletrônicos", slug: "eletronicos" },
    { name: "Móveis", slug: "moveis" },
    { name: "Vestuário", slug: "vestuario" },
    { name: "Esportes", slug: "esportes" }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat
    });
  }
  console.log("Default categories seeded successfully!");

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "SiteSettings" (
      "id" TEXT NOT NULL,
      "bannerEyebrow" TEXT NOT NULL DEFAULT 'Novidades Exclusivas',
      "bannerTitle" TEXT NOT NULL DEFAULT 'Explore Nossos Melhores Produtos',
      "bannerDescription" TEXT NOT NULL DEFAULT 'Encontre uma seleção especial de eletrônicos, vestuário, móveis e acessórios de alta performance. Qualidade garantida com atendimento premium.',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO "SiteSettings" (
      "id",
      "bannerEyebrow",
      "bannerTitle",
      "bannerDescription",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${bannerSettingsId},
      ${defaultBannerSettings.bannerEyebrow},
      ${defaultBannerSettings.bannerTitle},
      ${defaultBannerSettings.bannerDescription},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("id") DO NOTHING
  `;
  console.log("Default banner settings seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
