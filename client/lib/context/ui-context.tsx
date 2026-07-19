"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type UIContextType = {
  isMobileNavOpen: boolean;
  isCartOpen: boolean;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
  toggleCart: () => void;
  closeCart: () => void;
};

const UIContext = createContext<UIContextType | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleMobileNav = useCallback(() => setIsMobileNavOpen((p) => !p), []);
  const closeMobileNav = useCallback(() => setIsMobileNavOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((p) => !p), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const value = useMemo(
    () => ({
      isMobileNavOpen,
      isCartOpen,
      toggleMobileNav,
      closeMobileNav,
      toggleCart,
      closeCart,
    }),
    [isMobileNavOpen, isCartOpen, toggleMobileNav, closeMobileNav, toggleCart, closeCart],
  );

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
