import { test, expect } from '@playwright/test';
test('failed trip loading never renders sample expenses, tasks or an editable placeholder trip', async ({ page }) => {
  await page.goto('/trip?mode=error');
  await expect(page.getByRole('heading', { name: 'Trip could not be loaded' })).toBeVisible();
  await expect(page.getByText('Trip service unavailable')).toBeVisible();
  for (const sample of ['Summit Hermon', 'Rahul Sharma', 'Your New Trip', '11600']) await expect(page.getByText(sample, { exact: false })).toHaveCount(0);
});
test('empty persisted trip shows saved details and no sample financial or task records', async ({ page }) => {
  await page.goto('/trip');
  await expect(page.getByRole('heading', { name: 'Saved Goa trip', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Expenses', exact: true }).click();
  await expect(page.getByText('Logged Expenses (0)', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  await expect(page.getByText('Download offline Google Maps', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Rahul Sharma', { exact: false })).toHaveCount(0);
});
