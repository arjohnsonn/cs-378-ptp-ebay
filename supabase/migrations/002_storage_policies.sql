-- Create storage buckets (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('short-videos', 'short-videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('short-posters', 'short-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for listing-images bucket
CREATE POLICY "Anyone can view listing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own listing images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for short-videos bucket
CREATE POLICY "Anyone can view short videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'short-videos');

CREATE POLICY "Authenticated users can upload short videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'short-videos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own short videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'short-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for short-posters bucket
CREATE POLICY "Anyone can view short posters"
ON storage.objects FOR SELECT
USING (bucket_id = 'short-posters');

CREATE POLICY "Authenticated users can upload short posters"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'short-posters'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own short posters"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'short-posters'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
