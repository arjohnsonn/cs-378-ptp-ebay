CREATE TABLE watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, listing_id)
);

CREATE INDEX idx_watchlist_user ON watchlist_items(user_id, created_at DESC);
CREATE INDEX idx_watchlist_listing ON watchlist_items(listing_id);

ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watchlist" ON watchlist_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own watchlist" ON watchlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own watchlist" ON watchlist_items
  FOR DELETE USING (auth.uid() = user_id);
