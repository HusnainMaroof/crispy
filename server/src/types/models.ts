export interface MenuCategory {
  id: string;
  number: string;
  title: string;
  image: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  badge: string | null;
  badge_variant: "default" | "vegan" | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  badge: string | null;
  badge_variant: "default" | "vegan" | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  hours: string;
  phone: string;
  lat: number | null;
  lng: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
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
  status: "pending" | "preparing" | "ready" | "out-for-delivery" | "delivered" | "cancelled";
  location_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  created_at: string;
}

export interface BusinessSettings {
  id: string;
  delivery_fee: number;
  free_delivery_threshold: number;
  updated_at: string;
}

export interface JobPost {
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
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  type: "general" | "franchise" | "careers" | "press";
  read: boolean;
  created_at: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  role: "admin" | "superadmin";
  created_at: string;
}
