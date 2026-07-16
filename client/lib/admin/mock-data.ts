import { menuCategories, deals } from "@/lib/data/menu";
import { LOCATIONS } from "@/lib/data/locations";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from "@/lib/data/business";

export type AdminMenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceValue: number;
  image: string;
  categoryId: string;
  badge?: string;
  badgeVariant?: "default" | "vegan";
};

export type AdminCategory = {
  id: string;
  number: string;
  title: string;
  image: string;
  itemCount: number;
};

export type AdminDeal = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceValue: number;
  image: string;
  badge?: string;
  badgeVariant?: "default" | "vegan";
  active: boolean;
};

export type AdminLocation = {
  name: string;
  address: string;
  hours: string;
  phone: string;
};

export type AdminOrder = {
  id: string;
  customer: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  createdAt: string;
  location: string;
};

export type AdminSettings = {
  deliveryFee: number;
  freeDeliveryThreshold: number;
};

export type AdminJobPost = {
  id: string;
  title: string;
  location: string;
  type: "full-time" | "part-time" | "contract";
  salary: string;
  description: string;
  requirements: string[];
  status: "active" | "closed" | "draft";
  createdAt: string;
  applications: number;
};

// Initial mock data from existing data sources
export const initialMenuItems: AdminMenuItem[] = menuCategories.flatMap((cat) =>
  cat.items.map((item) => ({
    ...item,
    categoryId: cat.id,
  }))
);

export const initialCategories: AdminCategory[] = menuCategories.map((cat) => ({
  id: cat.id,
  number: cat.number,
  title: cat.title,
  image: cat.image,
  itemCount: cat.items.length,
}));

export const initialDeals: AdminDeal[] = deals.map((deal) => ({
  ...deal,
  active: true,
}));

export const initialLocations: AdminLocation[] = [...LOCATIONS];

export const initialOrders: AdminOrder[] = [
  {
    id: "#1284",
    customer: "John Smith",
    items: [
      { name: "Flaming Wings", quantity: 2, price: 7.99 },
      { name: "Classic Burger", quantity: 1, price: 8.99 },
    ],
    total: 24.97,
    status: "preparing",
    createdAt: "2024-01-15T10:30:00Z",
    location: "Brixton",
  },
  {
    id: "#1283",
    customer: "Sarah Johnson",
    items: [
      { name: "Tenders Box Meal", quantity: 1, price: 11.49 },
      { name: "Cola", quantity: 1, price: 1.99 },
    ],
    total: 13.48,
    status: "ready",
    createdAt: "2024-01-15T10:22:00Z",
    location: "Peckham",
  },
  {
    id: "#1282",
    customer: "Mike Williams",
    items: [
      { name: "Gourmet Burger", quantity: 3, price: 10.99 },
      { name: "Fries", quantity: 2, price: 3.99 },
    ],
    total: 40.95,
    status: "delivered",
    createdAt: "2024-01-15T10:15:00Z",
    location: "Tottenham",
  },
  {
    id: "#1281",
    customer: "Emily Brown",
    items: [
      { name: "Big Wrap", quantity: 1, price: 7.99 },
      { name: "Onion Rings", quantity: 1, price: 3.99 },
    ],
    total: 11.98,
    status: "delivered",
    createdAt: "2024-01-15T10:08:00Z",
    location: "Stratford",
  },
  {
    id: "#1280",
    customer: "Party Planners Ltd",
    items: [
      { name: "Party Platter", quantity: 5, price: 24.99 },
      { name: "Soft Drinks", quantity: 3, price: 1.99 },
    ],
    total: 130.92,
    status: "delivered",
    createdAt: "2024-01-15T09:55:00Z",
    location: "Lewisham",
  },
];

export const initialSettings: AdminSettings = {
  deliveryFee: DELIVERY_FEE,
  freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
};

export const initialJobPosts: AdminJobPost[] = [
  {
    id: "job-1",
    title: "Restaurant Manager",
    location: "Brixton",
    type: "full-time",
    salary: "£28,000 - £35,000",
    description: "We're looking for an experienced Restaurant Manager to lead our Brixton team. You'll oversee daily operations, manage staff, and ensure exceptional customer service.",
    requirements: [
      "3+ years restaurant management experience",
      "Strong leadership and communication skills",
      "Food hygiene certificate Level 3",
      "Experience with POS systems",
    ],
    status: "active",
    createdAt: "2024-01-10T09:00:00Z",
    applications: 12,
  },
  {
    id: "job-2",
    title: "Head Chef",
    location: "Peckham",
    type: "full-time",
    salary: "£32,000 - £40,000",
    description: "Join our kitchen team as Head Chef. You'll create menus, manage kitchen staff, and maintain our high food quality standards.",
    requirements: [
      "5+ years culinary experience",
      "Menu development skills",
      "Food safety certification",
      "Team management experience",
    ],
    status: "active",
    createdAt: "2024-01-08T10:00:00Z",
    applications: 8,
  },
  {
    id: "job-3",
    title: "Kitchen Assistant",
    location: "Tottenham",
    type: "part-time",
    salary: "£11 - £13 per hour",
    description: "Support our kitchen team with food preparation, cleaning, and maintaining hygiene standards.",
    requirements: [
      "No experience required - training provided",
      "Ability to work in a fast-paced environment",
      "Flexible with hours",
    ],
    status: "active",
    createdAt: "2024-01-05T11:00:00Z",
    applications: 24,
  },
  {
    id: "job-4",
    title: "Delivery Driver",
    location: "Stratford",
    type: "part-time",
    salary: "£12 - £14 per hour + tips",
    description: "Deliver orders to customers promptly while maintaining excellent customer service.",
    requirements: [
      "Valid UK driving licence",
      "Own vehicle or access to transport",
      "Smartphone with data",
      "Knowledge of local area",
    ],
    status: "closed",
    createdAt: "2024-01-02T09:00:00Z",
    applications: 31,
  },
];
