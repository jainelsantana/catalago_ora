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

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
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
    console.log("Admin user already exists.");
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
