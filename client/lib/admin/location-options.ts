import { api } from "@/lib/api";

export async function getLocationOptions(): Promise<{ value: string; label: string }[]> {
  try {
    const data = await api.get<Record<string, unknown>[]>("/store/locations");
    return data.map((loc) => ({
      value: loc.id as string,
      label: (loc.name as string).replace("Crispies ", ""),
    }));
  } catch {
    return [];
  }
}
