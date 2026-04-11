
const https = require('https');
const fs = require('fs');
const path = require('path');

const PRICES_URL = 'https://starlink.com/public-files/landing-prices.json';
const COUNTRIES_URL = 'https://starlink.com/api/webagg/v1/public/sign-up/countries/8';

const OUTPUT_PRICES = path.join(__dirname, '../frontend/public/starlink.landing-prices.json');
const OUTPUT_COUNTRIES = path.join(__dirname, '../frontend/public/starlink.countries.json');
const METADATA_FILE = path.join(__dirname, '../frontend/public/metadata.json');

async function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Request Failed. Status Code: ${res.statusCode}`));
        res.resume();
        return;
      }
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (e) => reject(e));
  });
}

async function run() {
  try {
    console.log('Fetching Starlink Prices...');
    const prices = await fetchData(PRICES_URL);
    fs.writeFileSync(OUTPUT_PRICES, JSON.stringify(prices));
    console.log('Prices saved.');

    console.log('Fetching Supported Countries...');
    const countries = await fetchData(COUNTRIES_URL);
    fs.writeFileSync(OUTPUT_COUNTRIES, JSON.stringify(countries));
    console.log('Countries saved.');

    const metadata = { 
      lastUpdated: new Date().toISOString(),
      countryCount: countries.length 
    };
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
    console.log('Metadata saved.');

  } catch (error) {
    console.error('Update failed:', error.message);
    process.exit(1);
  }
}

run();
