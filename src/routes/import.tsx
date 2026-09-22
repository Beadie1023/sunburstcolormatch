import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { hexToRgb, normalizeHex } from "@/lib/color-match";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Staff color import — Sunburst Color Match" },
      {
        name: "description",
        content:
          "Sunburst Paints staff tool for uploading the paint color catalog from a CSV file.",
      },
      { property: "og:title", content: "Staff color import — Sunburst Color Match" },
      {
        property: "og:description",
        content: "Upload the Sunburst paint color catalog from a CSV file.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ImportPage,
});

type ParsedRow = { name: string; hex: string; r: number; g: number; b: number; collection: string | null };

function parseCsv(text: string): { rows: ParsedRow[]; skipped: number } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { rows: [], skipped: 0 };

  const splitLine = (line: string) =>
    line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));

  const header = splitLine(lines[0]).map((cell) => cell.toLowerCase());
  const hasHeader = header.includes("hex") || header.includes("name");
  const columns = hasHeader ? header : ["name", "hex", "r", "g", "b", "collection"];
  const index = (candidates: string[]) =>
    columns.findIndex((column) => candidates.includes(column));

  const nameAt = index(["name", "color", "colour", "color name"]);
  const hexAt = index(["hex", "hex code", "hexcode"]);
  const rAt = index(["r", "red"]);
  const gAt = index(["g", "green"]);
  const bAt = index(["b", "blue"]);
  const collectionAt = index(["collection", "family", "group"]);

  const rows: ParsedRow[] = [];
  let skipped = 0;

  for (const line of lines.slice(hasHeader ? 1 : 0)) {
    const cells = splitLine(line);
    const name = nameAt >= 0 ? cells[nameAt] : "";
    const rawHex = hexAt >= 0 ? cells[hexAt] : "";
    let hex = normalizeHex(rawHex ?? "");

    let rgb = hex ? hexToRgb(hex) : null;
    if (!rgb && rAt >= 0 && gAt >= 0 && bAt >= 0) {
      const r = Number(cells[rAt]);
      const g = Number(cells[gAt]);
      const b = Number(cells[bAt]);
      if ([r, g, b].every((v) => Number.isFinite(v))) {
        rgb = { r, g, b };
        hex =
          "#" +
          [r, g, b]
            .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase();
      }
    }

    if (!name || !hex || !rgb) {
      skipped += 1;
      continue;
    }

    rows.push({
      name,
      hex,
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      collection: collectionAt >= 0 && cells[collectionAt] ? cells[collectionAt] : null,
    });
  }

  return { rows, skipped };
}

function ImportPage() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [replaceAll, setReplaceAll] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    );
    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  async function handleSignUp() {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/import` },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Account created. Check your email to confirm, then sign in.");
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const { rows, skipped } = parseCsv(text);
      if (rows.length === 0) {
        toast.error("No usable rows found in that file.");
        return;
      }

      if (replaceAll) {
        const { error: deleteError } = await supabase
          .from("paint_colors")
          .delete()
          .not("id", "is", null);
        if (deleteError) throw deleteError;
      }

      for (let i = 0; i < rows.length; i += 500) {
        const { error } = await supabase.from("paint_colors").insert(rows.slice(i, i + 500));
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["paint_colors"] });
      toast.success(
        `Imported ${rows.length} colors${skipped ? ` (${skipped} rows skipped)` : ""}.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <BrandHeader subtitle="Staff only — upload the paint color catalog." />
      <main className="mx-auto max-w-2xl px-4 py-8">
        {!session ? (
          <form onSubmit={handleSignIn} className="panel space-y-5 p-5 sm:p-7">
            <h2 className="font-display text-xl font-semibold">Staff sign in</h2>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-14 text-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-14 text-lg"
                required
              />
            </div>
            <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={busy}>
              Sign in
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-14 w-full border-2 text-lg"
              onClick={handleSignUp}
              disabled={busy}
            >
              Create a staff account
            </Button>
          </form>
        ) : (
          <div className="panel space-y-5 p-5 sm:p-7">
            <h2 className="font-display text-xl font-semibold">Upload color catalog CSV</h2>
            <p className="text-base text-muted-foreground">
              Columns: <strong>name</strong>, <strong>hex</strong> (or r, g, b) and optional{" "}
              <strong>collection</strong>. A header row is recommended.
            </p>

            <label className="flex items-center gap-3 rounded-xl bg-muted p-4 text-base">
              <input
                type="checkbox"
                checked={replaceAll}
                onChange={(event) => setReplaceAll(event.target.checked)}
                className="size-5"
              />
              Replace the whole catalog with this file
            </label>

            <Input
              type="file"
              accept=".csv,text/csv"
              disabled={busy}
              onChange={(event) => handleFile(event.target.files?.[0])}
              className="h-14 py-3 text-base"
            />

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-14 w-full border-2 text-lg"
              onClick={() => supabase.auth.signOut()}
            >
              Sign out
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
