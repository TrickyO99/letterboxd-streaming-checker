// Service names and per-country availability, sourced from the Streaming
// Availability API's /countries endpoint (https://streaming-availability.p.rapidapi.com/countries).
// Only services that API actually tracks for a given country are listed for it.

export const SERVICE_NAMES: Record<string, string> = {
  netflix: "Netflix",
  prime: "Prime Video",
  disney: "Disney+",
  hbo: "HBO Max",
  hulu: "Hulu",
  apple: "Apple TV",
  roku: "The Roku Channel",
  peacock: "Peacock",
  paramount: "Paramount+",
  starz: "Starz",
  mubi: "Mubi",
  britbox: "BritBox",
  curiosity: "Curiosity Stream",
  discovery: "Discovery+",
  plutotv: "Pluto TV",
  tubi: "Tubi",
  crunchyroll: "Crunchyroll",
  criterion: "The Criterion Channel",
  amc: "AMC+",
  zee5: "Zee5",
  iplayer: "BBC iPlayer",
  itvx: "ITVX",
  now: "Now",
  all4: "Channel 4",
  hotstar: "Hotstar",
  crave: "Crave",
  stan: "Stan",
  wow: "Wow",
  rtl: "RTL+",
  skyshowtime: "SkyShowtime",
  sonyliv: "SonyLiv",
  mejane: "meJane",
};

export const COUNTRY_SERVICES: Record<string, string[]> = {
  us: [
    "netflix", "prime", "disney", "hbo", "hulu", "apple", "roku", "peacock",
    "paramount", "starz", "mubi", "britbox", "curiosity", "discovery",
    "plutotv", "tubi", "crunchyroll", "criterion", "amc", "zee5",
  ],
  gb: [
    "netflix", "prime", "disney", "hbo", "apple", "iplayer", "itvx",
    "paramount", "mubi", "now", "all4", "curiosity", "discovery", "plutotv",
    "crunchyroll", "hotstar", "zee5",
  ],
  ca: [
    "netflix", "prime", "disney", "apple", "crave", "paramount", "mubi",
    "britbox", "curiosity", "plutotv", "tubi", "crunchyroll", "criterion",
    "amc", "hotstar", "zee5",
  ],
  au: [
    "netflix", "prime", "disney", "hbo", "apple", "stan", "paramount",
    "mubi", "britbox", "curiosity", "tubi", "crunchyroll", "amc", "zee5",
  ],
  fr: [
    "netflix", "prime", "disney", "hbo", "apple", "paramount", "mubi",
    "curiosity", "plutotv", "crunchyroll", "zee5",
  ],
  de: [
    "netflix", "prime", "disney", "hbo", "apple", "paramount", "mubi",
    "curiosity", "wow", "plutotv", "crunchyroll", "rtl", "zee5",
  ],
  es: [
    "netflix", "prime", "disney", "hbo", "apple", "mubi", "curiosity",
    "plutotv", "crunchyroll", "skyshowtime", "zee5",
  ],
  it: [
    "netflix", "prime", "disney", "hbo", "apple", "paramount", "mubi",
    "now", "curiosity", "plutotv", "crunchyroll", "zee5",
  ],
  in: [
    "netflix", "prime", "apple", "hotstar", "zee5", "sonyliv", "mubi",
    "curiosity", "crunchyroll",
  ],
  br: [
    "netflix", "prime", "disney", "hbo", "apple", "paramount", "mubi",
    "curiosity", "plutotv", "crunchyroll", "zee5",
  ],
  mx: [
    "netflix", "prime", "disney", "hbo", "apple", "paramount", "mubi",
    "curiosity", "plutotv", "tubi", "crunchyroll", "zee5",
  ],
  nl: [
    "netflix", "prime", "disney", "hbo", "apple", "mubi", "curiosity",
    "plutotv", "crunchyroll", "skyshowtime", "zee5", "mejane",
  ],
  se: [
    "netflix", "prime", "disney", "hbo", "apple", "mubi", "curiosity",
    "plutotv", "crunchyroll", "skyshowtime", "zee5",
  ],
};

export function getServicesForCountry(countryCode: string): { id: string; label: string }[] {
  const ids = COUNTRY_SERVICES[countryCode] || COUNTRY_SERVICES.us;
  return ids.map((id) => ({ id, label: SERVICE_NAMES[id] || id }));
}

export const COUNTRIES = [
  { code: "us", label: "United States" },
  { code: "gb", label: "United Kingdom" },
  { code: "ca", label: "Canada" },
  { code: "au", label: "Australia" },
  { code: "fr", label: "France" },
  { code: "de", label: "Germany" },
  { code: "es", label: "Spain" },
  { code: "it", label: "Italy" },
  { code: "in", label: "India" },
  { code: "br", label: "Brazil" },
  { code: "mx", label: "Mexico" },
  { code: "nl", label: "Netherlands" },
  { code: "se", label: "Sweden" },
] as const;
