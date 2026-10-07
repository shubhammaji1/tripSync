import { TrailWatchService } from './trailwatch.service';
import { ItineraryService } from '../itinerary/itinerary.service';
import {
  TrailWatchSeverity,
  TrailWatchAlertType,
  TrailReportCategory,
  RouteStatus,
  WeatherSnapshot,
} from '@tripsync/types';
import { SEED_TRIP_ID } from '../../database/seed';

describe('TrailWatchService - Intelligence & Impact Layer', () => {
  let service: TrailWatchService;
  let itineraryService: ItineraryService;

  beforeEach(() => {
    itineraryService = new ItineraryService();
    service = new TrailWatchService(undefined, undefined, itineraryService);
  });

  describe('getOverview', () => {
    it('should return a consolidated intelligence overview with monitored routes and alerts', async () => {
      const overview = await service.getOverview(SEED_TRIP_ID);

      expect(overview).toBeDefined();
      expect(overview.tripId).toBe(SEED_TRIP_ID);
      expect(overview.monitoredRoutesCount).toBeGreaterThanOrEqual(2);
      expect(overview.activeAlertsCount).toBeGreaterThanOrEqual(1);
      expect(overview.routes.length).toBeGreaterThanOrEqual(2);
      expect(overview.alerts.length).toBeGreaterThanOrEqual(1);
      expect(overview.reports.length).toBeGreaterThanOrEqual(2);
      expect(overview.latestWeather).toBeDefined();
      expect(overview.latestWeather?.locationName).toContain('Tiger Hill');
    });

    it('should evaluate and identify affected itinerary activities without mutating them', async () => {
      const overview = await service.getOverview(SEED_TRIP_ID);

      // Tiger Hill activity should be flagged due to low visibility
      const tigerHillImpact = overview.affectedActivities.find(
        (a) => a.activityId === 'act-3' || a.activityTitle.includes('Tiger Hill')
      );

      expect(tigerHillImpact).toBeDefined();
      expect(tigerHillImpact?.severity).toBe(TrailWatchSeverity.HIGH);
      expect(tigerHillImpact?.conditionDescription).toBeDefined();
    });
  });

  describe('evaluateActivityImpact', () => {
    it('should detect proximity to an active hazard', () => {
      const mockDays = [
        {
          id: 'day-1',
          dayNumber: 1,
          date: '2026-09-10',
          activities: [
            {
              id: 'act-near-ridge',
              title: 'Senchal Lake Nature Walk',
              locationLat: 27.006,
              locationLng: 88.273,
            },
            {
              id: 'act-far-away',
              title: 'Siliguri Transit Point',
              locationLat: 26.727,
              locationLng: 88.395,
            },
          ],
        },
      ];

      const mockAlerts = [
        {
          id: 'alert-ridge',
          tripId: SEED_TRIP_ID,
          type: TrailWatchAlertType.VISIBILITY,
          severity: TrailWatchSeverity.HIGH,
          title: 'Heavy Fog on Senchal Ridge',
          description: 'Visibility under 100m.',
          source: 'Field Unit',
          confidence: 0.9,
          isAcknowledged: false,
          latitude: 27.004,
          longitude: 88.272,
          createdAt: '',
          updatedAt: '',
        },
      ];

      const affected = service.evaluateActivityImpact(
        SEED_TRIP_ID,
        mockDays,
        mockAlerts,
        null
      );

      expect(affected.length).toBe(1);
      expect(affected[0].activityId).toBe('act-near-ridge');
    });

    it('should detect weather-sensitive activities like sunrise during fog', () => {
      const mockDays = [
        {
          id: 'day-2',
          dayNumber: 2,
          date: new Date().toISOString().slice(0, 10),
          activities: [
            {
              id: 'act-sunrise',
              title: 'Mountain Sunrise Panorama',
              locationName: 'Observatory Hill',
              locationLat: 27.045,
              locationLng: 88.267,
            },
          ],
        },
      ];

      const mockWeather: WeatherSnapshot = {
        id: 'w-1',
        tripId: SEED_TRIP_ID,
        locationName: 'Observatory Hill',
        latitude: 27.045,
        longitude: 88.267,
        temperature: 10,
        rainfallMm: 2,
        visibilityKm: 1.1, // low visibility
        windSpeedKmh: 15,
        humidityPercent: 92,
        condition: 'Dense Fog',
        source: 'Station',
        recordedAt: new Date().toISOString(),
      };

      const affected = service.evaluateActivityImpact(
        SEED_TRIP_ID,
        mockDays,
        [],
        mockWeather
      );

      expect(affected.length).toBe(1);
      expect(affected[0].activityId).toBe('act-sunrise');
      expect(affected[0].severity).toBe(TrailWatchSeverity.HIGH);
    });
  });

  describe('createReport', () => {
    it('should create a community report and synthesize an alert when severity is HIGH', async () => {
      const report = await service.createReport(SEED_TRIP_ID, 'user-tester-1', {
        title: 'Tree Fallen Across Old Military Road',
        description: 'Large pine branch blocking one lane after wind gusts.',
        category: TrailReportCategory.ROAD_BLOCKED,
        severity: TrailWatchSeverity.HIGH,
        latitude: 27.035,
        longitude: 88.265,
        locationName: 'Old Military Road',
      });

      expect(report).toBeDefined();
      expect(report.title).toBe('Tree Fallen Across Old Military Road');
      expect(report.category).toBe(TrailReportCategory.ROAD_BLOCKED);

      // Verify that an alert was generated
      const alerts = await service.getAlerts(SEED_TRIP_ID);
      const generated = alerts.find((a) => a.reportId === report.id);
      expect(generated).toBeDefined();
      expect(generated?.severity).toBe(TrailWatchSeverity.HIGH);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should mark an alert as acknowledged', async () => {
      const alerts = await service.getAlerts(SEED_TRIP_ID);
      const targetAlert = alerts[0];

      const ack = await service.acknowledgeAlert(
        SEED_TRIP_ID,
        targetAlert.id,
        'user-111'
      );

      expect(ack.isAcknowledged).toBe(true);
      expect(ack.acknowledgedById).toBe('user-111');
      expect(ack.acknowledgedAt).toBeDefined();
    });
  });
});
