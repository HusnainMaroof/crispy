import { getPrisma } from "../config/prisma.js";

export { getLocations, getSettings, getLocationById } from "./admin.service.js";

export type HomepageContent = Record<string, unknown>;

export async function getHomepageContent(): Promise<HomepageContent> {
  try {
    const rows = await getPrisma().homepage_content.findMany({
      select: { key: true, content: true },
    });
    const result: HomepageContent = {};
    for (const row of rows) {
      result[row.key] = row.content;
    }
    return result;
  } catch {
    return {};
  }
}
