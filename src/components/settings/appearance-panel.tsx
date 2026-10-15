"use client";

import { useState, type KeyboardEvent } from "react";
import { Check, Moon, Palette, SunMoon, Sun } from "lucide-react";

import { useTheme } from "@/hooks/use-theme";
import { MODES, THEMES, type Mode, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { SettingsPanelHead } from "./settings-panel-head";
import { CUSTOM_THEME_ID, normalizeHex } from "@/lib/custom-theme";

/**
 * Appearance panel — light/dark mode + accent-color picker.
 *
 * Two independent controls: a mode toggle (light / dark) and the
 * accent grid. Either applies + persists immediately. No save button:
 * each change is a single attribute swap on <html>, there's nothing
 * to roll back.
 *
 * Persistence: localStorage only (device-scoped). The boot script in
 * layout.tsx replays both choices before first paint on subsequent
 * loads.
 */
export function AppearancePanel() {
  const { theme, setTheme, mode, setMode, customColor, setCustomColor } =
    useTheme();
  const t = useTranslations("Settings.appearance");

  return (
    <section className="max-w-3xl animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title={t("title")}
        description={t("description")}
      />

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SunMoon className="size-4 text-muted-foreground" />
          {t("mode")}
        </h3>

        <div
          role="radiogroup"
          aria-label={t("colorMode")}
          className="grid max-w-md grid-cols-2 gap-3"
        >
          {MODES.map((m) => (
            <ModeCard
              key={m}
              mode={m}
              isActive={m === mode}
              onPick={() => setMode(m)}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Palette className="size-4 text-muted-foreground" />
          {t("accentColor")}
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((tObj) =>
            tObj.id === CUSTOM_THEME_ID ? (
              <CustomThemeCard
                key={tObj.id}
                color={customColor}
                isActive={tObj.id === theme}
                onPick={() => setTheme(CUSTOM_THEME_ID)}
                onColorChange={(hex) => {
                  setCustomColor(hex);
                  setTheme(CUSTOM_THEME_ID);
                }}
              />
            ) : (
            <ThemeCard
              key={tObj.id}
              id={tObj.id}
              name={tObj.name}
              tagline={tObj.tagline}
              swatch={tObj.swatch}
              isActive={tObj.id === theme}
              onPick={() => setTheme(tObj.id)}
            />
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function ModeCard({
  mode,
  isActive,
  onPick,
}: {
  mode: Mode;
  isActive: boolean;
  onPick: () => void;
}) {
  const t = useTranslations("Settings.appearance");
  const isLight = mode === "light";
  const Icon = isLight ? Sun : Moon;
  return (
    <button
      type="button"
      role="radio"
      onClick={onPick}
      aria-checked={isActive}
      aria-label={t("useMode", { mode })}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors",
        isActive
          ? "border-primary/60 ring-2 ring-primary/40"
          : "border-border hover:border-border hover:bg-muted/40",
      )}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-semibold capitalize text-foreground">
        {mode}
      </span>
      {isActive && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
          <Check className="h-3 w-3" />
          {t("active")}
        </span>
      )}
    </button>
  );
}

function ThemeCard({
  id,
  name,
  tagline,
  swatch,
  isActive,
  onPick,
}: {
  id: ThemeId;
  name: string;
  tagline: string;
  swatch: string;
  isActive: boolean;
  onPick: () => void;
}) {
  const t = useTranslations("Settings.appearance");
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={isActive}
      aria-label={t("useTheme", { name })}
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4 text-left transition-colors",
        isActive
          ? "border-primary/60 ring-2 ring-primary/40"
          : "border-border hover:border-border hover:bg-muted/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          aria-hidden
          className="h-8 w-8 shrink-0 rounded-full"
          style={{
            background: swatch,
            boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 0.15)",
          }}
        />
        {isActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
            <Check className="h-3 w-3" />
            {t("active")}
          </span>
        )}
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{name}</div>
        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {tagline}
        </div>
      </div>
      <div
        className="mt-1 flex h-2 overflow-hidden rounded-full"
        aria-hidden
      >
        <span className="flex-1" style={{ background: swatch }} />
        <span className="w-3 bg-muted-foreground/60" />
        <span className="w-3 bg-muted" />
        <span className="w-3 bg-card" />
      </div>
      <span className="sr-only">{t("themeId", { id })}</span>
    </button>
  );
}

/**
 * Sixth accent card (Off Digital addition): same footprint as ThemeCard,
 * but the swatch opens the native color picker and the tagline slot is a
 * hex field. A <div role="button"> instead of <button> because it nests
 * form inputs, which a <button> may not contain.
 */
function CustomThemeCard({
  color,
  isActive,
  onPick,
  onColorChange,
}: {
  color: string;
  isActive: boolean;
  onPick: () => void;
  onColorChange: (hex: string) => void;
}) {
  const t = useTranslations("Settings.appearance");
  // Free-typing buffer; only a valid hex is committed. Re-synced when
  // the stored color changes (picker drag, other tab).
  const [draft, setDraft] = useState(color);
  const [syncedColor, setSyncedColor] = useState(color);
  if (syncedColor !== color) {
    setSyncedColor(color);
    setDraft(color);
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={onKeyDown}
      aria-pressed={isActive}
      aria-label={t("useTheme", { name: t("customName") })}
      className={cn(
        "flex cursor-pointer flex-col gap-3 rounded-lg border bg-card p-4 text-left transition-colors",
        isActive
          ? "border-primary/60 ring-2 ring-primary/40"
          : "border-border hover:border-border hover:bg-muted/40",
      )}
    >
      <div className="flex items-center justify-between">
        <label
          className="relative h-8 w-8 shrink-0 cursor-pointer rounded-full"
          title={t("customPick")}
          style={{
            background: color,
            boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 0.15)",
          }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            aria-label={t("customPick")}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        {isActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
            <Check className="h-3 w-3" />
            {t("active")}
          </span>
        )}
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">
          {t("customName")}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs leading-relaxed text-muted-foreground">
          <input
            type="text"
            value={draft}
            maxLength={7}
            spellCheck={false}
            aria-label={t("customHex")}
            onChange={(e) => {
              setDraft(e.target.value);
              const hex = normalizeHex(e.target.value);
              if (hex && e.target.value.replace("#", "").length === 6) {
                onColorChange(hex);
              }
            }}
            onBlur={() => {
              const hex = normalizeHex(draft);
              if (hex) onColorChange(hex);
              setDraft(hex ?? color);
            }}
            className="h-6 w-20 rounded border border-border bg-background px-1.5 font-mono text-xs uppercase text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <span>{t("customHint")}</span>
        </div>
      </div>
      <div
        className="mt-1 flex h-2 overflow-hidden rounded-full"
        aria-hidden
      >
        <span className="flex-1" style={{ background: color }} />
        <span className="w-3 bg-muted-foreground/60" />
        <span className="w-3 bg-muted" />
        <span className="w-3 bg-card" />
      </div>
    </div>
  );
}
