import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";
import { ColorSwatch } from "@/components/ColorSwatch";
import { MatchResults } from "@/components/MatchResults";
import { PhotoPicker } from "@/components/PhotoPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePaintColors } from "@/hooks/usePaintColors";
import {
  clamp255,
  findMatches,
  hexToRgb,
  normalizeHex,
  rgbToHex,
  type Rgb,
} from "@/lib/color-match";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sunburst Color Match — Find your Sunburst paint color" },
      {
        name: "description",
        content:
          "Match any color to the closest Sunburst Paints shade using a hex code, RGB values, or a photo. Sunburst Paints & Coatings Ltd, Nassau, Bahamas.",
      },
      { property: "og:title", content: "Sunburst Color Match" },
      {
        property: "og:description",
        content:
          "Find the closest Sunburst paint color from a hex code, RGB values, or a photo.",
      },
    ],
  }),
  component: ColorMatchPage,
});

function ColorMatchPage() {
  const { data: colors = [], isLoading, error } = usePaintColors();
  const [hexInput, setHexInput] = useState("#2FB5B0");
  const [rgb, setRgb] = useState<Rgb>({ r: 240, g: 138, b: 60 });
  const [submitted, setSubmitted] = useState<Rgb | null>(null);

  const hexPreview = normalizeHex(hexInput);
  const matches = useMemo(
    () => (submitted ? findMatches(submitted, colors, 4) : []),
    [submitted, colors],
  );

  if (submitted) {
    return (
      <div className="min-h-screen">
        <BrandHeader />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <MatchResults
            inputHex={rgbToHex(submitted)}
            matches={matches}
            onStartOver={() => setSubmitted(null)}
          />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BrandHeader subtitle="Show us any color and we'll find the closest Sunburst paint for it." />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Tabs defaultValue="hex">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-2 bg-muted p-2">
            <TabsTrigger value="hex" className="h-14 text-base font-semibold">
              Hex code
            </TabsTrigger>
            <TabsTrigger value="rgb" className="h-14 text-base font-semibold">
              RGB
            </TabsTrigger>
            <TabsTrigger value="photo" className="h-14 text-base font-semibold">
              Photo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hex" className="mt-6">
            <div className="panel space-y-5 p-5 sm:p-7">
              <Label htmlFor="hex" className="text-base">
                Type a hex code, for example #2FB5B0
              </Label>
              <Input
                id="hex"
                value={hexInput}
                onChange={(event) => setHexInput(event.target.value)}
                placeholder="#2FB5B0"
                autoCapitalize="characters"
                spellCheck={false}
                className="h-16 text-center font-display text-2xl"
              />
              <ColorSwatch
                hex={hexPreview ?? "#FFFFFF"}
                caption={hexPreview ?? "Enter 6 characters"}
              />
              <Button
                type="button"
                size="lg"
                className="h-16 w-full text-lg"
                disabled={!hexPreview}
                onClick={() => {
                  const value = hexToRgb(hexInput);
                  if (value) setSubmitted(value);
                }}
              >
                Find my paint color
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="rgb" className="mt-6">
            <div className="panel space-y-6 p-5 sm:p-7">
              {(["r", "g", "b"] as const).map((channel) => (
                <div key={channel} className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor={`rgb-${channel}`} className="text-base">
                      {channel === "r" ? "Red" : channel === "g" ? "Green" : "Blue"}
                    </Label>
                    <Input
                      id={`rgb-${channel}`}
                      type="number"
                      min={0}
                      max={255}
                      value={rgb[channel]}
                      onChange={(event) =>
                        setRgb({ ...rgb, [channel]: clamp255(Number(event.target.value)) })
                      }
                      className="h-14 w-24 text-center text-lg"
                    />
                  </div>
                  <Slider
                    value={[rgb[channel]]}
                    min={0}
                    max={255}
                    step={1}
                    onValueChange={([value]) => setRgb({ ...rgb, [channel]: value })}
                  />
                </div>
              ))}
              <ColorSwatch hex={rgbToHex(rgb)} caption={rgbToHex(rgb)} />
              <Button
                type="button"
                size="lg"
                className="h-16 w-full text-lg"
                onClick={() => setSubmitted(rgb)}
              >
                Find my paint color
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="photo" className="mt-6">
            <div className="panel p-5 sm:p-7">
              <PhotoPicker onPicked={setSubmitted} />
            </div>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLoading
            ? "Loading the Sunburst color catalog…"
            : error
              ? "We couldn't load the color catalog. Please try again."
              : `Comparing against ${colors.length} Sunburst colors.`}
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-4 border-t border-border py-8 text-center text-sm text-muted-foreground">
      <p>Sunburst Paints &amp; Coatings Ltd · Nassau, Bahamas</p>
      <p className="mt-2">
        <a
          href="https://sunburstbahamas.com"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-accent underline"
        >
          sunburstbahamas.com
        </a>
        <span className="mx-2">·</span>
        <Link to="/import" className="underline">
          Staff color import
        </Link>
      </p>
    </footer>
  );
}
