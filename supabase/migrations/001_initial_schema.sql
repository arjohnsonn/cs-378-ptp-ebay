-- Create custom types
CREATE TYPE listing_status AS ENUM ('DRAFT', 'ACTIVE', 'SOLD', 'ARCHIVED');
CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED');
CREATE TYPE short_target_type AS ENUM ('LISTING', 'EXTERNAL');
CREATE TYPE event_type AS ENUM ('SHORT_VIEW', 'SHORT_CLICK', 'PURCHASE_SUCCESS');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Listings table
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  status listing_status DEFAULT 'DRAFT' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Listing images table
CREATE TABLE listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Shorts table
CREATE TABLE shorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  poster_url TEXT,
  caption TEXT,
  target_type short_target_type NOT NULL,
  target_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  target_external_url TEXT,
  view_count INTEGER DEFAULT 0 NOT NULL,
  click_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_target CHECK (
    (target_type = 'LISTING' AND target_listing_id IS NOT NULL) OR
    (target_type = 'EXTERNAL' AND target_external_url IS NOT NULL)
  )
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  status order_status DEFAULT 'PENDING' NOT NULL,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Events table (analytics)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type event_type NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  short_id UUID REFERENCES shorts(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listing_images_listing ON listing_images(listing_id);
CREATE INDEX idx_shorts_creator ON shorts(creator_id);
CREATE INDEX idx_shorts_target_listing ON shorts(target_listing_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_listing ON orders(listing_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_short ON events(short_id);
CREATE INDEX idx_events_created ON events(created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE shorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Listings policies
CREATE POLICY "Active listings are viewable by everyone" ON listings
  FOR SELECT USING (status = 'ACTIVE' OR seller_id = auth.uid());

CREATE POLICY "Users can create listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own listings" ON listings
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own listings" ON listings
  FOR DELETE USING (auth.uid() = seller_id);

-- Listing images policies
CREATE POLICY "Listing images are viewable if listing is viewable" ON listing_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_images.listing_id
      AND (listings.status = 'ACTIVE' OR listings.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage images for their own listings" ON listing_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_images.listing_id
      AND listings.seller_id = auth.uid()
    )
  );

-- Shorts policies
CREATE POLICY "Shorts are viewable by everyone" ON shorts
  FOR SELECT USING (true);

CREATE POLICY "Users can create shorts" ON shorts
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own shorts" ON shorts
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own shorts" ON shorts
  FOR DELETE USING (auth.uid() = creator_id);

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create orders as buyer" ON orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Events policies (insert only, service role reads)
CREATE POLICY "Users can insert events" ON events
  FOR INSERT WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shorts_updated_at
  BEFORE UPDATE ON shorts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RPC functions for incrementing counters
CREATE OR REPLACE FUNCTION increment_short_view(short_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE shorts SET view_count = view_count + 1 WHERE id = short_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_short_click(short_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE shorts SET click_count = click_count + 1 WHERE id = short_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage buckets (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('short-videos', 'short-videos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('short-posters', 'short-posters', true);
