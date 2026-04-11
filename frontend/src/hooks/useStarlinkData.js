
import { useState, useEffect } from 'react';
import { processStarlinkJson } from '../utils/processor';
import { FALLBACK_RATES } from '../constants';

const STARLINK_URL = 'https://starlink.com/public-files/landing-prices.json';

const PROXIES = [
  { url: (target) => `https://corsproxy.io/?${target}`, type: 'RAW' },
  { url: (target) => `https://api.codetabs.com/v1/proxy?quest=${target}`, type: 'RAW' },
  { url: (target) => `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`, type: 'WRAPPED' }
];

export const useStarlinkData = () => {
  const [data, setData] = useState([]);
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState({ type: 'unknown', date: null, proxy: null });
  const [detectedLoc, setDetectedLoc] = useState(null);

  const fetchWithProxy = async () => {
    for (const proxy of PROXIES) {
      try {
        const targetUrl = proxy.url(STARLINK_URL);
        const res = await fetch(targetUrl);
        if (!res.ok) continue;

        let json;
        if (proxy.type === 'WRAPPED') {
          const wrapper = await res.json();
          json = JSON.parse(wrapper.contents);
        } else {
          json = await res.json();
        }

        if (json) return { json, proxyName: new URL(targetUrl).hostname };
      } catch (e) {
        console.warn(`Proxy failed, trying next...`);
      }
    }
    throw new Error('All proxies failed');
  };

  const fetchAll = async () => {
    setLoading(true);
    
    try {
      const geo = await fetch('https://ipapi.co/json/').then(r => r.json());
      if (geo.country_name) setDetectedLoc(geo.country_name);
    } catch(e) {}

    try {
      const r = await fetch('https://api.frankfurter.app/latest?from=USD').then(r => r.json());
      setRates({ ...r.rates, USD: 1 });
    } catch (e) {
      try {
        const r = await fetch('https://open.er-api.com/v6/latest/USD').then(r => r.json());
        setRates(r.rates);
      } catch(e2) {}
    }

    try {
      const { json, proxyName } = await fetchWithProxy();
      setData(processStarlinkJson(json));
      setDataSource({ type: 'LIVE', date: new Date().toISOString(), proxy: proxyName });
    } catch (err) {
      try {
        // Dynamic detection of the JSON location
        const isCustomDomain = window.location.hostname !== 'genu-co.github.io';
        const pathPrefix = isCustomDomain ? '' : '/starlink-price-explorer';
        const localRes = await fetch(`${pathPrefix}/starlink.landing-prices.json`);
        const localJson = await localRes.json();
        
        let archiveDate = '2025-04-10T00:00:00.000Z';
        try {
          const metaRes = await fetch(`${pathPrefix}/metadata.json`);
          const metaJson = await metaRes.json();
          if (metaJson.lastUpdated) archiveDate = metaJson.lastUpdated;
        } catch (e) {}

        setData(processStarlinkJson(localJson));
        setDataSource({ type: 'LOCAL', date: archiveDate, proxy: 'None' });
      } catch (e) {
        console.error("Static fallback failed", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return { data, rates, loading, dataSource, detectedLoc, refresh: fetchAll };
};
