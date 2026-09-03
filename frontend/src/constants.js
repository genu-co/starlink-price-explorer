
export const AFRICA_CODES = [
  "NG", "RW", "KE", "MZ", "ZM", "MW", "SZ", "MG", "BJ", "TG", "ZW", "BW", 
  "GH", "ZA", "SL", "LR", "SS", "AO", "BF", "BI", "CM", "CV", "CF", "TD", 
  "KM", "CG", "CD", "DJ", "EG", "GQ", "ER", "ET", "GA", "GM", "GN", "GW", 
  "CI", "LS", "LY", "ML", "MR", "MU", "MA", "NA", "NE", "ST", "SN", "SC", 
  "SO", "SD", "TZ", "TN", "UG"
];

export const VOLATILE_CURRENCIES = ["BOB"];

export const FALLBACK_RATES = {
  "USD": 1, "XAF": 610, "EUR": 0.92, "NGN": 1500, "KES": 130, "RWF": 1280
};

export const TAX_RATES = {
  AF: 10, AL: 20, DZ: 19, AD: 4.5, AO: 14, AG: 7, AR: 21, AM: 20, AW: 4, AU: 10,
  AT: 20, AZ: 18, BS: 10, BH: 10, BD: 15, BB: 17.5, BY: 20, BE: 21, BZ: 12.5,
  BJ: 18, BT: 50, BO: 13, BA: 17, BW: 14, BR: 17, BG: 20, BF: 18, BI: 18,
  KH: 10, CM: 19.25, CA: 5, CV: 15, CF: 19, TD: 18, CL: 19, CN: 13, CO: 19,
  KM: 10, CG: 16, CR: 13, HR: 25, CU: 10, CY: 19, CZ: 21, DK: 25, DJ: 10,
  DM: 15, DO: 18, EC: 13, EG: 14, SV: 13, GQ: 15, ER: 5, EE: 24, ET: 15,
  FJ: 15, FI: 25.5, FR: 20, GA: 18, GM: 15, GE: 18, DE: 19, GH: 15, GR: 24,
  GD: 15, GU: 2, GT: 12, GN: 18, GY: 14, HT: 10, HN: 15, HU: 27, IS: 24,
  IN: 18, ID: 12, IR: 10, IE: 23, IM: 20, IL: 18, IT: 22, CI: 18, JM: 15,
  JP: 10, JO: 16, KZ: 16, KE: 16, XK: 18, KG: 12, LA: 10, LV: 21, LB: 11,
  LS: 15, LI: 8.1, LT: 21, LU: 17, MK: 18, MG: 20, MW: 16.5, MY: 10, ML: 18,
  MT: 18, MR: 16, MU: 15, MX: 16, FM: 5, MD: 20, MC: 20, MN: 10, ME: 21,
  MA: 20, MZ: 16, MM: 5, NA: 15, NP: 13, NL: 21, NZ: 15, NI: 15, NE: 19,
  NG: 7.5, KP: 15, NO: 25, OM: 5, PK: 18, PA: 7, PG: 10, PY: 10, PE: 18,
  PH: 12, PL: 23, PT: 23, RO: 19, RU: 22, RW: 18, WS: 15, SA: 15, SN: 18,
  RS: 20, SC: 15, SL: 15, SG: 9, SK: 23, SI: 22, SB: 10, SO: 10, ZA: 15,
  KR: 10, ES: 21, LK: 18, LC: 12.5, SD: 17, SR: 10, SZ: 15, SE: 25, CH: 8.1,
  TW: 5, TJ: 14, TZ: 18, TH: 7, TG: 18, TO: 15, TT: 12.5, TN: 19, TR: 20,
  TM: 15, UG: 18, UA: 20, AE: 5, GB: 20, US: 0, UY: 22, UZ: 12, VU: 15,
  VE: 16, VN: 8, ZM: 16, ZW: 15.5
};

export const TRANSLATIONS = {
  fr: {
    title: "Starlink Price Explorer",
    subtitle: "Comparateur dynamique de prix Starlink.",
    loading: "Chargement...",
    errorLoading: "Erreur de chargement.",
    archiveData: "ARCHIVES",
    liveData: "Direct",
    dataAge: "Âge",
    notUpdated: "NON MIS À JOUR",
    unreachable: "Serveur Starlink injoignable.",
    preferences: "Colonnes & Options",
    showKit: "Prix du Kit",
    currency: "Devise",
    zone: "Zone",
    africa: "Afrique",
    world: "Monde",
    country: "Pays",
    standard: "Standard",
    roamReg: "Roaming Régional",
    roamGlobal: "Roaming Global",
    roamCapped: "Roaming (Capé)",
    today: "Aujourd'hui",
    daysAgo: "Il y a {n} j.",
    noData: "Aucune donnée.",
    notOffered: "Non Offert",
    unavailable: "Indisponible",
    share: "Partager",
    copied: "Copié !",
    detectedLoc: "Position : {loc}",
    searchPlaceholder: "Rechercher...",
    tax: "Taxe",
    showTax: "Afficher la taxe",
    priceHT: "Prix HT",
    volatileCurrencyWarning: "Devise en forte volatilité — le prix affiché peut différer du prix réel actuel, vérifiez sur starlink.com"
  },
  en: {
    title: "Starlink Price Explorer",
    subtitle: "Dynamic Starlink price comparator.",
    loading: "Loading...",
    errorLoading: "Error loading data.",
    archiveData: "ARCHIVE",
    liveData: "Live",
    dataAge: "Age",
    notUpdated: "DATA NOT UPDATED",
    unreachable: "Starlink unreachable.",
    preferences: "Columns & Options",
    showKit: "Kit Price",
    currency: "Currency",
    zone: "Zone",
    africa: "Africa",
    world: "World",
    country: "Country",
    standard: "Standard",
    roamReg: "Regional Roam",
    roamGlobal: "Global Roam",
    roamCapped: "Capped Roam",
    today: "Today",
    daysAgo: "{n} days ago",
    noData: "No data found.",
    notOffered: "Not Offered",
    unavailable: "Unavailable",
    share: "Share",
    copied: "Copied!",
    detectedLoc: "Location: {loc}",
    searchPlaceholder: "Search...",
    tax: "Tax",
    showTax: "Show tax",
    priceHT: "Pre-tax price",
    volatileCurrencyWarning: "Highly volatile currency — displayed price may differ from the current real price, check on starlink.com"
  }
};
