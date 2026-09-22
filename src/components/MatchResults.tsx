import { Button } from "@/components/ui/button";
import { ColorSwatch } from "@/components/ColorSwatch";
import type { Match } from "@/lib/color-match";

export function MatchResults({
  inputHex,
  matches,
  onStartOver,
}: {
  inputHex: string;
  matches: Match[];
  onStartOver: () => void;
}) {
  const top = matches[0];
  const alternatives = matches.slice(1, 4);

  if (!top) {
    return (
      <div className="panel p-6 text-center">
        <p className="text-lg">
          No paint colors are loaded yet, so we can&apos;t compare your color.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="panel space-y-5 p-5 sm:p-7">
        <h2 className="text-center font-display text-2xl font-bold">Your closest match</h2>

        <div className="grid grid-cols-2 gap-4">
          <ColorSwatch hex={inputHex} label="Your color" caption={inputHex} size="lg" />
          <ColorSwatch
            hex={top.color.hex}
            label={top.color.name}
            caption={top.color.hex}
            size="lg"
          />
        </div>

        <div className="rounded-xl bg-muted px-4 py-3 text-center">
          <p className="font-display text-xl font-bold text-accent">
            {top.confidence}% match
          </p>
          <p className="text-sm text-muted-foreground">
            {top.color.collection ? `${top.color.collection} collection · ` : ""}
            Ask for &ldquo;{top.color.name}&rdquo; in store
          </p>
        </div>
      </div>

      {alternatives.length > 0 ? (
        <div className="panel p-5 sm:p-7">
          <h3 className="mb-4 text-center font-display text-xl font-semibold">
            Close alternatives
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {alternatives.map((match) => (
              <div key={match.color.id}>
                <ColorSwatch
                  hex={match.color.hex}
                  label={match.color.name}
                  caption={`${match.confidence}%`}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="h-14 flex-1 text-lg"
          onClick={onStartOver}
          type="button"
        >
          Try another color
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-14 flex-1 border-2 text-lg"
        >
          <a href="https://sunburstbahamas.com" target="_blank" rel="noreferrer">
            Find this in store
          </a>
        </Button>
      </div>
    </div>
  );
}
