const CACHE_KEY = "GJ_Weather_v1";
const CACHE_TTL_MS = 60 * 60 * 1000;

export interface WeatherResult {
  emoji: string;
  temp: number;
  city: string;
  message: string;
}

interface CacheEntry extends WeatherResult {
  cachedAt: number;
}

const CODE_MAP: Array<{ codes: number[]; emoji: string; message: string }> = [
  { codes: [0],                                    emoji: "☀️",  message: "Beautiful day ahead!" },
  { codes: [1, 2, 3],                              emoji: "⛅",  message: "A bit cloudy today" },
  { codes: [51, 53, 55, 61, 63, 65, 80, 81, 82],  emoji: "🌧️", message: "Rainy today — grab your umbrella!" },
  { codes: [71, 73, 75, 77],                       emoji: "❄️",  message: "Snowy! Wear your warm coat!" },
  { codes: [95, 96, 99],                           emoji: "⛈️", message: "Stormy — stay safe!" },
];

function mapCode(code: number): { emoji: string; message: string } {
  for (const entry of CODE_MAP) {
    if (entry.codes.includes(code)) return { emoji: entry.emoji, message: entry.message };
  }
  return { emoji: "🌤️", message: "Have a great morning!" };
}

function readCache(): WeatherResult | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null;
    return { emoji: entry.emoji, temp: entry.temp, city: entry.city, message: entry.message };
  } catch {
    return null;
  }
}

function writeCache(data: WeatherResult): void {
  try {
    const entry: CacheEntry = { ...data, cachedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — ignore
  }
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) { reject(new Error("no-geolocation")); return; }
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 60000 });
  });
}

async function fetchCityName(lat: number, lon: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return "";
    const data = await res.json();
    return data?.city || data?.locality || data?.principalSubdivision || "";
  } catch {
    clearTimeout(timer);
    return "";
  }
}

async function fetchWeatherData(lat: number, lon: number): Promise<WeatherResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const cw = data?.current_weather;
    if (!cw || typeof cw.temperature !== "number" || typeof cw.weathercode !== "number") return null;
    const temp = Math.round(cw.temperature);
    const { emoji, message } = mapCode(cw.weathercode);
    const city = await fetchCityName(lat, lon);
    return { emoji, temp, city, message };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

export async function fetchWeather(): Promise<WeatherResult | null> {
  const cached = readCache();
  if (cached) return cached;

  let position: GeolocationPosition;
  try {
    position = await getPosition();
  } catch {
    return null;
  }

  const { latitude: lat, longitude: lon } = position.coords;
  const result = await fetchWeatherData(lat, lon);
  if (result) writeCache(result);
  return result;
}
