"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

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

  return (
    <UIContext.Provider
      value={{
        isMobileNavOpen,
        isCartOpen,
        toggleMobileNav: () => setIsMobileNavOpen((p) => !p),
        closeMobileNav: () => setIsMobileNavOpen(false),
        toggleCart: () => setIsCartOpen((p) => !p),
        closeCart: () => setIsCartOpen(false),
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
