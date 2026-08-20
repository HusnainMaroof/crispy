"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/redux/store";
import { UIProvider } from "@/lib/context/ui-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <UIProvider>{children}</UIProvider>
    </Provider>
  );
}
