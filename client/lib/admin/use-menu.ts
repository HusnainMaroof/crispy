"use client";

import { useCallback } from "react";
import { useAdminStore } from "./store";
import type { AdminMenuItem } from "./mock-data";

export function useMenu() {
  const { menuItems, setMenuItems } = useAdminStore();

  const addItem = useCallback(
    (item: Omit<AdminMenuItem, "id">) => {
      const newId = `item-${Date.now()}`;
      setMenuItems([...menuItems, { ...item, id: newId }]);
    },
    [menuItems, setMenuItems]
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<AdminMenuItem>) => {
      setMenuItems(
        menuItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    [menuItems, setMenuItems]
  );

  const deleteItem = useCallback(
    (id: string) => {
      setMenuItems(menuItems.filter((item) => item.id !== id));
    },
    [menuItems, setMenuItems]
  );

  const getItem = useCallback(
    (id: string) => menuItems.find((item) => item.id === id),
    [menuItems]
  );

  return { items: menuItems, addItem, updateItem, deleteItem, getItem };
}
