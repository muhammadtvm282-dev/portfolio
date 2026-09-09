CREATE POLICY "admin manage media objects" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));