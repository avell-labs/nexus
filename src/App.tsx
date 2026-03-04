import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { syncWithLocalTheme } from "./actions/theme";
import { useTranslation } from "react-i18next";
import { updateAppLanguage } from "./actions/language";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./utils/routes";
import "./localization/i18n";
import { AppPreferencesProvider } from "@/components/app-preferences-provider";

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    syncWithLocalTheme();
    updateAppLanguage(i18n);
  }, [i18n]);

  return (
    <AppPreferencesProvider>
      <RouterProvider router={router} />
    </AppPreferencesProvider>
  );
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
