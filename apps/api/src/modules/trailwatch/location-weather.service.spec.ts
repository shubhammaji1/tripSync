import { LocationWeatherService, validCoordinates } from './location-weather.service';
import { TrailWatchService } from './trailwatch.service';
import { TrailWatchSeverity, TrailWatchAlertType } from '@tripsync/types';

describe('Location-specific TrailWatch weather', () => {
  const original = global.fetch;
  afterEach(() => { global.fetch = original; });
  it('uses saved coordinates, including the equator and prime meridian', async () => {
    global.fetch = jest.fn();
    const location = await new LocationWeatherService().resolve({ destination: 'Saved location', destinationLat: 0, destinationLng: 0 });
    expect(location).toEqual({ latitude: 0, longitude: 0, name: 'Saved location' });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(validCoordinates(NaN, 0)).toBe(false);
    expect(validCoordinates(91, 0)).toBe(false);
  });
  it('uses country context instead of the first city with a matching name', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [
      { name: 'Cambridge', country: 'United States', latitude: 42.37, longitude: -71.1 },
      { name: 'Cambridge', country: 'United Kingdom', latitude: 52.2, longitude: 0.12 },
    ] }) });
    expect((await new LocationWeatherService().resolve({ destination: 'Cambridge, United Kingdom' })).latitude).toBe(52.2);
  });
  it('rejects ambiguous locations instead of guessing or returning Darjeeling', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [
      { name: 'Springfield', latitude: 39.7, longitude: -89.6 }, { name: 'Springfield', latitude: 44, longitude: -123 },
    ] }) });
    await expect(new LocationWeatherService().resolve({ destination: 'Springfield' })).rejects.toThrow('Ambiguous');
  });
  it('resolves Goa, India as a region when city search only finds other countries', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ name: 'Goa', country: 'Philippines', latitude: 13.7, longitude: 123.5 }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [
        { name: 'Goa', lat: '15.3004', lon: '74.0855', display_name: 'Goa, India', address: { state: 'Goa', country: 'India' } },
        { name: 'Goa', lat: '13.7', lon: '123.5', address: { country: 'Philippines' } },
      ] });
    const service = new LocationWeatherService();
    const result = await service.resolve({ destination: 'Goa, India' });
    expect(result).toEqual({ latitude: 15.3004, longitude: 74.0855, name: 'Goa, India' });
    expect(await service.resolve({ destination: 'Goa, India' })).toEqual(result);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
  it('requests the resolved location and converts visibility from metres to kilometres', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ current: {
      time: '2026-10-06T10:15', temperature_2m: 0, precipitation: 0, weather_code: 45, wind_speed_10m: 0, relative_humidity_2m: 90,
    }, hourly: { time: ['2026-10-06T10:00'], visibility: [500] } }) });
    const result = await new LocationWeatherService().weather('trip', { latitude: 35, longitude: 135, name: 'Kyoto' });
    expect(result.temperature).toBe(0);
    expect(result.visibilityKm).toBe(0.5);
    expect((global.fetch as jest.Mock).mock.calls[0][0].searchParams.get('latitude')).toBe('35');
    expect(result.recordedAt).toBe('2026-10-06T10:15:00.000Z');
  });
  it('does not apply one destination’s current weather to distant, stale or future activities', () => {
    const service = new TrailWatchService();
    const weather: any = { latitude: 35, longitude: 135, temperature: 10, condition: 'Fog', visibilityKm: 0.2, rainfallMm: 0, recordedAt: new Date().toISOString() };
    const activity = { id: 'a', title: 'Sunrise walk', locationLat: 35, locationLng: 135 };
    const today = new Date().toISOString().slice(0, 10);
    expect(service.evaluateActivityImpact('trip', [{ date: today, activities: [activity] }], [], weather)).toHaveLength(1);
    expect(service.evaluateActivityImpact('trip', [{ date: today, activities: [{ ...activity, locationLat: 0 }] }], [], weather)).toEqual([]);
    expect(service.evaluateActivityImpact('trip', [{ date: '2099-01-01', activities: [activity] }], [], weather)).toEqual([]);
    expect(service.evaluateActivityImpact('trip', [{ date: today, activities: [activity] }], [], { ...weather, recordedAt: '2020-01-01' })).toEqual([]);
  });
  it('retains an acknowledged hazard until it expires and accepts zero coordinates', () => {
    const service = new TrailWatchService();
    const activity = { id: 'a', title: 'Walk', locationLat: 0, locationLng: 0 };
    const alert: any = { id: 'alert', tripId: 'trip', type: TrailWatchAlertType.ROAD_CLOSURE, severity: TrailWatchSeverity.HIGH, title: 'Closure', description: 'Blocked road', latitude: 0, longitude: 0, isAcknowledged: true };
    expect(service.evaluateActivityImpact('trip', [{ activities: [activity] }], [alert])).toHaveLength(1);
    expect(service.evaluateActivityImpact('trip', [{ activities: [activity] }], [{ ...alert, expiresAt: '2020-01-01' }])).toEqual([]);
  });
});
