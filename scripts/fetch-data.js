
const https = require('https');
const fs = require('fs');
const path = require('path');

const URL = 'https://starlink.com/public-files/landing-prices.json';
const OUTPUT_FILE = path.join(__dirname, '../frontend/public/starlink.landing-prices.json');
const METADATA_FILE = path.join(__dirname, '../frontend/public/metadata.json');

console.log('Fetching Starlink data from:', URL);

https.get(URL, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Request Failed. Status Code: ${res.statusCode}`);
    res.resume();
    return;
  }

  res.setEncoding('utf8');
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    try {
      // Validate JSON
      JSON.parse(rawData);

      // Write data file
      fs.writeFileSync(OUTPUT_FILE, rawData);
      console.log('Data successfully saved to', OUTPUT_FILE);

      // Write metadata file
      const metadata = { lastUpdated: new Date().toISOString() };
      fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
      console.log('Metadata successfully saved to', METADATA_FILE);

    } catch (e) {
      console.error('Error parsing or saving JSON:', e.message);
      process.exit(1);
    }
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
  process.exit(1);
});
