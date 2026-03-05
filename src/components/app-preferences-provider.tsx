import { LOCAL_STORAGE_KEYS } from "@/constants";
import * as React from "react";

type AccentName = "slate" | "ocean" | "rose" | "sunset";

interface AccentPalette {
  light: Record<string, string>;
  dark: Record<string, string>;
}

const accentTokens = [
  "--primary",
  "--primary-foreground",
  "--ring",
  "--accent",
  "--accent-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-ring",
] as const;

const accentPalettes: Record<AccentName, AccentPalette> = {
  slate: {
    light: {},
    dark: {},
  },
  ocean: {
    light: {
      "--primary": "#64B7CC",
      "--primary-foreground": "#062129",
      "--ring": "#64B7CC",
      "--accent": "#64B7CC26",
      "--accent-foreground": "#062129",
      "--sidebar-primary": "#64B7CC",
      "--sidebar-primary-foreground": "#062129",
      "--sidebar-accent": "#64B7CC26",
      "--sidebar-accent-foreground": "#062129",
      "--sidebar-ring": "#64B7CC",
    },
    dark: {
      "--primary": "#64B7CC",
      "--primary-foreground": "#041A21",
      "--ring": "#64B7CC",
      "--accent": "#64B7CC40",
      "--accent-foreground": "#EAF7FB",
      "--sidebar-primary": "#64B7CC",
      "--sidebar-primary-foreground": "#041A21",
      "--sidebar-accent": "#64B7CC40",
      "--sidebar-accent-foreground": "#EAF7FB",
      "--sidebar-ring": "#64B7CC",
    },
  },
  rose: {
    light: {
      "--primary": "#FF3877",
      "--primary-foreground": "#FFFFFF",
      "--ring": "#FF3877",
      "--accent": "#FF387726",
      "--accent-foreground": "#4A0018",
      "--sidebar-primary": "#FF3877",
      "--sidebar-primary-foreground": "#FFFFFF",
      "--sidebar-accent": "#FF387726",
      "--sidebar-accent-foreground": "#4A0018",
      "--sidebar-ring": "#FF3877",
    },
    dark: {
      "--primary": "#FF3877",
      "--primary-foreground": "#FFFFFF",
      "--ring": "#FF3877",
      "--accent": "#FF387740",
      "--accent-foreground": "#FFEAF1",
      "--sidebar-primary": "#FF3877",
      "--sidebar-primary-foreground": "#FFFFFF",
      "--sidebar-accent": "#FF387740",
      "--sidebar-accent-foreground": "#FFEAF1",
      "--sidebar-ring": "#FF3877",
    },
  },
  sunset: {
    light: {
      "--primary": "#FD7924",
      "--primary-foreground": "#FFFFFF",
      "--ring": "#FD7924",
      "--accent": "#FD792426",
      "--accent-foreground": "#4A1F00",
      "--sidebar-primary": "#FD7924",
      "--sidebar-primary-foreground": "#FFFFFF",
      "--sidebar-accent": "#FD792426",
      "--sidebar-accent-foreground": "#4A1F00",
      "--sidebar-ring": "#FD7924",
    },
    dark: {
      "--primary": "#FD7924",
      "--primary-foreground": "#FFFFFF",
      "--ring": "#FD7924",
      "--accent": "#FD792440",
      "--accent-foreground": "#FFF2E8",
      "--sidebar-primary": "#FD7924",
      "--sidebar-primary-foreground": "#FFFFFF",
      "--sidebar-accent": "#FD792440",
      "--sidebar-accent-foreground": "#FFF2E8",
      "--sidebar-ring": "#FD7924",
    },
  },
};

interface AppPreferencesContextValue {
  accent: AccentName;
  setAccent: (accent: AccentName) => void;
  preferredName: string;
  setPreferredName: (name: string) => void;
  resolveDisplayName: (name: string | null | undefined) => string;
}

const AppPreferencesContext = React.createContext<
  AppPreferencesContextValue | undefined
>(undefined);

function normalizeAccent(
  value: string | null,
): AppPreferencesContextValue["accent"] {
  if (value === "emerald") {
    return "rose";
  }
  if (value === "ocean" || value === "rose" || value === "sunset") {
    return value;
  }
  return "slate";
}

function applyAccent(accent: AccentName) {
  const root = document.documentElement;
  const isDarkMode = root.classList.contains("dark");
  const selectedPalette = accentPalettes[accent][isDarkMode ? "dark" : "light"];

  for (const token of accentTokens) {
    root.style.removeProperty(token);
  }

  for (const [token, value] of Object.entries(selectedPalette)) {
    root.style.setProperty(token, value);
  }
}

export function AppPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accent, setAccentState] = React.useState<AccentName>("slate");
  const [preferredName, setPreferredNameState] = React.useState("");

  React.useEffect(() => {
    const savedAccent = normalizeAccent(
      localStorage.getItem(LOCAL_STORAGE_KEYS.APP_ACCENT),
    );
    const savedName = localStorage.getItem(LOCAL_STORAGE_KEYS.PREFERRED_NAME);

    setAccentState(savedAccent);
    setPreferredNameState(savedName ?? "");
    applyAccent(savedAccent);
  }, []);

  React.useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      applyAccent(accent);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [accent]);

  const setAccent = React.useCallback((nextAccent: AccentName) => {
    setAccentState(nextAccent);
    localStorage.setItem(LOCAL_STORAGE_KEYS.APP_ACCENT, nextAccent);
    applyAccent(nextAccent);
  }, []);

  const setPreferredName = React.useCallback((name: string) => {
    const normalized = name.trim();
    setPreferredNameState(normalized);

    if (normalized) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.PREFERRED_NAME, normalized);
      return;
    }

    localStorage.removeItem(LOCAL_STORAGE_KEYS.PREFERRED_NAME);
  }, []);

  const resolveDisplayName = React.useCallback(
    (name: string | null | undefined) => {
      if (preferredName) {
        return preferredName;
      }

      if (name) {
        return name;
      }

      return "User";
    },
    [preferredName],
  );

  return (
    <AppPreferencesContext.Provider
      value={{
        accent,
        setAccent,
        preferredName,
        setPreferredName,
        resolveDisplayName,
      }}
    >
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const context = React.useContext(AppPreferencesContext);
  if (!context) {
    throw new Error(
      "useAppPreferences must be used inside AppPreferencesProvider.",
    );
  }

  return context;
}
