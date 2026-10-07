import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { WeatherSnapshot } from '@tripsync/types';

export function validCoordinates(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && Number.isFinite(lat) && Math.abs(lat) <= 90 &&
    typeof lng === 'number' && Number.isFinite(lng) && Math.abs(lng) <= 180;
}

@Injectable()
export class LocationWeatherService {
  private locations = new Map<string, { latitude: number; longitude: number; name: string }>();
  private pending = new Map<string, Promise<{ latitude: number; longitude: number; name: string }>>();
  private regionQueue: Promise<void> = Promise.resolve();
  private nextRegionRequestAt = 0;

  async resolve(trip: { destination: string; destinationLat?: number; destinationLng?: number }) {
    if (validCoordinates(trip.destinationLat, trip.destinationLng)) {
      return { latitude: trip.destinationLat, longitude: trip.destinationLng, name: trip.destination };
    }
    if (this.locations.has(trip.destination)) return this.locations.get(trip.destination);
    if (this.pending.has(trip.destination)) return this.pending.get(trip.destination);
    const lookup = this.lookup(trip).finally(() => this.pending.delete(trip.destination));
    this.pending.set(trip.destination, lookup);
    return lookup;
  }

  private async lookup(trip: { destination: string }) {
    try {
    const parts = trip.destination.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(parts[0])}&count=10&language=en&format=json`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Geocoding unavailable');
    const data = await response.json();
    const candidates = (data.results || []).filter((r: any) => validCoordinates(r.latitude, r.longitude));
    const scored = candidates.map((r: any) => ({ r, score: parts.slice(1).reduce((n, p) => n + ([r.country, r.admin1, r.admin2, r.country_code].some(v => v?.toLowerCase() === p) ? 1 : 0), 0) })).sort((a: any, b: any) => b.score - a.score);
    if (!scored.length || (scored.length > 1 && scored[0].score === scored[1].score)) throw new Error('Ambiguous destination');
    if (parts.length > 1 && scored[0].score === 0) throw new Error('Destination context does not match');
    const r = scored[0].r;
    const location = { latitude: r.latitude, longitude: r.longitude, name: [r.name, r.admin1, r.country].filter(Boolean).join(', ') };
    if (this.locations.size >= 500) this.locations.clear();
    this.locations.set(trip.destination, location);
    return location;
    } catch (primaryError) {
      try { return await this.resolveRegion(trip.destination); }
      catch { throw primaryError; }
    }
  }

  private async resolveRegion(destination: string) {
    const parts = destination.split(',').map(part => part.trim().toLowerCase()).filter(Boolean);
    const url = new URL(process.env.NOMINATIM_SEARCH_URL || 'https://nominatim.openstreetmap.org/search');
    url.search = new URLSearchParams({ q: destination, format: 'jsonv2', addressdetails: '1', limit: '5', 'accept-language': 'en' }).toString();
    const previous = this.regionQueue;
    let release: () => void;
    this.regionQueue = new Promise<void>(resolve => { release = resolve; });
    await previous;
    let response: Response;
    try {
      const delay = this.nextRegionRequestAt - Date.now();
      if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
      this.nextRegionRequestAt = Date.now() + 1000;
      response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': `TripSync/0.1 (${process.env.WEB_URL || 'trip location lookup'})` } });
    } finally { release(); }
    if (!response.ok) throw new Error('Region lookup unavailable');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid region lookup');
    const candidates = data.filter(row => validCoordinates(Number(row.lat), Number(row.lon))).map(row => {
      const names = [row.name, row.display_name?.split(',')[0], ...Object.values(row.address || {})].filter(value => typeof value === 'string').map(value => String(value).toLowerCase());
      const contextMatches = parts.slice(1).every(part => names.includes(part));
      return { row, score: contextMatches && names.includes(parts[0]) ? 1 : 0 };
    }).filter(candidate => candidate.score > 0);
    if (candidates.length !== 1) throw new Error('Ambiguous region');
    const row = candidates[0].row;
    const location = { latitude: Number(row.lat), longitude: Number(row.lon), name: row.display_name || destination };
    if (this.locations.size >= 500) this.locations.clear();
    this.locations.set(destination, location);
    return location;
  }

  async weather(tripId: string, location: { latitude: number; longitude: number; name: string }): Promise<WeatherSnapshot> {
    const url = new URL(process.env.OPEN_METEO_FORECAST_URL || 'https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({ latitude: String(location.latitude), longitude: String(location.longitude),
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m', hourly: 'visibility', timezone: 'UTC', forecast_days: '1',
      ...(process.env.OPEN_METEO_API_KEY ? { apikey: process.env.OPEN_METEO_API_KEY } : {}) }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Weather unavailable');
    const data = await response.json();
    const c = data.current;
    if (!c || !Number.isFinite(c.temperature_2m) || !Number.isFinite(c.precipitation) || !Number.isFinite(c.weather_code)) throw new Error('Invalid weather response');
    const hour = `${c.time.slice(0, 13)}:00`;
    const index = data.hourly?.time?.indexOf(hour) ?? -1;
    const visibility = index >= 0 ? data.hourly.visibility[index] : null;
    const code = c.weather_code;
    const condition = code === 0 ? 'Clear sky' : code <= 3 ? 'Cloudy' : code === 45 || code === 48 ? 'Fog' : code >= 95 ? 'Thunderstorm' : [71,73,75,77,85,86].includes(code) ? 'Snow' : [80,81,82].includes(code) ? 'Rain showers' : 'Rain or drizzle';
    return { id: randomUUID(), tripId, ...location, locationName: location.name, temperature: c.temperature_2m,
      feelsLike: c.apparent_temperature, rainfallMm: c.precipitation, visibilityKm: Number.isFinite(visibility) ? visibility / 1000 : null,
      windSpeedKmh: c.wind_speed_10m, humidityPercent: c.relative_humidity_2m, condition, weatherCode: code,
      source: 'Open-Meteo weather model', recordedAt: new Date(`${c.time}Z`).toISOString() };
  }
}
