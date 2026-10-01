"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type UIContextType = {
  isMobileNavOpen: boolean;
  isCartOpen: boolean;
  cartEnabled: boolean;
  setCartEnabled: (value: boolean) => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
  toggleCart: () => void;
  closeCart: () => void;
};

const UIContext = createContext<UIContextType | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // Derived rather than stored, so switching the mode off cannot leave the
  // drawer open: the value is forced shut in the same render that disables it.
  const [cartRequested, setCartRequested] = useState(false);
  // Set by the store while it resolves the published ordering mode. Until it
  // answers, the cart must stay shut so a fast click cannot open the drawer in
  // redirect mode.
  const [cartAllowed, setCartAllowed] = useState(false);
  const isCartOpen = cartAllowed && cartRequested;

  const toggleMobileNav = useCallback(() => setIsMobileNavOpen((p) => !p), []);
  const closeMobileNav = useCallback(() => setIsMobileNavOpen(false), []);
  const toggleCart = useCallback(() => {
    if (!cartAllowed) return;
    setCartRequested((p) => !p);
  }, [cartAllowed]);
  const closeCart = useCallback(() => setCartRequested(false), []);

  // Changing the mode is what turns the cart off, so clear the request too.
  const setCartEnabled = useCallback((enabled: boolean) => {
    setCartAllowed(enabled);
    if (!enabled) setCartRequested(false);
  }, []);

  const value = useMemo(
    () => ({
      isMobileNavOpen,
      isCartOpen,
      cartEnabled: cartAllowed,
      setCartEnabled,
      toggleMobileNav,
      closeMobileNav,
      toggleCart,
      closeCart,
    }),
    [isMobileNavOpen, isCartOpen, cartAllowed, setCartEnabled, toggleMobileNav, closeMobileNav, toggleCart, closeCart],
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
