-- Add categories enum
CREATE TYPE listing_category AS ENUM (
  'electronics',
  'fashion',
  'home',
  'sports',
  'collectibles',
  'art',
  'books',
  'music',
  'toys',
  'other'
);

-- Add condition enum
CREATE TYPE listing_condition AS ENUM (
  'new',
  'like_new',
  'good',
  'fair',
  'poor'
);

-- Add category and condition columns to listings
ALTER TABLE listings
ADD COLUMN category listing_category DEFAULT 'other',
ADD COLUMN condition listing_condition DEFAULT 'good';

-- Create index for category filtering
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_condition ON listings(condition);

-- Update existing listings with random categories for demo
UPDATE listings SET category = 'electronics' WHERE title ILIKE '%speaker%' OR title ILIKE '%keyboard%' OR title ILIKE '%earbuds%' OR title ILIKE '%camera%';
UPDATE listings SET category = 'fashion' WHERE title ILIKE '%watch%' OR title ILIKE '%sneakers%' OR title ILIKE '%bag%';
UPDATE listings SET category = 'home' WHERE title ILIKE '%lamp%' OR title ILIKE '%mug%' OR title ILIKE '%plant%';
UPDATE listings SET category = 'music' WHERE title ILIKE '%vinyl%' OR title ILIKE '%record%';
UPDATE listings SET category = 'art' WHERE title ILIKE '%watercolor%' OR title ILIKE '%paint%';
