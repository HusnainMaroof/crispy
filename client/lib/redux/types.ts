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

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "out-for-delivery"
  | "delivered"
  | "cancelled";

export type Order = {
  id: number;
  customer_name: string;
  email: string;
  phone: string;
  address: string | null;
  postcode: string | null;
  city: string | null;
  notes: string | null;
  fulfilment: "delivery" | "collection";
  payment_method: "card" | "cash";
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  location_id: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
};

export type OrderItem = {
  id: number;
  order_id: number;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
};

export type JobPost = {
  id: string;
  title: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  status: "draft" | "active" | "closed";
  applications: number;
  created_at: string;
  updated_at: string;
};
