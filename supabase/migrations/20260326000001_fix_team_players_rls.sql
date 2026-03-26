-- Allow booking team captains to add players to their teams
-- This covers the case where a captain (owner or opponent) adds players
CREATE POLICY team_players_insert_by_booking_captain ON public.team_players
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM booking_teams bt
      WHERE bt.team_id = team_players.team_id
        AND bt.user_id = auth.uid()
    )
  );
