const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
