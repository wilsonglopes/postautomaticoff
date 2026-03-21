-- ================================================================
-- Criar bucket de storage "post-images" via SQL
-- Execute no SQL Editor do Supabase Dashboard
-- ================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  10485760, -- 10MB em bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política: permitir leitura pública
CREATE POLICY "Leitura pública post-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

-- Política: permitir insert via service role
CREATE POLICY "Upload service role post-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-images');

-- Política: permitir delete via service role
CREATE POLICY "Delete service role post-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-images');

SELECT name, public, file_size_limit FROM storage.buckets WHERE id = 'post-images';
