-- New event types for shoppable shorts analytics
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'SHORT_LISTING_VIEW';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'SHORT_LISTING_CLICK';

-- Listings pinned to a short at optional time ranges
CREATE TABLE short_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id UUID NOT NULL REFERENCES shorts(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  start_seconds NUMERIC(10, 2) CHECK (start_seconds IS NULL OR start_seconds >= 0),
  end_seconds NUMERIC(10, 2) CHECK (end_seconds IS NULL OR end_seconds >= 0),
  label TEXT CHECK (label IS NULL OR char_length(label) <= 60),
  position INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (short_id, listing_id),
  CHECK (end_seconds IS NULL OR start_seconds IS NULL OR end_seconds > start_seconds)
);

CREATE INDEX idx_short_listings_short ON short_listings(short_id);
CREATE INDEX idx_short_listings_listing ON short_listings(listing_id);

ALTER TABLE short_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Short listings are viewable by everyone" ON short_listings
  FOR SELECT USING (true);

CREATE POLICY "Creators can manage their short listings" ON short_listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shorts
      WHERE shorts.id = short_listings.short_id
        AND shorts.creator_id = auth.uid()
    )
  );
