import { describe, expect, it } from "vitest";
import {
  customThemeVars,
  normalizeHex,
  readableForeground,
} from "./custom-theme";

describe("normalizeHex", () => {
  it("accepts 3 and 6 digit hex with or without #", () => {
    expect(normalizeHex("#EFC124")).toBe("#efc124");
    expect(normalizeHex("efc124")).toBe("#efc124");
    expect(normalizeHex("#fa0")).toBe("#ffaa00");
    expect(normalizeHex("  #48AFE2 ")).toBe("#48afe2");
  });

  it("rejects anything else", () => {
    expect(normalizeHex("")).toBeNull();
    expect(normalizeHex("#12345")).toBeNull();
    expect(normalizeHex("red")).toBeNull();
    expect(normalizeHex("#ggg")).toBeNull();
  });
});

describe("readableForeground", () => {
  it("puts dark text on light accents and white text on dark ones", () => {
    expect(readableForeground("#efc124")).toContain("0.18");
    expect(readableForeground("#ffffff")).toContain("0.18");
    expect(readableForeground("#161620")).toBe("oklch(0.985 0 0)");
    expect(readableForeground("#6d28d9")).toBe("oklch(0.985 0 0)");
  });
});

describe("customThemeVars", () => {
  it("sets every token the built-in accent blocks set", () => {
    const vars = customThemeVars("#48afe2");
    expect(Object.keys(vars).sort()).toEqual(
      [
        "--chart-1",
        "--primary",
        "--primary-foreground",
        "--primary-hover",
        "--primary-soft",
        "--primary-soft-2",
        "--ring",
        "--sidebar-primary",
        "--sidebar-primary-foreground",
        "--sidebar-ring",
      ].sort(),
    );
    expect(vars["--primary"]).toBe("#48afe2");
  });
});
