import { BadRequestException } from "./app-error.js";

export function slugifyBranchName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new BadRequestException("Branch name cannot be turned into a slug");
  }

  return slug;
}
