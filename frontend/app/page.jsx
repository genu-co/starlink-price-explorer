import fs from 'fs';
import path from 'path';
import StarlinkTable from '../components/StarlinkTable';
import { getCountryName } from '../src/utils/processor';

export async function generateMetadata() {
  // Focus on countries where Starlink is NOT officially available or where roaming is highly requested.
  // These are ISO codes for Cameroon, Senegal, Mali, Burkina Faso, Guinea, Niger, Chad, CAR, etc.
  const targetCodes = ["CM", "SN", "ML", "BF", "GN", "NE", "TD", "CF", "CG", "CD", "TG", "BJ", "CI"];
  
  const countriesPath = path.join(process.cwd(), 'public', 'starlink.countries.json');
  
  let roamingActiveCodes = [];
  try {
    const countriesData = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));
    // Extract codes where roaming is active (from API countries/8)
    roamingActiveCodes = countriesData.content.filter(c => c.isActive).map(c => c.countryRegionCode);
  } catch (e) {
    console.error("Could not read countries.json for metadata", e);
  }

  // Find the intersection of our target countries and those where roaming sign-up is technically listed
  // Even if not officially supported, if they use regional roaming, we want to target them.
  // We will just use the targetCodes as the primary SEO driver, translated in FR/EN.
  
  const frNames = targetCodes.map(code => getCountryName(code, 'fr')).filter(n => n !== code);
  const enNames = targetCodes.map(code => getCountryName(code, 'en')).filter(n => n !== code);

  const frList = frNames.slice(0, 8).join(", ");
  const enList = enNames.slice(0, 8).join(", ");

  return {
    title: "Starlink Price Explorer | Compare Global Roaming Rates",
    description: `Compare Starlink prices and roaming rates for unsupported countries like ${enList}. Best deals for regional and global roaming. / Comparateur de prix Starlink Roaming pour ${frList}.`,
    keywords: [
      "starlink prices", "global roaming", "roaming africa", 
      "prix starlink afrique", "starlink roaming cameroun", "starlink senegal", 
      "starlink mali", "starlink burkina faso", "starlink cote d'ivoire",
      "satellite internet comparison", "starlink abonnement"
    ].join(", "),
    openGraph: {
      title: "Starlink Price Explorer | Roaming Africa & Global",
      description: `Compare Starlink prices for unsupported countries. Roaming details for ${enList}.`,
      url: "https://starlink.genu.cm",
      siteName: "Starlink Price Explorer",
      locale: "en_US",
      alternateLocales: ["fr_FR"],
      type: "website",
    }
  };
}

export default async function Page() {
  // Read local data at build time for SSG
  let initialData = null;
  try {
    const pricesPath = path.join(process.cwd(), 'public', 'starlink.landing-prices.json');
    const metaPath = path.join(process.cwd(), 'public', 'metadata.json');
    
    const prices = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
    let metadata = { lastUpdated: new Date().toISOString() };
    try {
      metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (e) {}
    
    initialData = { prices, metadata };
  } catch (error) {
    console.error("Could not read local data files during build:", error);
  }

  return (
    <main>
      <StarlinkTable initialData={initialData} />
    </main>
  );
}
