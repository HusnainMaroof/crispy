import type {
  MenuCategory,
  MenuItem,
  Deal,
  Location,
  Order,
  OrderItem,
  BusinessSettings,
  JobPost,
  JobApplication,
  ContactMessage,
  AdminProfile,
} from "./models.js";

export interface Database {
  public: {
    Tables: {
      menu_categories: {
        Row: MenuCategory;
        Insert: Omit<MenuCategory, "created_at" | "updated_at">;
        Update: Partial<Omit<MenuCategory, "id" | "created_at" | "updated_at">>;
      };
      menu_items: {
        Row: MenuItem;
        Insert: Omit<MenuItem, "created_at" | "updated_at">;
        Update: Partial<Omit<MenuItem, "id" | "created_at" | "updated_at">>;
      };
      deals: {
        Row: Deal;
        Insert: Omit<Deal, "created_at" | "updated_at">;
        Update: Partial<Omit<Deal, "id" | "created_at" | "updated_at">>;
      };
      locations: {
        Row: Location;
        Insert: Omit<Location, "created_at" | "updated_at">;
        Update: Partial<Omit<Location, "id" | "created_at" | "updated_at">>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "created_at" | "updated_at">;
        Update: Partial<Omit<Order, "id" | "created_at" | "updated_at">>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, "id" | "created_at">;
        Update: Partial<Omit<OrderItem, "id" | "created_at">>;
      };
      business_settings: {
        Row: BusinessSettings;
        Insert: Omit<BusinessSettings, "id" | "updated_at">;
        Update: Partial<Omit<BusinessSettings, "id" | "updated_at">>;
      };
      job_posts: {
        Row: JobPost;
        Insert: Omit<JobPost, "created_at" | "updated_at">;
        Update: Partial<Omit<JobPost, "id" | "created_at" | "updated_at">>;
      };
      contact_messages: {
        Row: ContactMessage;
        Insert: Omit<ContactMessage, "id" | "created_at" | "read">;
        Update: Partial<Omit<ContactMessage, "id" | "created_at">>;
      };
      admin_profiles: {
        Row: AdminProfile;
        Insert: Omit<AdminProfile, "created_at">;
        Update: Partial<Omit<AdminProfile, "id" | "created_at">>;
      };
      job_applications: {
        Row: JobApplication;
        Insert: Omit<JobApplication, "created_at" | "updated_at">;
        Update: Partial<Omit<JobApplication, "id" | "created_at" | "updated_at">>;
      };
    };
    Functions: Record<string, unknown>;
    Enums: {
      fulfilment_type: "delivery" | "collection";
      payment_method: "card" | "cash";
      order_status: "pending" | "preparing" | "ready" | "out-for-delivery" | "delivered" | "cancelled";
      job_status: "draft" | "active" | "closed";
      application_status: "pending" | "reviewed" | "shortlisted" | "rejected" | "hired";
      admin_role: "admin" | "superadmin";
    };
  };
}
