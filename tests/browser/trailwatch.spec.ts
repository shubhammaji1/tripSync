import { test, expect } from '@playwright/test';
for (const destination of ['Goa', 'Kyoto', 'Mumbai', 'Darjeeling', 'Zero']) {
  test(`${destination}: map, route filter and trip report coordinates`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/?location=${destination}`);
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('.leaflet-overlay-pane path').first()).toHaveAttribute('stroke', '#ef4444');
    await page.getByRole('button', { name: 'Routes (1)', exact: true }).click();
    await page.getByRole('button', { name: 'Report Condition', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const coords: Record<string, string[]> = { Goa: ['15.4909','73.8278'], Kyoto: ['35.0116','135.7681'], Mumbai: ['19.076','72.8777'], Darjeeling: ['27.041','88.2663'], Zero: ['0','0'] };
    await expect(page.getByLabel('Latitude', { exact: true })).toHaveValue(coords[destination][0]);
    await expect(page.getByLabel('Longitude', { exact: true })).toHaveValue(coords[destination][1]);
    await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.screenshot({ path: `test-results/${destination}-desktop.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}
test('Goa without routes centers on Goa and shows limited monitoring on a light page', async ({ page }) => {
  await page.goto('/?location=GoaNoRoutes');
  await expect(page.getByText('Limited monitoring data')).toBeVisible();
  await expect(page.getByText('Normal Conditions', { exact: true })).toHaveCount(0);
  await expect(page.getByText('No routes submitted')).toBeVisible();
  const tile = page.locator('.leaflet-tile').first();
  await expect(tile).toHaveAttribute('src', /tile.openstreetmap.org/);
  const match = (await tile.getAttribute('src'))!.match(/\/(\d+)\/(\d+)\/(\d+)\.png/)!;
  const scale = 2 ** Number(match[1]);
  const longitude = Number(match[2]) / scale * 360 - 180;
  const latitude = Math.atan(Math.sinh(Math.PI * (1 - 2 * Number(match[3]) / scale))) * 180 / Math.PI;
  expect(longitude).toBeGreaterThan(73); expect(longitude).toBeLessThan(75);
  expect(latitude).toBeGreaterThan(14); expect(latitude).toBeLessThan(17);
  await expect(page.locator('img.leaflet-tile-loaded').first()).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: 'test-results/Goa-no-routes.png', fullPage: true });
});
test('mobile missing location shows unknown conditions without invented weather', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?location=Missing');
  await expect(page.getByText('Limited monitoring data')).toBeVisible();
  await expect(page.getByText('Destination coordinates are unavailable.', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/missing-mobile.png', fullPage: true });
});
