-- Create cache table for shared dashboard data
CREATE TABLE IF NOT EXISTS public.dashboard_cache (
  id INTEGER PRIMARY KEY DEFAULT 1,
  performances JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.dashboard_cache ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read the cache (public dashboard)
CREATE POLICY "Anyone can read cache"
  ON public.dashboard_cache
  FOR SELECT
  USING (true);

-- Allow anyone to update the cache (when they click refresh)
CREATE POLICY "Anyone can update cache"
  ON public.dashboard_cache
  FOR UPDATE
  USING (true);

-- Allow anyone to insert the initial cache
CREATE POLICY "Anyone can insert cache"
  ON public.dashboard_cache
  FOR INSERT
  WITH CHECK (id = 1);

-- Insert initial empty cache row
INSERT INTO public.dashboard_cache (id, performances, summary, updated_at)
VALUES (1, '[]'::jsonb, '{}'::jsonb, now())
ON CONFLICT (id) DO NOTHING;