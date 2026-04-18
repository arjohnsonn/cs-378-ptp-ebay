-- Reviews tied to orders: only buyers of paid orders can review.
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT CHECK (body IS NULL OR char_length(body) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT buyer_not_seller_review CHECK (buyer_id <> seller_id)
);

CREATE INDEX idx_reviews_listing ON reviews(listing_id);
CREATE INDEX idx_reviews_seller ON reviews(seller_id);
CREATE INDEX idx_reviews_buyer ON reviews(buyer_id);

CREATE TABLE review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_review_images_review ON review_images(review_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

-- Buyer can create a review only for their own paid/shipped/delivered order.
CREATE POLICY "Buyers can create reviews on their paid orders" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = reviews.order_id
        AND orders.buyer_id = auth.uid()
        AND orders.listing_id = reviews.listing_id
        AND orders.seller_id = reviews.seller_id
        AND orders.status IN ('PAID', 'SHIPPED', 'DELIVERED')
    )
  );

CREATE POLICY "Buyers can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = buyer_id);

CREATE POLICY "Review images are viewable by everyone" ON review_images
  FOR SELECT USING (true);

CREATE POLICY "Review authors can manage their review images" ON review_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = review_images.review_id
        AND reviews.buyer_id = auth.uid()
    )
  );

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Aggregate seller rating. A VIEW avoids trigger maintenance; recompute on read.
CREATE VIEW seller_ratings AS
  SELECT
    seller_id,
    AVG(rating)::NUMERIC(3, 2) AS rating_avg,
    COUNT(*)::INTEGER AS rating_count
  FROM reviews
  GROUP BY seller_id;

GRANT SELECT ON seller_ratings TO anon, authenticated;

-- Storage bucket for review photos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view review images"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'review-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own review images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'review-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
