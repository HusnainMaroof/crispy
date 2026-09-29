export const DIETARY_OPTIONS = ["Halal", "Vegetarian", "Vegan"] as const;

export type DietaryOption = (typeof DIETARY_OPTIONS)[number];

export function dietaryTags(badge?: string | null, badgeVariant?: string | null): DietaryOption[] {
  const found = new Set(
    (badge ?? "")
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
  );
  if (badgeVariant?.toLowerCase() === "vegan") found.add("vegan");
  return DIETARY_OPTIONS.filter((option) => found.has(option.toLowerCase()));
}
