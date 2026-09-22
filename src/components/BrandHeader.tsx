import { Link } from "@tanstack/react-router";
import logo from "@/assets/sunburst-logo.svg";

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-6 text-center">
        <Link to="/" aria-label="Sunburst Color Match home">
          <img
            src={logo}
            alt="Sunburst Paints & Coatings — Superior Quality Paints"
            width={1774}
            height={887}
            className="h-20 w-auto sm:h-24"
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
