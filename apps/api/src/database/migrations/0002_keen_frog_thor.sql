CREATE TYPE "public"."route_status" AS ENUM('NORMAL', 'CAUTION', 'DISRUPTED', 'CLOSED', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."trail_report_category" AS ENUM('ROAD_BLOCKED', 'HEAVY_TRAFFIC', 'WATERLOGGING', 'LANDSLIDE', 'TRAIL_DAMAGED', 'POOR_VISIBILITY', 'WEATHER_ISSUE', 'UNSAFE_PASSAGE', 'ROAD_CONSTRUCTION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."trailwatch_alert_type" AS ENUM('WEATHER', 'ROAD_INCIDENT', 'TRAIL_INCIDENT', 'VISIBILITY', 'HEAVY_RAIN', 'FLOODING', 'LANDSLIDE', 'ROAD_CLOSURE', 'COMMUNITY_REPORT', 'ROUTE_CHANGE', 'ACTIVITY_IMPACT');--> statement-breakpoint
CREATE TYPE "public"."trailwatch_severity" AS ENUM('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('UNVERIFIED', 'COMMUNITY_CONFIRMED', 'MODERATOR_VERIFIED', 'OFFICIAL_SOURCE', 'EXPIRED');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'TRAILWATCH_ALERT' BEFORE 'SYSTEM';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_name" text NOT NULL,
	"sender_role" text NOT NULL,
	"content" text NOT NULL,
	"is_announcement" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "route_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"name" text NOT NULL,
	"start_lat" double precision NOT NULL,
	"start_lng" double precision NOT NULL,
	"end_lat" double precision NOT NULL,
	"end_lng" double precision NOT NULL,
	"status" "route_status" DEFAULT 'NORMAL' NOT NULL,
	"surface_type" text,
	"elevation_gain_m" double precision,
	"condition_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trail_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"route_id" uuid,
	"segment_id" uuid,
	"user_id" uuid NOT NULL,
	"category" "trail_report_category" NOT NULL,
	"severity" "trailwatch_severity" DEFAULT 'MEDIUM' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"location_name" text,
	"image_url" text,
	"verification_status" "verification_status" DEFAULT 'UNVERIFIED' NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'COMMUNITY' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trailwatch_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"route_id" uuid,
	"activity_id" uuid,
	"report_id" uuid,
	"type" "trailwatch_alert_type" NOT NULL,
	"severity" "trailwatch_severity" DEFAULT 'INFO' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"source" text DEFAULT 'TrailWatch' NOT NULL,
	"confidence" double precision DEFAULT 1 NOT NULL,
	"is_acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"acknowledged_by_id" uuid,
	"location_name" text,
	"latitude" double precision,
	"longitude" double precision,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trip_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"start_location" text NOT NULL,
	"end_location" text NOT NULL,
	"start_lat" double precision,
	"start_lng" double precision,
	"end_lat" double precision,
	"end_lng" double precision,
	"status" "route_status" DEFAULT 'NORMAL' NOT NULL,
	"distance_km" double precision,
	"estimated_duration_min" integer,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weather_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"route_id" uuid,
	"location_name" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"temperature" double precision NOT NULL,
	"feels_like" double precision,
	"rainfall_mm" double precision DEFAULT 0 NOT NULL,
	"visibility_km" double precision,
	"wind_speed_kmh" double precision DEFAULT 0 NOT NULL,
	"humidity_percent" double precision DEFAULT 50 NOT NULL,
	"condition" text NOT NULL,
	"weather_code" integer,
	"source" text DEFAULT 'Open-Meteo' NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "pin_digest" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "data" text;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "destination_lat" double precision;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "destination_lng" double precision;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_route_id_trip_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."trip_routes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trail_reports" ADD CONSTRAINT "trail_reports_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trail_reports" ADD CONSTRAINT "trail_reports_route_id_trip_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."trip_routes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trail_reports" ADD CONSTRAINT "trail_reports_segment_id_route_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."route_segments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trail_reports" ADD CONSTRAINT "trail_reports_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trailwatch_alerts" ADD CONSTRAINT "trailwatch_alerts_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trailwatch_alerts" ADD CONSTRAINT "trailwatch_alerts_route_id_trip_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."trip_routes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trailwatch_alerts" ADD CONSTRAINT "trailwatch_alerts_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trailwatch_alerts" ADD CONSTRAINT "trailwatch_alerts_report_id_trail_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."trail_reports"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trailwatch_alerts" ADD CONSTRAINT "trailwatch_alerts_acknowledged_by_id_profiles_id_fk" FOREIGN KEY ("acknowledged_by_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trip_routes" ADD CONSTRAINT "trip_routes_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "weather_snapshots" ADD CONSTRAINT "weather_snapshots_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "weather_snapshots" ADD CONSTRAINT "weather_snapshots_route_id_trip_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."trip_routes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_trip_created_idx" ON "chat_messages" USING btree ("trip_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_segments_route_idx" ON "route_segments" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trail_reports_trip_idx" ON "trail_reports" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trail_reports_route_idx" ON "trail_reports" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trail_reports_user_idx" ON "trail_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trail_reports_created_idx" ON "trail_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trailwatch_alerts_trip_idx" ON "trailwatch_alerts" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trailwatch_alerts_route_idx" ON "trailwatch_alerts" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trailwatch_alerts_activity_idx" ON "trailwatch_alerts" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trailwatch_alerts_severity_idx" ON "trailwatch_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trip_routes_trip_idx" ON "trip_routes" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trip_routes_status_idx" ON "trip_routes" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weather_snapshots_trip_idx" ON "weather_snapshots" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weather_snapshots_route_idx" ON "weather_snapshots" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weather_snapshots_recorded_idx" ON "weather_snapshots" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activities_day_sort_idx" ON "activities" USING btree ("day_id","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activities_trip_status_idx" ON "activities" USING btree ("trip_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_trip_cat_idx" ON "documents" USING btree ("trip_id","category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_user_idx" ON "documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_trip_date_idx" ON "expenses" USING btree ("trip_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_paid_by_date_idx" ON "expenses" USING btree ("paid_by_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_trip_category_idx" ON "expenses" USING btree ("trip_id","category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_read_created_idx" ON "notifications" USING btree ("user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "settlements_trip_status_idx" ON "settlements" USING btree ("trip_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "settlements_from_to_idx" ON "settlements" USING btree ("from_user_id","to_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_trip_status_idx" ON "tasks" USING btree ("trip_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_assigned_due_idx" ON "tasks" USING btree ("assigned_to_id","due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trip_members_trip_role_idx" ON "trip_members" USING btree ("trip_id","role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trip_members_user_role_idx" ON "trip_members" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trips_owner_status_idx" ON "trips" USING btree ("owner_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trips_start_date_idx" ON "trips" USING btree ("start_date");