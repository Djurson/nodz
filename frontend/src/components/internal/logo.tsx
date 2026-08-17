import { GraphIcon } from "@phosphor-icons/react";

interface NodzLogoParams {
  size?: "small" | "default" | "large";
  tone?: "accent" | "mono";
}

const SIZES = {
  small: {
    gap: "gap-2",
    dim: "size-6",
    glow: "shadow-[0px_0px_8px_-4px_rgb(217,165,20)]",
    icon: "size-3.5",
    text: "text-xs",
    weight: undefined,
    fontWeight: "font-semibold",
  },
  default: {
    gap: "gap-2",
    dim: "size-7",
    glow: "shadow-[0px_0px_20px_-4px_rgb(217,165,20)]",
    icon: "size-4",
    text: "text-sm",
    weight: "bold" as const,
    fontWeight: "font-semibold",
  },
  large: {
    gap: "gap-2.5",
    dim: "size-12",
    glow: "shadow-[0px_0px_36px_-4px_rgb(217,165,20)]",
    icon: "size-8",
    text: "text-lg",
    weight: undefined,
    fontWeight: "font-bold",
  },
} satisfies Record<"small" | "default" | "large", { gap: string; dim: string; glow: string; icon: string; text: string; weight: "bold" | undefined; fontWeight: string }>;

const TONES = {
  accent: "bg-primary text-primary-foreground",
  mono: "border border-border/70 bg-foreground/[0.06] text-foreground",
} satisfies Record<"accent" | "mono", string>;

export function NodzLogo({ size = "default", tone = "accent" }: NodzLogoParams) {
  const s = SIZES[size];
  return (
    <div className={`flex items-center px-1 pb-4 ${s.gap}`}>
      <div className={`flex items-center justify-center rounded-md ${s.dim} ${TONES[tone]} ${tone === "accent" ? s.glow : ""}`}>
        <GraphIcon weight={s.weight} className={s.icon} />
      </div>
      <span className={`${s.text} ${s.fontWeight} text-sidebar-foreground`}>Nodz</span>
    </div>
  );
}
