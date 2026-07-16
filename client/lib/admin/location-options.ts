import { LOCATIONS } from "@/lib/data/locations";

export const locationOptions = LOCATIONS.map((loc) => ({
  value: loc.name.replace("Crispies ", ""),
  label: loc.name.replace("Crispies ", ""),
}));
