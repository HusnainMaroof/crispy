"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/redux/store";
import { UIProvider } from "@/lib/context/ui-context";
import { BranchChrome } from "@/lib/branch-selection";
import { LocaleProvider } from "@/lib/i18n/locale-context";

export function Providers({ locale, children }: { locale?: string; children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <LocaleProvider initial={locale}>
        <UIProvider>
          <BranchChrome>{children}</BranchChrome>
        </UIProvider>
      </LocaleProvider>
    </Provider>
  );
}
