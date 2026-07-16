"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import {
  initialMenuItems,
  initialCategories,
  initialDeals,
  initialOrders,
  initialLocations,
  initialSettings,
  initialJobPosts,
  type AdminMenuItem,
  type AdminCategory,
  type AdminDeal,
  type AdminOrder,
  type AdminLocation,
  type AdminSettings,
  type AdminJobPost,
} from "./mock-data";

type Listener = () => void;

type AdminState = {
  menuItems: AdminMenuItem[];
  categories: AdminCategory[];
  deals: AdminDeal[];
  orders: AdminOrder[];
  locations: AdminLocation[];
  settings: AdminSettings;
  jobPosts: AdminJobPost[];
};

const state: AdminState = {
  menuItems: initialMenuItems,
  categories: initialCategories,
  deals: initialDeals,
  orders: initialOrders,
  locations: initialLocations,
  settings: initialSettings,
  jobPosts: initialJobPosts,
};

const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AdminState {
  return state;
}

export function useAdminStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  const setMenuItems = useCallback((items: AdminMenuItem[]) => {
    state.menuItems = items;
    emitChange();
  }, []);

  const setCategories = useCallback((cats: AdminCategory[]) => {
    state.categories = cats;
    emitChange();
  }, []);

  const setDeals = useCallback((deals: AdminDeal[]) => {
    state.deals = deals;
    emitChange();
  }, []);

  const setOrders = useCallback((orders: AdminOrder[]) => {
    state.orders = orders;
    emitChange();
  }, []);

  const setLocations = useCallback((locs: AdminLocation[]) => {
    state.locations = locs;
    emitChange();
  }, []);

  const setSettings = useCallback((settings: AdminSettings) => {
    state.settings = settings;
    emitChange();
  }, []);

  const setJobPosts = useCallback((posts: AdminJobPost[]) => {
    state.jobPosts = posts;
    emitChange();
  }, []);

  return {
    ...snapshot,
    setMenuItems,
    setCategories,
    setDeals,
    setOrders,
    setLocations,
    setSettings,
    setJobPosts,
  };
}
