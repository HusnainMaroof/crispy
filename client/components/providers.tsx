"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/redux/store";
import { UIProvider } from "@/lib/context/ui-context";
import { MenuProvider } from "@/lib/context/menu-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <MenuProvider>
        <UIProvider>{children}</UIProvider>
      </MenuProvider>
    </Provider>
  );
}
