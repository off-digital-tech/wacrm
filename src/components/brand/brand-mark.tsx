import { BRAND } from "@/brand";
import { cn } from "@/lib/utils";

/**
 * The Off Digital "off." mark, painted with `currentColor`.
 *
 * The PNG is used as a mask rather than an <img> so the mark follows
 * the active accent / mode like the lucide icons it replaces — e.g.
 * `text-primary-foreground` on the sidebar badge stays readable on
 * both light (amber) and dark (violet) accents.
 */
export function BrandMark({ className }: { className?: string }) {
  const mask = `url(${BRAND.mark}) center / contain no-repeat`;
  return (
    <span
      aria-hidden
      className={cn("inline-block bg-current", className)}
      style={{ mask, WebkitMask: mask }}
    />
  );
}
