"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export type AdminCategory = {
  id: string;
  number: string;
  title: string;
  image: string;
  itemCount: number;
};

function mapCategory(raw: Record<string, unknown>): AdminCategory {
  return {
    id: raw.id as string,
    number: raw.number as string,
    title: raw.title as string,
    image: raw.image as string,
    itemCount: ((raw.items as unknown[]) ?? []).length,
  };
}

export function useCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Record<string, unknown>[]>("/admin/categories");
      setCategories(data.map(mapCategory));
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(
    async (category: Omit<AdminCategory, "id" | "itemCount">) => {
      const data = await api.post<Record<string, unknown>>("/admin/categories", {
        number: category.number,
        title: category.title,
        image: category.image,
        sort_order: 0,
      });
      setCategories((prev) => [...prev, { ...mapCategory(data), itemCount: 0 }]);
    },
    []
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<AdminCategory>) => {
      const body: Record<string, unknown> = {};
      if (updates.number !== undefined) body.number = updates.number;
      if (updates.title !== undefined) body.title = updates.title;
      if (updates.image !== undefined) body.image = updates.image;
      const data = await api.put<Record<string, unknown>>(`/admin/categories/${id}`, body);
      const updated = mapCategory(data);
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, ...updated, itemCount: cat.itemCount } : cat))
      );
    },
    []
  );

  const deleteCategory = useCallback(async (id: string) => {
    await api.delete(`/admin/categories/${id}`);
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  }, []);

  return { categories, loading, fetchCategories, addCategory, updateCategory, deleteCategory };
}
