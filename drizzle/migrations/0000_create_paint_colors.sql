CREATE TABLE public.paint_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hex TEXT NOT NULL,
  r INTEGER NOT NULL,
  g INTEGER NOT NULL,
  b INTEGER NOT NULL,
  collection TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX paint_colors_collection_idx ON public.paint_colors (collection);

GRANT SELECT ON public.paint_colors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paint_colors TO authenticated;
GRANT ALL ON public.paint_colors TO service_role;

ALTER TABLE public.paint_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paint colors are publicly readable"
  ON public.paint_colors FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Signed-in staff can add paint colors"
  ON public.paint_colors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Signed-in staff can update paint colors"
  ON public.paint_colors FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Signed-in staff can delete paint colors"
  ON public.paint_colors FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO public.paint_colors (name, hex, collection, r, g, b)
SELECT v.name, v.hex, v.collection,
       ('x' || substring(v.hex from 2 for 2))::bit(8)::int,
       ('x' || substring(v.hex from 4 for 2))::bit(8)::int,
       ('x' || substring(v.hex from 6 for 2))::bit(8)::int
FROM (VALUES
  ('Bahama Cream', '#FBF3DC', 'Whites'),
  ('Conch Shell White', '#FAF7F0', 'Whites'),
  ('Cotton Sail', '#F5F5F0', 'Whites'),
  ('Limestone', '#E8E2D5', 'Whites'),
  ('Sand Dollar', '#E3D7BF', 'Neutrals'),
  ('Cable Beach Sand', '#DCC9A6', 'Neutrals'),
  ('Driftwood Grey', '#B5AFA3', 'Neutrals'),
  ('Harbour Stone', '#8E8B83', 'Neutrals'),
  ('Slate Anchor', '#5A5F66', 'Neutrals'),
  ('Paradise Aqua', '#63C7C3', 'Blues'),
  ('Cabbage Beach Blue', '#8ED3E0', 'Blues'),
  ('Exuma Turquoise', '#2FB5B0', 'Blues'),
  ('Atlantic Deep', '#14405F', 'Blues'),
  ('Sunburst Navy', '#16264B', 'Blues'),
  ('Junkanoo Pink', '#E8497F', 'Pinks'),
  ('Sunburst Pink', '#EC5C8D', 'Pinks'),
  ('Hibiscus Blush', '#F4A7B9', 'Pinks'),
  ('Flamingo Coral', '#F47B62', 'Pinks'),
  ('Goombay Gold', '#F2B531', 'Yellows'),
  ('Morning Sunburst', '#FBD86B', 'Yellows'),
  ('Key Lime', '#D7E17A', 'Greens'),
  ('Palm Frond', '#4E7A48', 'Greens'),
  ('Sea Grape Green', '#2F5D4F', 'Greens'),
  ('Casuarina Shade', '#37423A', 'Greens'),
  ('Terracotta Roof', '#B5523C', 'Reds'),
  ('Bougainvillea Red', '#C22B3C', 'Reds'),
  ('Mango Sunset', '#F08A3C', 'Oranges'),
  ('Straw Market Tan', '#CDA46A', 'Neutrals'),
  ('Charcoal Shutter', '#333A40', 'Darks'),
  ('Midnight Reef', '#1B1F2A', 'Darks')
) AS v(name, hex, collection);