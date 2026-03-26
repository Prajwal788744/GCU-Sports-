-- Allow booking owner to also update match requests they created (for upsert to work)
DROP POLICY IF EXISTS match_requests_update_target ON public.match_requests;

CREATE POLICY match_requests_update_involved ON public.match_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Allow booking owner to delete their own match requests
CREATE POLICY match_requests_delete_owner ON public.match_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = from_user_id);
