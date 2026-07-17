export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceValue: number;
  image: string;
  badge?: string;
  badgeVariant?: "default" | "vegan";
};

export type MenuCategory = {
  id: string;
  number: string;
  title: string;
  image: string;
  items: MenuItem[];
};

export type Deal = MenuItem;

export type Location = {
  id: string;
  name: string;
  address: string;
  hours: string;
  phone: string;
  lat: number | null;
  lng: number | null;
  sort_order: number;
};

export type Settings = {
  id: number;
  delivery_fee: number;
  free_delivery_threshold: number;
};
