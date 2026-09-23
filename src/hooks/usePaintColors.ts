import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PaintColor } from "@/lib/color-match";

export function usePaintColors() {
  return useQuery({
    queryKey: ["paint_colors"],
    queryFn: async (): Promise<PaintColor[]> => {
      // Supabase's REST API caps a single query at a default max row count
      // (commonly 1000), regardless of how many rows actually exist in the
      // table. Page through in batches so the full catalog always loads,
      // no matter how large it grows.
      const pageSize = 1000;
      const all: PaintColor[] = [];
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from("paint_colors")
          .select("id, name, hex, r, g, b, collection")
          .order("name")
          .range(from, from + pageSize - 1);

        if (error) throw error;
        const page = (data ?? []) as PaintColor[];
        all.push(...page);

        if (page.length < pageSize) break;
        from += pageSize;
      }

      return all;
    },
  });
}
