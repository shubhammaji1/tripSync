-- ==========================================
-- TripSync Supabase RLS Policies: TrailWatch
-- ==========================================

-- Enable RLS on all TrailWatch tables
ALTER TABLE trip_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trail_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trailwatch_alerts ENABLE ROW LEVEL SECURITY;

-- 1. Trip Routes Policies
CREATE POLICY "Trip members can view trip routes"
  ON trip_routes FOR SELECT
  TO authenticated
  USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can add or update routes"
  ON trip_routes FOR ALL
  TO authenticated
  USING (is_trip_member(trip_id, auth.uid()));

-- 2. Route Segments Policies
CREATE POLICY "Trip members can view route segments"
  ON route_segments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM trip_routes
    WHERE trip_routes.id = route_segments.route_id
      AND is_trip_member(trip_routes.trip_id, auth.uid())
  ));

CREATE POLICY "Trip members can manage route segments"
  ON route_segments FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM trip_routes
    WHERE trip_routes.id = route_segments.route_id
      AND is_trip_member(trip_routes.trip_id, auth.uid())
  ));

-- 3. Trail Reports Policies
CREATE POLICY "Trip members can view trail reports"
  ON trail_reports FOR SELECT
  TO authenticated
  USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can create trail reports"
  ON trail_reports FOR INSERT
  TO authenticated
  WITH CHECK (is_trip_member(trip_id, auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Author or admin can update trail report"
  ON trail_reports FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_trip_admin(trip_id, auth.uid()));

-- 4. Weather Snapshots Policies
CREATE POLICY "Trip members can view weather snapshots"
  ON weather_snapshots FOR SELECT
  TO authenticated
  USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can insert weather snapshots"
  ON weather_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (is_trip_member(trip_id, auth.uid()));

-- 5. TrailWatch Alerts Policies
CREATE POLICY "Trip members can view trailwatch alerts"
  ON trailwatch_alerts FOR SELECT
  TO authenticated
  USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can acknowledge alerts"
  ON trailwatch_alerts FOR UPDATE
  TO authenticated
  USING (is_trip_member(trip_id, auth.uid()));
