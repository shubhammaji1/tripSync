-- ==========================================
-- TripSync Supabase RLS (Row Level Security) Policies
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if user is a member of a trip
CREATE OR REPLACE FUNCTION is_trip_member(trip_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_members.trip_id = $1 AND trip_members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Check if user is an admin or owner of a trip
CREATE OR REPLACE FUNCTION is_trip_admin(trip_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_members.trip_id = $1
      AND trip_members.user_id = $2
      AND trip_members.role IN ('OWNER', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Trips Policies
CREATE POLICY "Users can view trips they are members of or public trips"
  ON trips FOR SELECT
  TO authenticated
  USING (
    privacy = 'PUBLIC' OR
    owner_id = auth.uid() OR
    is_trip_member(id, auth.uid())
  );

CREATE POLICY "Users can create trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins or owners can update trip"
  ON trips FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() OR is_trip_admin(id, auth.uid()));

CREATE POLICY "Owners can delete trip"
  ON trips FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Trip Members Policies
CREATE POLICY "Trip members can view member list"
  ON trip_members FOR SELECT
  TO authenticated
  USING (is_trip_member(trip_id, auth.uid()) OR EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_members.trip_id AND trips.privacy = 'PUBLIC'));

CREATE POLICY "Trip admins can manage members"
  ON trip_members FOR ALL
  TO authenticated
  USING (is_trip_admin(trip_id, auth.uid()));

-- Itinerary Days & Activities Policies
CREATE POLICY "Trip members can view days and activities"
  ON trip_days FOR SELECT
  TO authenticated
  USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can view activities"
  ON activities FOR SELECT
  TO authenticated
  USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can manage activities"
  ON activities FOR ALL
  TO authenticated
  USING (is_trip_member(trip_id, auth.uid()));

-- Expenses & Settlements Policies
CREATE POLICY "Trip members can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can add expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (is_trip_member(trip_id, auth.uid()) AND paid_by_id = auth.uid());

CREATE POLICY "Payer or admin can update expense"
  ON expenses FOR UPDATE
  TO authenticated
  USING (paid_by_id = auth.uid() OR is_trip_admin(trip_id, auth.uid()));

CREATE POLICY "Trip members can view settlements"
  ON settlements FOR SELECT
  TO authenticated
  USING (is_trip_member(trip_id, auth.uid()));

-- Tasks & Emergency Contacts Policies
CREATE POLICY "Trip members can view and manage tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (is_trip_member(trip_id, auth.uid()));

CREATE POLICY "Trip members can view emergency info"
  ON emergency_contacts FOR SELECT
  TO authenticated
  USING (is_trip_member(trip_id, auth.uid()));

-- Notifications Policies
CREATE POLICY "Users can only view their own notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
