export function ColorSwatch({
  hex,
  label,
  caption,
  size = "md",
}: {
  hex: string;
  label?: string;
  caption?: string;
  size?: "sm" | "md" | "lg";
}) {
  const heights = {
    sm: "h-16",
    md: "h-28",
    lg: "h-40 sm:h-48",
  } as const;

  return (
    <div className="w-full text-center">
      <div
        className={`swatch-frame w-full ${heights[size]}`}
        style={{ backgroundColor: hex }}
        aria-label={label ? `${label}, ${hex}` : hex}
      />
      {label ? (
        <p className="mt-2 font-display text-base font-semibold text-foreground sm:text-lg">
          {label}
        </p>
      ) : null}
      {caption ? (
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{caption}</p>
      ) : null}
    </div>
  );
}
