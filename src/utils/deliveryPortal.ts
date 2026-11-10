export const DELIVERY_RESTAURANTS: Record<string, { id: string; name: string }> = {
  chateaurenard: { id: "11111111-1111-1111-1111-111111111111", name: "Châteaurenard" },
  "saint-martin-de-crau": { id: "22222222-2222-2222-2222-222222222222", name: "Saint-Martin-de-Crau" },
};

export const deliverySlugForRestaurant = (restaurantId?: string | null) =>
  Object.entries(DELIVERY_RESTAURANTS).find(([, r]) => r.id === restaurantId)?.[0];

export const SESSION_DURATION_MS = 5 * 60 * 60 * 1000;

export interface StoredDeliverySession {
  token: string;
  expiresAt: string;
  label: string;
}

const storageKey = (slug: string) => `sushieats-delivery-session-${slug}`;

export const isSessionValid = (s: StoredDeliverySession | null, now = Date.now()) =>
  !!s && !!s.token && new Date(s.expiresAt).getTime() > now;

export const loadDeliverySession = (slug: string): StoredDeliverySession | null => {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    const parsed = raw ? (JSON.parse(raw) as StoredDeliverySession) : null;
    if (!isSessionValid(parsed)) {
      localStorage.removeItem(storageKey(slug));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const saveDeliverySession = (slug: string, s: StoredDeliverySession) =>
  localStorage.setItem(storageKey(slug), JSON.stringify(s));

export const clearDeliverySession = (slug: string) => localStorage.removeItem(storageKey(slug));

const NAMED_MARKERS = /\b(residence|resid|logement|interphone|digicode|batiment|domaine|lotissement|chez)\b/;
const NUMBERED_MARKERS = /\b(n\s?°|no|num|appt?|apart|appartement|appart|bat|bloc|etage|esc|escalier|porte|code|bp|boite)\b\.?\s*[°n]?\s*[0-9a-z]{1,5}\b/;
const STREET_TYPE = /\b(rue|avenue|av|bd|boulevard|chemin|impasse|allee|allees|route|place|quai|traverse|cours|voie|montee|lieu[- ]?dit|hameau|clos|square|passage|sentier|chum)\b/;
const stripAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const cleanStreet = (rawStreet: string): string => {
  const street = (rawStreet || "").trim();
  if (!street) return "";
  const haystack = stripAccents(street.toLowerCase());
  let cutIndex = -1;
  for (const regex of [NAMED_MARKERS, NUMBERED_MARKERS]) {
    const m = haystack.match(regex);
    if (m && m.index !== undefined && m.index > 2 && (cutIndex === -1 || m.index < cutIndex)) cutIndex = m.index;
  }
  if (cutIndex === -1) return street;
  const result = street.slice(0, cutIndex).replace(/[\s,;.\-–]+$/g, "").trim();
  const kept = stripAccents(result.toLowerCase());
  const lastWord = kept.split(/[\s,]+/).filter(Boolean).pop() || "";
  if (result.length < 5 || !STREET_TYPE.test(kept) || /^(de|du|des|la|le|les|l|d|au|aux|et)$/.test(lastWord)) return street;
  return result;
};

export const buildNavAddress = (street?: string, postalCode?: string, city?: string) =>
  [cleanStreet(street || ""), [postalCode, city].filter(Boolean).join(" ").trim(), "France"].filter(Boolean).join(", ");
