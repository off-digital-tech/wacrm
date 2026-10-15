/**
 * "Custom" accent theme — a user-picked hex color (Off Digital addition).
 *
 * The five built-in accents are static `html[data-theme=...]` blocks in
 * globals.css. A free-form color can't be, so for `data-theme="custom"`
 * the same tokens are written as inline custom properties on <html>.
 *
 * Both the hex and the derived token map are persisted: the boot script
 * in layout.tsx only has to replay the stored map before first paint,
 * so the color math lives here once instead of being duplicated in the
 * dependency-free boot string.
 */

export const CUSTOM_THEME_ID = "custom";

/** Pre-filled the first time the custom card is used (Off Digital yellow). */
export const DEFAULT_CUSTOM_COLOR = "#efc124";

export const CUSTOM_COLOR_STORAGE_KEY = "wacrm.themeCustomColor";
export const CUSTOM_VARS_STORAGE_KEY = "wacrm.themeCustomVars";

const LIGHT_FOREGROUND = "oklch(0.985 0 0)";
const DARK_FOREGROUND = "oklch(0.18 0.02 260)";

/** Accepts `#abc`, `abc`, `#aabbcc` or `aabbcc`; returns `#aabbcc` or null. */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(raw)) {
    return `#${raw
      .split("")
      .map((c) => c + c)
      .join("")}`;
  }
  if (/^[0-9a-f]{6}$/.test(raw)) return `#${raw}`;
  return null;
}

function relativeLuminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/**
 * Text color for content sitting on the accent (buttons, badges): white
 * or near-black, whichever has the higher WCAG contrast — the same call
 * the built-in themes make by hand (amber/emerald get dark text).
 */
export function readableForeground(hex: string): string {
  const l = relativeLuminance(hex);
  const contrastWithWhite = 1.05 / (l + 0.05);
  const contrastWithDark = (l + 0.05) / 0.05;
  return contrastWithWhite >= contrastWithDark
    ? LIGHT_FOREGROUND
    : DARK_FOREGROUND;
}

/** Same token set (and ratios) as the built-in accent blocks in globals.css. */
export function customThemeVars(hex: string): Record<string, string> {
  const fg = readableForeground(hex);
  return {
    "--primary": hex,
    "--primary-foreground": fg,
    "--primary-hover": `color-mix(in oklch, ${hex} 85%, white)`,
    "--primary-soft": `color-mix(in oklch, ${hex} 12%, transparent)`,
    "--primary-soft-2": `color-mix(in oklch, ${hex} 22%, transparent)`,
    "--ring": hex,
    "--chart-1": hex,
    "--sidebar-primary": hex,
    "--sidebar-primary-foreground": fg,
    "--sidebar-ring": hex,
  };
}

const VAR_NAMES = Object.keys(customThemeVars(DEFAULT_CUSTOM_COLOR));

/** Writes the custom tokens onto <html>, or clears them when `hex` is null. */
export function applyCustomThemeVars(el: HTMLElement, hex: string | null) {
  if (!hex) {
    for (const name of VAR_NAMES) el.style.removeProperty(name);
    return;
  }
  for (const [name, value] of Object.entries(customThemeVars(hex))) {
    el.style.setProperty(name, value);
  }
}

/**
 * Boot-script fragment (plain ES5, no imports). Runs after `d.dataset.theme`
 * is set; replays the stored token map when the custom theme is active.
 */
export const CUSTOM_THEME_BOOT_JS = `
    if (d.dataset.theme === ${JSON.stringify(CUSTOM_THEME_ID)}) {
      var customVars = JSON.parse(localStorage.getItem(${JSON.stringify(CUSTOM_VARS_STORAGE_KEY)}) || "{}");
      for (var k in customVars) d.style.setProperty(k, customVars[k]);
    }
`;
