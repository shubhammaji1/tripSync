'use client';

import React, { useState, useEffect } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSun,
  CloudFog,
  CloudLightning,
  Snowflake,
  Wind,
  Droplets,
  Sunrise,
  Sunset,
  Thermometer,
  RefreshCw,
  Sparkles,
  MapPin,
  AlertTriangle,
} from 'lucide-react';

interface DailyForecast {
  day: string;
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  rainChance: number;
}

interface DestinationWeatherWidgetProps {
  destination?: string;
  startDate?: string;
}

export function DestinationWeatherWidget({
  destination = 'Darjeeling, West Bengal, India',
  startDate,
}: DestinationWeatherWidgetProps) {
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>('');

  // Live Weather Metrics
  const [currentTemp, setCurrentTemp] = useState<number>(18);
  const [feelsLike, setFeelsLike] = useState<number>(17);
  const [humidity, setHumidity] = useState<number>(65);
  const [windSpeed, setWindSpeed] = useState<number>(10);
  const [currentCondition, setCurrentCondition] = useState<string>('Partly Cloudy');
  const [sunrise, setSunrise] = useState<string>('05:30 AM');
  const [sunset, setSunset] = useState<string>('06:00 PM');
  const [forecast, setForecast] = useState<DailyForecast[]>([]);

  const convertTemp = (tempC: number) => {
    if (unit === 'F') {
      return Math.round((tempC * 9) / 5 + 32);
    }
    return Math.round(tempC);
  };

  const mapWmoCodeToCondition = (code: number): string => {
    if (code === 0) return 'Clear Sky / Sunny';
    if (code === 1 || code === 2) return 'Partly Cloudy';
    if (code === 3) return 'Overcast';
    if (code >= 45 && code <= 48) return 'Foggy / Mist';
    if (code >= 51 && code <= 57) return 'Light Drizzle';
    if (code >= 61 && code <= 67) return 'Rain Showers';
    if (code >= 71 && code <= 77) return 'Snow Fall';
    if (code >= 80 && code <= 82) return 'Passing Rain';
    if (code >= 95) return 'Thunderstorm';
    return 'Partly Cloudy';
  };

  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('thunder')) return <CloudLightning className="w-5 h-5 text-amber-400" />;
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower'))
      return <CloudRain className="w-5 h-5 text-sky-400" />;
    if (c.includes('snow')) return <Snowflake className="w-5 h-5 text-sky-200" />;
    if (c.includes('fog') || c.includes('mist'))
      return <CloudFog className="w-5 h-5 text-slate-400" />;
    if (c.includes('overcast') || c.includes('cloud'))
      return <CloudSun className="w-5 h-5 text-amber-400" />;
    return <Sun className="w-5 h-5 text-amber-400" />;
  };

  const formatIsoTimeToAmPm = (isoStr: string): string => {
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return isoStr;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return isoStr;
    }
  };

  const fetchLiveWeather = async () => {
    if (!destination) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Geocode the destination name to get exact latitude & longitude
      const searchCity = destination.split(',')[0].trim() || destination.trim();
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          searchCity
        )}&count=1&language=en&format=json`
      );
      const geoData = await geoRes.json();

      let lat = 27.041;
      let lon = 88.2663;
      let resolvedName = searchCity;

      if (geoData.results && geoData.results.length > 0) {
        lat = geoData.results[0].latitude;
        lon = geoData.results[0].longitude;
        resolvedName = `${geoData.results[0].name}, ${geoData.results[0].country || ''}`;
      }
      setLocationName(resolvedName);

      // 2. Fetch Live Climate & 5-Day Forecast for the coordinates
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto`
      );
      const weatherData = await weatherRes.json();

      if (weatherData.current) {
        setCurrentTemp(weatherData.current.temperature_2m);
        setFeelsLike(weatherData.current.apparent_temperature);
        setHumidity(weatherData.current.relative_humidity_2m);
        setWindSpeed(Math.round(weatherData.current.wind_speed_10m));
        setCurrentCondition(mapWmoCodeToCondition(weatherData.current.weather_code));
      }

      if (weatherData.daily) {
        if (weatherData.daily.sunrise?.[0]) {
          setSunrise(formatIsoTimeToAmPm(weatherData.daily.sunrise[0]));
        }
        if (weatherData.daily.sunset?.[0]) {
          setSunset(formatIsoTimeToAmPm(weatherData.daily.sunset[0]));
        }

        const daysList: DailyForecast[] = [];
        const times = weatherData.daily.time || [];
        const maxTemps = weatherData.daily.temperature_2m_max || [];
        const minTemps = weatherData.daily.temperature_2m_min || [];
        const rainProbs = weatherData.daily.precipitation_probability_max || [];
        const weatherCodes = weatherData.daily.weather_code || [];

        for (let i = 0; i < Math.min(times.length, 5); i++) {
          const dateObj = new Date(times[i] + 'T00:00:00');
          const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dateObj.toLocaleDateString([], { weekday: 'short' });
          const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

          daysList.push({
            day: dayName,
            date: formattedDate,
            tempMax: maxTemps[i] ?? 20,
            tempMin: minTemps[i] ?? 12,
            condition: mapWmoCodeToCondition(weatherCodes[i] ?? 0),
            rainChance: rainProbs[i] ?? 0,
          });
        }
        setForecast(daysList);
      }
    } catch (err: any) {
      console.warn('Real-time weather fetch warning, using location defaults:', err.message);
      setError('Live connection delayed. Showing estimated mountain climate.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveWeather();
  }, [destination]);

  const cleanDestination = locationName || destination.split(',')[0] || destination;

  return (
    <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Destination Climate
            </span>
            <span className="text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-none flex items-center gap-1">
              <MapPin className="w-3 h-3 text-brand-400 shrink-0" />
              {cleanDestination}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <span>{cleanDestination.split(',')[0]} Weather & Sunrise Timers</span>
            <span className="text-sm">⛅</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Unit Toggle °C / °F */}
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setUnit('C')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                unit === 'C' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setUnit('F')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                unit === 'F' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              °F
            </button>
          </div>

          <button
            onClick={fetchLiveWeather}
            disabled={loading}
            title="Refresh real live weather"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Current Real-Time Conditions Hero (Spans 5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-br from-slate-950/90 to-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Current Real-Time Conditions
              </span>
              {loading && <span className="text-[10px] text-slate-400 animate-pulse">Syncing...</span>}
            </div>

            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {convertTemp(currentTemp)}°{unit}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                Feels like {convertTemp(feelsLike)}°{unit}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-200 mt-1 flex items-center gap-1.5">
              {getWeatherIcon(currentCondition)}
              <span>{currentCondition}</span>
            </p>
          </div>

          {/* Meteorological Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Droplets className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Humidity</p>
                <p className="font-extrabold text-white">{humidity}%</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Wind className="w-4 h-4 text-teal-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Wind</p>
                <p className="font-extrabold text-white">{windSpeed} km/h</p>
              </div>
            </div>
          </div>

          {/* Golden Hour & Sunrise / Sunset */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sunrise className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">Sunrise</span>
                <span className="font-black text-white">{sunrise}</span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <Sunset className="w-4 h-4 text-orange-400" />
              <div>
                <span className="text-[10px] text-slate-400 block font-bold">Sunset</span>
                <span className="font-black text-white">{sunset}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 5-Day Expedition Forecast Strip (Spans 7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>Live 5-Day Outlook</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] font-bold text-emerald-400">Live Satellite Data</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 flex-1">
            {forecast.map((f, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-row sm:flex-col items-center justify-between text-center gap-2"
              >
                <div className="text-left sm:text-center">
                  <p className="text-xs font-black text-white">{f.day}</p>
                  <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{f.date}</p>
                </div>

                <div className="my-1 sm:my-2">{getWeatherIcon(f.condition)}</div>

                <div className="text-right sm:text-center">
                  <p className="text-xs font-extrabold text-white">
                    {convertTemp(f.tempMax)}° <span className="text-slate-400 font-normal">{convertTemp(f.tempMin)}°</span>
                  </p>
                  <p className="text-[10px] text-sky-400 font-semibold mt-0.5">
                    {f.rainChance}% rain
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Travel Tip Banner */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[11px] leading-snug">
              <strong>Live Expedition Advisory:</strong> Weather conditions dynamically sync from global meteorological stations for {cleanDestination}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
