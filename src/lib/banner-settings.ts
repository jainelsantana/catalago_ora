import { DEFAULT_BANNER_CONTENT, BANNER_SETTINGS_ID, type BannerContent } from "@/lib/banner-content";
import { prisma } from "@/lib/prisma";

async function ensureSiteSettingsTable() {
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
}

export async function getBannerContent(): Promise<BannerContent> {
  try {
    await ensureSiteSettingsTable();

    const settings = await prisma.$queryRaw<BannerContent[]>`
      SELECT "bannerEyebrow", "bannerTitle", "bannerDescription"
      FROM "SiteSettings"
      WHERE "id" = ${BANNER_SETTINGS_ID}
      LIMIT 1
    `;

    return settings[0] ?? DEFAULT_BANNER_CONTENT;
  } catch (error) {
    console.error("Error loading banner settings:", error);
    return DEFAULT_BANNER_CONTENT;
  }
}

export async function saveBannerContent(content: BannerContent): Promise<BannerContent> {
  await ensureSiteSettingsTable();

  const settings = await prisma.$queryRaw<BannerContent[]>`
    INSERT INTO "SiteSettings" (
      "id",
      "bannerEyebrow",
      "bannerTitle",
      "bannerDescription",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${BANNER_SETTINGS_ID},
      ${content.bannerEyebrow},
      ${content.bannerTitle},
      ${content.bannerDescription},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("id") DO UPDATE SET
      "bannerEyebrow" = EXCLUDED."bannerEyebrow",
      "bannerTitle" = EXCLUDED."bannerTitle",
      "bannerDescription" = EXCLUDED."bannerDescription",
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "bannerEyebrow", "bannerTitle", "bannerDescription"
  `;

  return settings[0] ?? content;
}
