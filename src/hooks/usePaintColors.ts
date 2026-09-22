import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PaintColor } from "@/lib/color-match";

export function usePaintColors() {
  return useQuery({
    queryKey: ["paint_colors"],
    queryFn: async (): Promise<PaintColor[]> => {
      const { data, error } = await supabase
        .from("paint_colors")
        .select("id, name, hex, r, g, b, collection")
        .order("name");
      if (error) throw error;
      return (data ?? []) as PaintColor[];
    },
  });
}
