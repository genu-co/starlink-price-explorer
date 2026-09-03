const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: require('os').homedir() + '/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome' });
  const page = await browser.newPage();
  page.on('response', (res) => {
    const ct = res.headers()['content-type'] || '';
    if (res.url().includes('.css') || res.status() >= 400) {
      console.log(res.status(), ct, res.url());
    }
  });
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 15000 }).catch(e => console.log('[goto error]', e.message));
  await page.waitForTimeout(1500);
  await browser.close();
})();
