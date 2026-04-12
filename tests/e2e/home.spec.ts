import { test, expect } from '@playwright/test';

test('visiting / shows the branded home shell and sign-in call to action', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'qrstorage_forgeflow' }),
  ).toBeVisible();
  await expect(page.getByText('Track storage boxes without opening every lid.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
});
