import fs from 'fs';
import path from 'path';
import StarlinkTable from '../components/StarlinkTable';

export async function generateMetadata() {
  const isAfricaList = ["Nigeria", "Kenya", "Cameroon", "Benin", "Rwanda", "Zambia", "Malawi"];
  const countriesPath = path.join(process.cwd(), 'public', 'starlink.countries.json');
  
  let countriesText = "";
  try {
    const countries = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));
    countriesText = countries.slice(0, 10).map(c => c.name).join(", ");
  } catch (e) {}

  return {
    title: "Starlink Price Explorer | Roaming Rates for Africa & World",
    description: `Compare Starlink prices and roaming rates for ${isAfricaList.join(", ")} and ${countriesText}. Best deals for regional and global roaming in unsupported countries.`,
    keywords: ["starlink prices", "global roaming", "roaming africa", "starlink nigeria", "starlink cameroon", "starlink kenya", "satellite internet comparison"].join(", ")
  };
}

export default async function Page() {
  // Read local data at build time for SSG
  let initialData = null;
  try {
    const pricesPath = path.join(process.cwd(), 'public', 'starlink.landing-prices.json');
    const metaPath = path.join(process.cwd(), 'public', 'metadata.json');
    
    const prices = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    
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
