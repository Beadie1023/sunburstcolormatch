import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ColorSwatch } from "@/components/ColorSwatch";
import { dominantColor, rgbToHex, type Rgb } from "@/lib/color-match";

export function PhotoPicker({ onPicked }: { onPicked: (rgb: Rgb) => void }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [sampled, setSampled] = useState<Rgb | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function readPixels(): { data: Uint8ClampedArray; width: number; height: number } | null {
    const img = imageRef.current;
    if (!img || !img.naturalWidth) return null;
    const scale = Math.min(1, 600 / img.naturalWidth);
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);
    return { data: ctx.getImageData(0, 0, width, height).data, width, height };
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    setSampled(null);
    setPhotoUrl(URL.createObjectURL(file));
  }

  function handleTap(event: React.MouseEvent<HTMLImageElement>) {
    const img = imageRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    const pixels = readPixels();
    if (!pixels) return;
    const x = Math.min(pixels.width - 1, Math.max(0, Math.round(px * pixels.width)));
    const y = Math.min(pixels.height - 1, Math.max(0, Math.round(py * pixels.height)));
    const i = (y * pixels.width + x) * 4;
    setSampled({ r: pixels.data[i], g: pixels.data[i + 1], b: pixels.data[i + 2] });
  }

  function handleAutoDetect() {
    const pixels = readPixels();
    if (!pixels) return;
    setSampled(dominantColor(pixels.data));
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-base text-muted-foreground">
          Step 1 — Take a photo or choose one from your phone.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          size="lg"
          className="h-16 w-full text-lg"
          onClick={() => fileRef.current?.click()}
        >
          {photoUrl ? "Choose a different photo" : "Take or choose a photo"}
        </Button>
      </div>

      {photoUrl ? (
        <div className="space-y-4">
          <p className="text-base text-muted-foreground">
            Step 2 — Tap the exact spot on the photo you want to match, or let us find the
            main color.
          </p>
          <img
            ref={imageRef}
            src={photoUrl}
            alt="Your photo"
            onClick={handleTap}
            crossOrigin="anonymous"
            className="swatch-frame w-full cursor-crosshair object-contain"
          />
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-14 w-full border-2 text-lg"
            onClick={handleAutoDetect}
          >
            Find the main color for me
          </Button>
        </div>
      ) : null}

      {sampled ? (
        <div className="space-y-4 rounded-xl bg-muted p-4">
          <p className="text-base text-muted-foreground">
            Step 3 — Is this the color you want to match?
          </p>
          <ColorSwatch hex={rgbToHex(sampled)} caption={rgbToHex(sampled)} />
          <Button
            type="button"
            size="lg"
            className="h-14 w-full text-lg"
            onClick={() => onPicked(sampled)}
          >
            Yes, match this color
          </Button>
        </div>
      ) : null}
    </div>
  );
}
