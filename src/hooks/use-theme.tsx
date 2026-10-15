"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  MODE_STORAGE_KEY,
  STORAGE_KEY,
  isMode,
  isThemeId,
  type Mode,
  type ThemeId,
} from "@/lib/themes";
import {
  CUSTOM_COLOR_STORAGE_KEY,
  CUSTOM_THEME_ID,
  CUSTOM_VARS_STORAGE_KEY,
  DEFAULT_CUSTOM_COLOR,
  applyCustomThemeVars,
  customThemeVars,
  normalizeHex,
} from "@/lib/custom-theme";

/**
 * ThemeProvider — wraps the whole app, owns the two theming axes:
 *   • `theme` — the accent color (`data-theme` on <html>)
 *   • `mode`  — light / dark (`data-mode` on <html>)
 * The two are independent, so any accent renders in either mode.
 *
 * The boot script in `src/app/layout.tsx` has already applied both
 * `data-theme` and `data-mode` before React hydrates, so by the time
 * this Provider mounts the page is already painted correctly. We just
 * read what's there and keep it in sync going forward.
 *
 * Persistence is localStorage only (device-scoped). A future
 * follow-up could mirror to `profiles.preferences` for cross-device
 * sync, but a per-device choice is also defensible — your phone may
 * deserve a different theme than your laptop.
 */

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (next: ThemeId) => void;
  mode: Mode;
  setMode: (next: Mode) => void;
  toggleMode: () => void;
  /** Hex used by the "custom" accent (Off Digital addition). */
  customColor: string;
  setCustomColor: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  // Whatever the boot script applied is the truth. Fall back to
  // localStorage / default if for some reason the attribute is missing
  // (e.g. someone bypassed the boot script in a custom layout).
  const fromAttr = document.documentElement.dataset.theme;
  if (isThemeId(fromAttr)) return fromAttr;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isThemeId(stored)) return stored;
  } catch {
    // localStorage can throw in private-browsing / sandboxed contexts.
  }
  return DEFAULT_THEME;
}

function readInitialMode(): Mode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const fromAttr = document.documentElement.dataset.mode;
  if (isMode(fromAttr)) return fromAttr;
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (isMode(stored)) return stored;
  } catch {
    // localStorage can throw in private-browsing / sandboxed contexts.
  }
  return DEFAULT_MODE;
}

function readInitialCustomColor(): string {
  if (typeof window === "undefined") return DEFAULT_CUSTOM_COLOR;
  try {
    return (
      normalizeHex(localStorage.getItem(CUSTOM_COLOR_STORAGE_KEY) ?? "") ??
      DEFAULT_CUSTOM_COLOR
    );
  } catch {
    return DEFAULT_CUSTOM_COLOR;
  }
}

function persistCustomColor(hex: string) {
  try {
    localStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, hex);
    localStorage.setItem(
      CUSTOM_VARS_STORAGE_KEY,
      JSON.stringify(customThemeVars(hex)),
    );
  } catch {
    // Private-browsing edge case; in-memory state still applies.
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(readInitialTheme);
  const [mode, setModeState] = useState<Mode>(readInitialMode);
  const [customColor, setCustomColorState] = useState<string>(
    readInitialCustomColor,
  );

  // Inline custom-accent tokens on <html> must follow the active theme:
  // present only while "custom" is selected, cleared otherwise so the
  // built-in data-theme blocks win again.
  useEffect(() => {
    applyCustomThemeVars(
      document.documentElement,
      theme === CUSTOM_THEME_ID ? customColor : null,
    );
  }, [theme, customColor]);

  const setCustomColor = useCallback((hex: string) => {
    const next = normalizeHex(hex);
    if (!next) return;
    setCustomColorState(next);
    persistCustomColor(next);
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = next;
    }
    if (next === CUSTOM_THEME_ID) {
      // Make sure the boot script has a token map to replay next load.
      persistCustomColor(readInitialCustomColor());
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Same private-browsing edge case as above; the in-memory state
      // still updates so the current tab works for the session.
    }
  }, []);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.mode = next;
    }
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      // Same private-browsing edge case as above.
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  // Sync from other tabs — change theme or mode in tab A, tab B
  // catches up without a refresh.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        if (isThemeId(e.newValue) && e.newValue !== theme) {
          setThemeState(e.newValue);
          document.documentElement.dataset.theme = e.newValue;
        }
        return;
      }
      if (e.key === CUSTOM_COLOR_STORAGE_KEY) {
        const hex = normalizeHex(e.newValue ?? "");
        if (hex) setCustomColorState(hex);
        return;
      }
      if (e.key === MODE_STORAGE_KEY) {
        if (isMode(e.newValue) && e.newValue !== mode) {
          setModeState(e.newValue);
          document.documentElement.dataset.mode = e.newValue;
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [theme, mode]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        mode,
        setMode,
        toggleMode,
        customColor,
        setCustomColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback for components rendered outside the provider — return
    // no-op setters so callers don't crash. The boot script still
    // applied the right CSS attributes, so visually the page is fine.
    return {
      theme: DEFAULT_THEME,
      setTheme: () => {},
      mode: DEFAULT_MODE,
      setMode: () => {},
      toggleMode: () => {},
      customColor: DEFAULT_CUSTOM_COLOR,
      setCustomColor: () => {},
    };
  }
  return ctx;
}
