/**
 * Off Digital branding — single place for the name and brand assets.
 *
 * Lives in its own file (not upstream's) so merging updates from
 * ArnasDon/wacrm rarely conflicts: upstream files only reference these
 * constants. Images live in `public/brand/`.
 */
export const BRAND = {
  name: "Off Digital WhatsApp CRM",
  shortName: "Off Digital",
  productLine: "WhatsApp CRM",
  /** Full white logo ("off." + "DIGITAL") on transparent background. */
  logo: "/brand/off-digital-logo.png",
  /** White "off." mark only, used as a CSS mask so it takes any color. */
  mark: "/brand/off-digital-mark.png",
  favicon: "/brand/favicon.png",
  appleIcon: "/brand/apple-icon.png",
} as const;
