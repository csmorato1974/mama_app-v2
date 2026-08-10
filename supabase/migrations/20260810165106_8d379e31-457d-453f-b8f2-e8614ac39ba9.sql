CREATE POLICY "docs_read_team" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos' AND public.is_team(auth.uid()));
CREATE POLICY "docs_insert_team" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos' AND public.can_write(auth.uid()));
CREATE POLICY "docs_update_team" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos' AND public.can_write(auth.uid()));
CREATE POLICY "docs_delete_team" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos' AND public.can_write(auth.uid()));