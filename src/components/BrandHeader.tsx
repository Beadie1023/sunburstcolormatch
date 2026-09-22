import { Link } from "@tanstack/react-router";
import logo from "@/assets/sunburst-logo.png";

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-6 text-center">
        <Link to="/" aria-label="Sunburst Color Match home">
          <img
            src={logo}
            alt="Sunburst Paints"
            width={1152}
            height={576}
            className="h-14 w-auto sm:h-16"
          />
        </Link>
        <p className="font-display text-xl font-semibold text-primary sm:text-2xl">
          Color Match
        </p>
        {subtitle ? (
          <p className="max-w-md text-base text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
