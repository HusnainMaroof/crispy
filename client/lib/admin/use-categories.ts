"use client";

import { useCallback } from "react";
import { useAdminStore } from "./store";
import type { AdminCategory } from "./mock-data";

export function useCategories() {
  const { categories, setCategories } = useAdminStore();

  const addCategory = useCallback(
    (category: Omit<AdminCategory, "id">) => {
      const newId = `cat-${Date.now()}`;
      setCategories([...categories, { ...category, id: newId }]);
    },
    [categories, setCategories]
  );

  const updateCategory = useCallback(
    (id: string, updates: Partial<AdminCategory>) => {
      setCategories(
        categories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
      );
    },
    [categories, setCategories]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      setCategories(categories.filter((cat) => cat.id !== id));
    },
    [categories, setCategories]
  );

  return { categories, addCategory, updateCategory, deleteCategory };
}
