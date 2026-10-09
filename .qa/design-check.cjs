const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/user/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://localhost:3011', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(__dirname, 'desktop.png') });
    const before = await page.locator('.building-orbit').evaluate(el => getComputedStyle(el).transform);
    await page.waitForTimeout(500);
    const after = await page.locator('.building-orbit').evaluate(el => getComputedStyle(el).transform);
    console.log('Idle motion:', before !== after);
    for (const scene of [2, 3, 1]) {
      await page.getByRole('button', { name: `Сцена ${scene}`, exact: true }).click();
      await page.waitForTimeout(1200);
      console.log('Scene', scene, await page.getByRole('button', { name: `Сцена ${scene}`, exact: true }).getAttribute('aria-pressed'));
    }
    await page.locator('#services').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(__dirname, 'services.png') });
    await page.evaluate(() => document.documentElement.dataset.theme = 'light');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(__dirname, 'light.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(__dirname, 'mobile.png') });
    console.log('Mobile overflow:', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
    await page.getByRole('button', { name: 'Сцена 3', exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, 'mobile-scene3.png') });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    console.log('Reduced motion:', await page.locator('.building-orbit').evaluate(el => getComputedStyle(el).animationName));
    console.log('Runtime errors:', JSON.stringify(errors));
    if (errors.length) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
