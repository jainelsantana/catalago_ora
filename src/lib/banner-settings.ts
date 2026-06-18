import { DEFAULT_BANNER_CONTENT, BANNER_SETTINGS_ID, type BannerContent } from "@/lib/banner-content";
import { prisma } from "@/lib/prisma";

const bannerSettingsSelect = {
  bannerEyebrow: true,
  bannerTitle: true,
  bannerDescription: true,
} as const;

export async function getBannerContent(): Promise<BannerContent> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: BANNER_SETTINGS_ID },
      select: bannerSettingsSelect,
    });

    return settings ?? DEFAULT_BANNER_CONTENT;
  } catch (error) {
    console.error("Error loading banner settings:", error);
    return DEFAULT_BANNER_CONTENT;
  }
}

export async function saveBannerContent(content: BannerContent): Promise<BannerContent> {
  return prisma.siteSettings.upsert({
    where: { id: BANNER_SETTINGS_ID },
    update: content,
    create: {
      id: BANNER_SETTINGS_ID,
      ...content,
    },
    select: bannerSettingsSelect,
  });
}
