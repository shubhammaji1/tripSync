import { Injectable, Inject, Optional, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  TrailWatchOverview,
  TripRoute,
  RouteSegment,
  TrailReport,
  WeatherSnapshot,
  TrailWatchAlert,
  AffectedActivity,
  RouteStatus,
  TrailWatchSeverity,
  TrailWatchAlertType,
  TrailReportCategory,
  VerificationStatus,
  Profile,
} from '@tripsync/types';
import {
  CreateTrailReportInput,
  CreateTripRouteInput,
  CreateRouteSegmentInput,
} from '@tripsync/validation';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import {
  tripRoutes,
  routeSegments,
  trailReports,
  weatherSnapshots,
  trailwatchAlerts,
  trips,
  tripMembers,
  activities,
  profiles,
} from '../../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { ItineraryService } from '../itinerary/itinerary.service';
import { randomUUID } from 'crypto';
import { LocationWeatherService } from './location-weather.service';
import { SEED_TRIP_ID, SEED_USERS } from '../../database/seed';

// Utility: Haversine distance in kilometers
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class TrailWatchService {
  // In-memory collections for dev/mock mode
  private mockRoutes: Map<string, TripRoute[]> = new Map();
  private mockReports: Map<string, TrailReport[]> = new Map();
  private mockAlerts: Map<string, TrailWatchAlert[]> = new Map();
  private mockWeather: Map<string, WeatherSnapshot> = new Map();

  constructor(
    @Optional() @Inject(DRIZZLE_PROVIDER) private db?: DrizzleDB,
    @Optional() private realtimeGateway?: RealtimeGateway,
    @Optional() private itineraryService?: ItineraryService,
    @Optional() private locationWeather?: LocationWeatherService
  ) {
    if (!this.db && process.env.NODE_ENV !== 'test') throw new Error('Database persistence is required; sample data is only available in tests');
    if (!this.db) this.initMockTrailWatch();
  }

  private initMockTrailWatch() {
    const defaultRoutes: TripRoute[] = [
      {
        id: 'route-tiger-hill',
        tripId: SEED_TRIP_ID,
        name: 'Tiger Hill Sunrise Passage (Ghum to Observatory)',
        description: 'Historic mountain route to the 2,590m Tiger Hill viewpoint overlooking Kanchenjunga.',
        startLocation: 'Ghum Railway Station',
        endLocation: 'Tiger Hill Sunrise Pavilion',
        startLat: 27.0142,
        startLng: 88.2577,
        endLat: 26.9953,
        endLng: 88.2863,
        status: RouteStatus.CAUTION,
        distanceKm: 11.2,
        estimatedDurationMin: 40,
        lastCheckedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        createdAt: '2026-08-10T00:00:00Z',
        updatedAt: '2026-08-10T00:00:00Z',
        segments: [
          {
            id: 'seg-1',
            routeId: 'route-tiger-hill',
            name: 'Ghum to Senchal Lake Junction',
            startLat: 27.0142,
            startLng: 88.2577,
            endLat: 27.004,
            endLng: 88.272,
            status: RouteStatus.NORMAL,
            surfaceType: 'Paved Tarmac',
            elevationGainM: 140,
            conditionNotes: 'Smooth road, slight moisture in dawn hours.',
            createdAt: '2026-08-10T00:00:00Z',
            updatedAt: '2026-08-10T00:00:00Z',
          },
          {
            id: 'seg-2',
            routeId: 'route-tiger-hill',
            name: 'Senchal Sanctuary Ridge to Summit',
            startLat: 27.004,
            startLng: 88.272,
            endLat: 26.9953,
            endLng: 88.2863,
            status: RouteStatus.CAUTION,
            surfaceType: 'Mountain Asphalt',
            elevationGainM: 260,
            conditionNotes: 'Thick fog rolling across ridge; visibility under 80m. Keep fog lights active.',
            createdAt: '2026-08-10T00:00:00Z',
            updatedAt: '2026-08-10T00:00:00Z',
          },
        ],
      },
      {
        id: 'route-sandakphu',
        tripId: SEED_TRIP_ID,
        name: 'Manebhanjan to Sandakphu Ridge Passage',
        description: 'Challenging high-altitude border road between India and Nepal with Singalila National Park passes.',
        startLocation: 'Manebhanjan Checkpost',
        endLocation: 'Sandakphu Peak (3,636m)',
        startLat: 26.985,
        startLng: 88.132,
        endLat: 27.106,
        endLng: 88.001,
        status: RouteStatus.DISRUPTED,
        distanceKm: 31.0,
        estimatedDurationMin: 210,
        lastCheckedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        createdAt: '2026-08-10T00:00:00Z',
        updatedAt: '2026-08-10T00:00:00Z',
        segments: [
          {
            id: 'seg-3',
            routeId: 'route-sandakphu',
            name: 'Tonglu to Gairibas Steep Descent',
            startLat: 27.032,
            startLng: 88.054,
            endLat: 27.051,
            endLng: 88.031,
            status: RouteStatus.DISRUPTED,
            surfaceType: 'Cobblestone & Mud',
            elevationGainM: -420,
            conditionNotes: 'Overnight mudslide cleared partially. Single-lane 4x4 convoys only.',
            createdAt: '2026-08-10T00:00:00Z',
            updatedAt: '2026-08-10T00:00:00Z',
          },
        ],
      },
    ];

    const defaultReports: TrailReport[] = [
      {
        id: 'rep-1',
        tripId: SEED_TRIP_ID,
        routeId: 'route-tiger-hill',
        segmentId: 'seg-2',
        userId: SEED_USERS[1].id,
        user: SEED_USERS[1] as Profile,
        category: TrailReportCategory.POOR_VISIBILITY,
        severity: TrailWatchSeverity.HIGH,
        title: 'Heavy fog bank rolling across Senchal Ridge',
        description: 'Dense cloud bank obscuring viewpoints above 2,200m. Speed limit restricted to 20 km/h.',
        latitude: 27.008,
        longitude: 88.271,
        locationName: 'Senchal Forest Ridge, Darjeeling',
        verificationStatus: VerificationStatus.COMMUNITY_CONFIRMED,
        upvotes: 8,
        source: 'Traveler Report',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
      },
      {
        id: 'rep-2',
        tripId: SEED_TRIP_ID,
        routeId: 'route-sandakphu',
        segmentId: 'seg-3',
        userId: SEED_USERS[2].id,
        user: SEED_USERS[2] as Profile,
        category: TrailReportCategory.LANDSLIDE,
        severity: TrailWatchSeverity.MEDIUM,
        title: 'Gravel clearing on Gairibas hairpin bend',
        description: 'Local road crew is clearing small rocks. Expect 15-20 min delays for private jeeps.',
        latitude: 27.042,
        longitude: 88.042,
        locationName: 'Gairibas Hairpin',
        verificationStatus: VerificationStatus.COMMUNITY_CONFIRMED,
        upvotes: 4,
        source: 'Local Driver Alert',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ];

    const defaultAlerts: TrailWatchAlert[] = [
      {
        id: 'alert-1',
        tripId: SEED_TRIP_ID,
        routeId: 'route-tiger-hill',
        activityId: 'act-3', // Matches Tiger Hill Early Morning Sunrise in ItineraryService
        reportId: 'rep-1',
        type: TrailWatchAlertType.VISIBILITY,
        severity: TrailWatchSeverity.HIGH,
        title: 'Reduced Visibility at Tiger Hill Sunrise Point',
        description: 'Dense mountain cloud cover and 1.2 km visibility reported. Early morning panoramic sunrise view of Kanchenjunga may be significantly obscured.',
        source: 'TrailWatch Weather + Field Reports',
        confidence: 0.94,
        isAcknowledged: false,
        locationName: 'Tiger Hill Observatory',
        latitude: 26.9953,
        longitude: 88.2863,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 14).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
      {
        id: 'alert-2',
        tripId: SEED_TRIP_ID,
        routeId: 'route-sandakphu',
        reportId: 'rep-2',
        type: TrailWatchAlertType.ROAD_INCIDENT,
        severity: TrailWatchSeverity.MEDIUM,
        title: 'Single-Lane Traffic at Tonglu-Gairibas Ridge',
        description: 'Rock clearance work on steep descent. 4x4 jeeps operating with cautious spacing.',
        source: 'Community Road Watch',
        confidence: 0.88,
        isAcknowledged: false,
        locationName: 'Tonglu-Gairibas Passage',
        latitude: 27.042,
        longitude: 88.042,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      },
    ];

    const defaultWeather: WeatherSnapshot = {
      id: 'weather-tiger-hill',
      tripId: SEED_TRIP_ID,
      routeId: 'route-tiger-hill',
      locationName: 'Tiger Hill, Darjeeling',
      latitude: 26.9953,
      longitude: 88.2863,
      temperature: 11.2,
      feelsLike: 9.6,
      rainfallMm: 6.4,
      visibilityKm: 1.2,
      windSpeedKmh: 22,
      humidityPercent: 89,
      condition: 'Dense Fog with Light Mountain Mist',
      weatherCode: 45,
      source: 'Open-Meteo High-Resolution Alpine Station',
      recordedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    };

    this.mockRoutes.set(SEED_TRIP_ID, defaultRoutes);
    this.mockReports.set(SEED_TRIP_ID, defaultReports);
    this.mockAlerts.set(SEED_TRIP_ID, defaultAlerts);
    this.mockWeather.set(SEED_TRIP_ID, defaultWeather);
  }

  /**
   * Evaluates which planned activities are affected by active alerts or live weather.
   * DOES NOT MUTATE ITINERARY ACTIVITIES — strictly generates contextual advisory records.
   */
  evaluateActivityImpact(
    tripId: string,
    allDays: any[],
    alerts: TrailWatchAlert[],
    weather?: WeatherSnapshot | null
  ): AffectedActivity[] {
    const affected: AffectedActivity[] = [];

    allDays.forEach((day) => {
      (day.activities || []).forEach((act: any) => {
        // 1. Direct Activity Match via Alert reference
        const directAlert = alerts.find(
          (a) => (!a.expiresAt || new Date(a.expiresAt).getTime() > Date.now()) && a.activityId === act.id
        );

        if (directAlert) {
          affected.push({
            activityId: act.id,
            activityTitle: act.title,
            dayNumber: day.dayNumber,
            dayDate: day.date,
            startTime: act.startTime,
            endTime: act.endTime,
            locationName: act.locationName,
            latitude: act.locationLat,
            longitude: act.locationLng,
            reason: directAlert.description,
            severity: directAlert.severity,
            alertId: directAlert.id,
            conditionDescription: directAlert.title,
            lastUpdated: directAlert.updatedAt,
            source: directAlert.source,
          });
          return;
        }

        // 2. Proximity-based Alert matching (within ~3 km of an active hazard)
        if (act.locationLat != null && act.locationLng != null) {
          for (const alert of alerts) {
            if ((alert.expiresAt && new Date(alert.expiresAt).getTime() <= Date.now()) || alert.latitude == null || alert.longitude == null) continue;
            const dist = getDistanceKm(
              act.locationLat,
              act.locationLng,
              alert.latitude,
              alert.longitude
            );
            if (dist <= 3.5) {
              affected.push({
                activityId: act.id,
                activityTitle: act.title,
                dayNumber: day.dayNumber,
                dayDate: day.date,
                startTime: act.startTime,
                endTime: act.endTime,
                locationName: act.locationName,
                latitude: act.locationLat,
                longitude: act.locationLng,
                reason: `Active alert ${dist.toFixed(1)} km away: ${alert.title}. ${alert.description}`,
                severity: alert.severity,
                alertId: alert.id,
                conditionDescription: alert.title,
                lastUpdated: alert.updatedAt,
                source: alert.source,
              });
              return;
            }
          }
        }

        // 3. Keyword / Weather condition matching (e.g. Sunrise + Low visibility or Rain + Outdoor)
        const titleLower = (act.title || '').toLowerCase();
        const locLower = (act.locationName || '').toLowerCase();

        if (weather && Date.now() - new Date(weather.recordedAt).getTime() < 60 * 60 * 1000 &&
            act.locationLat != null && act.locationLng != null &&
            getDistanceKm(act.locationLat, act.locationLng, weather.latitude, weather.longitude) <= 10 &&
            (!day.date || day.date === new Date(weather.recordedAt).toISOString().slice(0, 10))) {
          // Visibility-sensitive morning sunrise activities
          if (
            (titleLower.includes('sunrise') || titleLower.includes('observatory') || locLower.includes('tiger hill')) &&
            ((weather.visibilityKm !== null && weather.visibilityKm !== undefined && weather.visibilityKm < 3) ||
              weather.condition.toLowerCase().includes('fog') ||
              weather.condition.toLowerCase().includes('mist'))
          ) {
            affected.push({
              activityId: act.id,
              activityTitle: act.title,
              dayNumber: day.dayNumber,
              dayDate: day.date,
              startTime: act.startTime,
              endTime: act.endTime,
              locationName: act.locationName,
              latitude: act.locationLat,
              longitude: act.locationLng,
              reason: `Current visibility (${weather.visibilityKm || 'Low'} km) and ${weather.condition.toLowerCase()} around ${weather.locationName} may reduce panoramic views.`,
              severity: TrailWatchSeverity.HIGH,
              conditionDescription: `${weather.condition} · ${weather.temperature}°C`,
              lastUpdated: weather.recordedAt,
              source: weather.source,
            });
            return;
          }

          // Heavy rainfall impacting outdoor trek or tea garden walk
          if (
            weather.rainfallMm >= 8 &&
            (titleLower.includes('trek') || titleLower.includes('walk') || titleLower.includes('garden'))
          ) {
            affected.push({
              activityId: act.id,
              activityTitle: act.title,
              dayNumber: day.dayNumber,
              dayDate: day.date,
              startTime: act.startTime,
              endTime: act.endTime,
              locationName: act.locationName,
              latitude: act.locationLat,
              longitude: act.locationLng,
              reason: `Heavy rainfall (${weather.rainfallMm} mm) recorded near the area. Walking trails may be slick or muddy.`,
              severity: TrailWatchSeverity.MEDIUM,
              conditionDescription: `Rainfall ${weather.rainfallMm} mm · Wind ${weather.windSpeedKmh} km/h`,
              lastUpdated: weather.recordedAt,
              source: weather.source,
            });
          }
        }
      });
    });

    return affected;
  }

  /**
   * Consolidated overview for Trip Intelligence
   */
  async getOverview(tripId: string): Promise<TrailWatchOverview> {
    let tripName = 'Destination unavailable';
    let resolvedLocation = null;
    let weatherError: string | null = null;
    if (this.db) {
      const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, tripId) });
      if (!trip) throw new NotFoundException('Trip not found');
      tripName = trip.destination;
      if (this.locationWeather) {
        try { resolvedLocation = await this.locationWeather.resolve(trip); }
        catch { weatherError = 'Destination coordinates could not be resolved. Set the trip location precisely.'; }
      }
    } else if (tripId === SEED_TRIP_ID) tripName = 'Darjeeling, West Bengal, India';

    // 1. Fetch routes, alerts, reports, weather
    const [routes, rawAlerts, rawReports, cachedWeather] = await Promise.all([
      this.getRoutes(tripId),
      this.getAlerts(tripId),
      this.getReports(tripId),
      this.getLatestWeather(tripId),
    ]);

    const active = (item: any) => !item.expiresAt || new Date(item.expiresAt).getTime() > Date.now();
    const alerts = rawAlerts.filter(active);
    const reports = rawReports.filter(active);
    let weather = cachedWeather;
    if (this.db) {
      const matches = weather && resolvedLocation && getDistanceKm(weather.latitude, weather.longitude, resolvedLocation.latitude, resolvedLocation.longitude) < 5;
      if (!matches || Date.now() - new Date(weather.recordedAt).getTime() > 15 * 60 * 1000) {
        weather = null;
        if (resolvedLocation && this.locationWeather) {
          try {
            weather = await this.locationWeather.weather(tripId, resolvedLocation);
            await this.db.insert(weatherSnapshots).values({ ...weather, recordedAt: new Date(weather.recordedAt) } as any);
          } catch { weatherError = 'Current weather is unavailable. Try refreshing later.'; }
        }
      }
    }
    // 2. Fetch Itinerary to evaluate activity impact
    let days: any[] = [];
    try {
      const itinerarySvc = this.itineraryService || new ItineraryService(this.db);
      days = await itinerarySvc.getItinerary(tripId);
    } catch (err) {
      if (this.db) throw err;
      days = [];
    }

    if (this.db) {
      try {
        const trip = await this.db.query.trips.findFirst({
          where: eq(trips.id, tripId),
        });
        if (trip) tripName = trip.destination;
      } catch (err) { if (this.db) throw err; }
    }

    const affectedActivities = this.evaluateActivityImpact(tripId, days, alerts, weather);

    // Compute overall trip route health status
    let overallStatus = routes.length && routes.every(route => route.status !== RouteStatus.UNKNOWN) ? RouteStatus.NORMAL : RouteStatus.UNKNOWN;
    const hasDisrupted = routes.some((r) => r.status === RouteStatus.DISRUPTED || r.status === RouteStatus.CLOSED);
    const hasCaution = routes.some((r) => r.status === RouteStatus.CAUTION);
    const hasCriticalAlert = alerts.some(
      (a) => (a.severity === TrailWatchSeverity.CRITICAL || a.severity === TrailWatchSeverity.HIGH)
    );

    if (hasDisrupted || hasCriticalAlert) {
      overallStatus = RouteStatus.DISRUPTED;
    } else if (hasCaution || affectedActivities.length > 0) {
      overallStatus = RouteStatus.CAUTION;
    }

    return {
      tripId,
      resolvedLocation,
      weatherError,
      monitoringStatus: weather && routes.length ? 'AVAILABLE' : weather || routes.length || reports.length ? 'PARTIAL' : 'UNAVAILABLE',
      destination: tripName,
      overallStatus,
      monitoredRoutesCount: routes.length,
      activeAlertsCount: alerts.length,
      affectedActivitiesCount: affectedActivities.length,
      communityReportsCount: reports.length,
      routes,
      alerts,
      reports,
      affectedActivities,
      latestWeather: weather,
      lastRefreshedAt: new Date().toISOString(),
    };
  }

  async getRoutes(tripId: string): Promise<TripRoute[]> {
    if (this.db) {
      try {
        const rows = await this.db.query.tripRoutes.findMany({
          where: eq(tripRoutes.tripId, tripId),
          with: {
            segments: true,
          },
          orderBy: [desc(tripRoutes.createdAt)],
        });
        return rows as any;
      } catch (err) { if (this.db) throw err; }
    }

    return this.mockRoutes.get(tripId) || [];
  }

  async getAlerts(tripId: string): Promise<TrailWatchAlert[]> {
    if (this.db) {
      try {
        const rows = await this.db.query.trailwatchAlerts.findMany({
          where: eq(trailwatchAlerts.tripId, tripId),
          orderBy: [desc(trailwatchAlerts.createdAt)],
        });
        return rows as any;
      } catch (err) { if (this.db) throw err; }
    }

    return this.mockAlerts.get(tripId) || [];
  }

  async getReports(tripId: string): Promise<TrailReport[]> {
    if (this.db) {
      try {
        const rows = await this.db.query.trailReports.findMany({
          where: eq(trailReports.tripId, tripId),
          with: { user: true },
          orderBy: [desc(trailReports.createdAt)],
        });
        return rows as any;
      } catch (err) { if (this.db) throw err; }
    }

    return this.mockReports.get(tripId) || [];
  }

  async getLatestWeather(tripId: string): Promise<WeatherSnapshot | null> {
    if (this.db) {
      try {
        const row = await this.db.query.weatherSnapshots.findFirst({
          where: eq(weatherSnapshots.tripId, tripId),
          orderBy: [desc(weatherSnapshots.recordedAt)],
        });
        return row ? row as unknown as WeatherSnapshot : null;
      } catch (err) { if (this.db) throw err; }
    }

    return this.mockWeather.get(tripId) || null;
  }

  async createReport(
    tripId: string,
    userId: string,
    input: CreateTrailReportInput
  ): Promise<TrailReport> {
    if (this.db && input.routeId) {
      const route = await this.db.query.tripRoutes.findFirst({ where: and(eq(tripRoutes.id, input.routeId), eq(tripRoutes.tripId, tripId)) });
      if (!route) throw new ForbiddenException('Route is not in this trip');
    }
    if (this.db && input.segmentId) {
      const segment = await this.db.query.routeSegments.findFirst({ where: eq(routeSegments.id, input.segmentId), with: { route: true } });
      if (!segment || segment.route.tripId !== tripId || (input.routeId && segment.routeId !== input.routeId)) throw new ForbiddenException('Segment is not in this route');
    }
    let authorProfile: Profile | null = null;
    if (this.db) {
      try {
        const userRow = await this.db.query.profiles.findFirst({
          where: eq(profiles.id, userId),
        });
        if (userRow) authorProfile = userRow as unknown as Profile;
      } catch (err) { if (this.db) throw err; }
    }
    if (!authorProfile) {
      authorProfile = (SEED_USERS.find((u) => u.id === userId) as unknown as Profile) || {
        id: userId,
        email: 'traveler@tripsync.io',
        fullName: 'Fellow Traveler',
        avatarUrl: null,
        phone: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const newReport: TrailReport = {
      id: randomUUID(),
      tripId,
      routeId: input.routeId || null,
      segmentId: input.segmentId || null,
      userId,
      user: authorProfile,
      category: input.category,
      severity: input.severity,
      title: input.title,
      description: input.description,
      latitude: input.latitude,
      longitude: input.longitude,
      locationName: input.locationName || null,
      imageUrl: input.imageUrl || null,
      verificationStatus: VerificationStatus.UNVERIFIED,
      upvotes: 1,
      source: 'Community Report',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.db) {
      const result = await this.db.transaction(async tx => {
        const [report] = await tx.insert(trailReports).values({ ...newReport, user: undefined,
          expiresAt: new Date(newReport.expiresAt), createdAt: new Date(), updatedAt: new Date() } as any).returning();
        let alert = null;
        if (input.severity === TrailWatchSeverity.HIGH || input.severity === TrailWatchSeverity.CRITICAL) {
          [alert] = await tx.insert(trailwatchAlerts).values({ tripId, routeId: input.routeId, reportId: report.id,
            type: TrailWatchAlertType.COMMUNITY_REPORT, severity: input.severity, title: input.title, description: input.description,
            source: 'Unverified community report', confidence: 0, latitude: input.latitude, longitude: input.longitude,
            locationName: input.locationName, expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) } as any).returning();
        }
        return { report, alert };
      });
      const report = { ...result.report, user: authorProfile } as unknown as TrailReport;
      this.realtimeGateway?.broadcastTripEvent(tripId, 'trailwatch.report.created', { report });
      if (result.alert) this.realtimeGateway?.broadcastTripEvent(tripId, 'trailwatch.alert.created', { alert: result.alert });
      return report;
    }

    // Save to in-memory store
    const reports = this.mockReports.get(tripId) || [];
    reports.unshift(newReport);
    this.mockReports.set(tripId, reports);

    // If report is HIGH or CRITICAL severity, synthesize an automatic alert
    if (
      input.severity === TrailWatchSeverity.HIGH ||
      input.severity === TrailWatchSeverity.CRITICAL
    ) {
      const generatedAlert: TrailWatchAlert = {
        id: randomUUID(),
        tripId,
        routeId: input.routeId || null,
        reportId: newReport.id,
        type: TrailWatchAlertType.COMMUNITY_REPORT,
        severity: input.severity,
        title: input.title,
        description: `${input.description} (Reported by ${authorProfile.fullName || 'Traveler'})`,
        source: 'Community Field Report',
        confidence: 0.75, // unverified community report starts at 0.75 confidence
        isAcknowledged: false,
        locationName: input.locationName || null,
        latitude: input.latitude,
        longitude: input.longitude,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const alerts = this.mockAlerts.get(tripId) || [];
      alerts.unshift(generatedAlert);
      this.mockAlerts.set(tripId, alerts);

      if (this.db) {
        try {
          await this.db.insert(trailwatchAlerts).values({ ...generatedAlert, createdAt: new Date(), updatedAt: new Date(), expiresAt: new Date(generatedAlert.expiresAt) } as any);
        } catch (err) { if (this.db) throw err; }
      }

      // Broadcast new alert event
      if (this.realtimeGateway) {
        this.realtimeGateway.broadcastTripEvent(tripId, 'trailwatch.alert.created', {
          alert: generatedAlert,
        });
      }
    }

    // Broadcast realtime event
    if (this.realtimeGateway) {
      this.realtimeGateway.broadcastTripEvent(tripId, 'trailwatch.report.created', {
        report: newReport,
      });
    }

    return newReport;
  }

  async createRoute(
    tripId: string,
    input: CreateTripRouteInput
  ): Promise<TripRoute> {
    const newRoute: TripRoute = {
      id: randomUUID(),
      tripId,
      name: input.name,
      description: input.description || null,
      startLocation: input.startLocation,
      endLocation: input.endLocation,
      startLat: input.startLat ?? null,
      startLng: input.startLng ?? null,
      endLat: input.endLat ?? null,
      endLng: input.endLng ?? null,
      status: input.status || RouteStatus.UNKNOWN,
      distanceKm: input.distanceKm || null,
      estimatedDurationMin: input.estimatedDurationMin || null,
      lastCheckedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      segments: [],
    };

    if (this.db) {
      try {
        const [inserted] = await (this.db
          .insert(tripRoutes)
          .values({
            tripId,
            ...input,
            status: input.status || RouteStatus.UNKNOWN,
          } as any) as any)
          .returning();
        Object.assign(newRoute, inserted, { segments: [] });
      } catch (err) { if (this.db) throw err; }
    }

    const routes = this.mockRoutes.get(tripId) || [];
    routes.push(newRoute);
    this.mockRoutes.set(tripId, routes);

    if (this.realtimeGateway) {
      this.realtimeGateway.broadcastTripEvent(tripId, 'trailwatch.route.created', {
        route: newRoute,
      });
    }

    return newRoute;
  }

  async acknowledgeAlert(
    tripId: string,
    alertId: string,
    userId: string
  ): Promise<TrailWatchAlert> {
    const now = new Date();
    if (this.db) {
      const [target] = await this.db.update(trailwatchAlerts).set({ isAcknowledged: true, acknowledgedAt: now, acknowledgedById: userId, updatedAt: now } as any)
        .where(and(eq(trailwatchAlerts.id, alertId), eq(trailwatchAlerts.tripId, tripId))).returning();
      if (!target) throw new NotFoundException('Alert not found in this trip');
      this.realtimeGateway?.broadcastTripEvent(tripId, 'trailwatch.alert.acknowledged', { alertId, userId });
      return target as unknown as TrailWatchAlert;
    }
    const target = (this.mockAlerts.get(tripId) || []).find(a => a.id === alertId);
    if (!target) throw new NotFoundException('Alert not found');
    target.isAcknowledged = true;
    target.acknowledgedById = userId;
    target.acknowledgedAt = now.toISOString();
    return target;
  }
}
