-- Offer status enum
CREATE TYPE offer_status AS ENUM (
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'WITHDRAWN',
  'COUNTERED',
  'EXPIRED',
  'ACCEPTED_PAID'
);

CREATE TYPE offer_role AS ENUM ('BUYER', 'SELLER');

-- Add offer toggles to listings
ALTER TABLE listings
  ADD COLUMN accepts_offers BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN min_offer_cents INTEGER CHECK (min_offer_cents IS NULL OR min_offer_cents >= 0);

-- Offers table
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  from_role offer_role NOT NULL,
  status offer_status DEFAULT 'PENDING' NOT NULL,
  parent_offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  message TEXT CHECK (message IS NULL OR char_length(message) <= 500),
  expires_at TIMESTAMPTZ NOT NULL,
  stripe_checkout_session_id TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT buyer_not_seller CHECK (buyer_id <> seller_id)
);

-- Only one pending offer per (listing, buyer) thread
CREATE UNIQUE INDEX idx_offers_one_pending_per_thread
  ON offers(listing_id, buyer_id)
  WHERE status = 'PENDING';

CREATE INDEX idx_offers_listing ON offers(listing_id);
CREATE INDEX idx_offers_buyer ON offers(buyer_id);
CREATE INDEX idx_offers_seller ON offers(seller_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_parent ON offers(parent_offer_id);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Buyer or seller can view their own offers
CREATE POLICY "Offer parties can view offers" ON offers
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Buyer creates initial offer (from_role=BUYER). Seller counters are inserted via server action using service role? No — sellers call with their own auth.
-- Allow either party to INSERT as long as they are one of the parties and the from_role matches their side.
CREATE POLICY "Parties can insert offers" ON offers
  FOR INSERT WITH CHECK (
    (auth.uid() = buyer_id AND from_role = 'BUYER') OR
    (auth.uid() = seller_id AND from_role = 'SELLER')
  );

-- Either party can update the rows on their thread (status transitions are enforced in server actions)
CREATE POLICY "Parties can update offers" ON offers
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Atomically counter an offer: mark prior offer COUNTERED and insert the new pending offer in one transaction.
CREATE OR REPLACE FUNCTION counter_offer(
  p_offer_id UUID,
  p_amount_cents INTEGER,
  p_from_role offer_role,
  p_message TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS offers AS $$
DECLARE
  v_prev offers%ROWTYPE;
  v_new offers%ROWTYPE;
  v_caller UUID := auth.uid();
BEGIN
  SELECT * INTO v_prev FROM offers WHERE id = p_offer_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_prev.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Only pending offers can be countered';
  END IF;

  IF v_prev.from_role = p_from_role THEN
    RAISE EXCEPTION 'Cannot counter your own offer';
  END IF;

  IF p_from_role = 'BUYER' AND v_caller <> v_prev.buyer_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_from_role = 'SELLER' AND v_caller <> v_prev.seller_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE offers SET status = 'COUNTERED' WHERE id = p_offer_id;

  INSERT INTO offers (
    listing_id, buyer_id, seller_id, amount_cents, from_role,
    parent_offer_id, message, expires_at
  ) VALUES (
    v_prev.listing_id, v_prev.buyer_id, v_prev.seller_id, p_amount_cents, p_from_role,
    v_prev.id, p_message, p_expires_at
  )
  RETURNING * INTO v_new;

  RETURN v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accept an offer and auto-decline all other pending offers on the same listing.
CREATE OR REPLACE FUNCTION accept_offer(p_offer_id UUID)
RETURNS offers AS $$
DECLARE
  v_offer offers%ROWTYPE;
  v_caller UUID := auth.uid();
BEGIN
  SELECT * INTO v_offer FROM offers WHERE id = p_offer_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_caller <> v_offer.seller_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_offer.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Only pending offers can be accepted';
  END IF;

  UPDATE offers SET status = 'ACCEPTED' WHERE id = p_offer_id RETURNING * INTO v_offer;

  UPDATE offers
    SET status = 'DECLINED'
    WHERE listing_id = v_offer.listing_id
      AND id <> p_offer_id
      AND status = 'PENDING';

  RETURN v_offer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION counter_offer(UUID, INTEGER, offer_role, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_offer(UUID) TO authenticated;
