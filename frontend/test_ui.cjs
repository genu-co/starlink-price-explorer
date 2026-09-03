const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: require('os').homedir() + '/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome' });
  const page = await browser.newPage();
  const failed = [];
  page.on('response', (res) => {
    if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[console.error]', msg.text());
  });
  page.on('pageerror', (err) => console.log('[pageerror]', err.message));

  await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 15000 }).catch(e => console.log('[goto error]', e.message));
  await page.waitForTimeout(2000);

  console.log('--- FAILED REQUESTS ---');
  failed.forEach(f => console.log(f));

  await page.screenshot({ path: '/tmp/ui_screenshot.png', fullPage: true });
  await browser.close();
})();
