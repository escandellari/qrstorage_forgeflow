import { test, expect } from '@playwright/test';

test('submitting a valid email on / shows the sent-email confirmation', async ({ page }) => {
  await page.route('**/auth/v1/otp**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  await page.goto('/');

  await page.getByLabel('Email address').fill('alex@example.com');
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();

  await expect(page.getByText('Check your email')).toBeVisible();
  await expect(
    page.getByText('We sent a magic link to alex@example.com. Continue from your inbox.'),
  ).toBeVisible();
});

test('retrying after a provider failure on / reaches the sent-email confirmation', async ({ page }) => {
  let requestCount = 0;

  await page.route('**/auth/v1/otp**', async (route) => {
    requestCount += 1;

    if (requestCount === 1) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'provider failed' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  await page.goto('/');

  await page.getByLabel('Email address').fill('alex@example.com');
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();

  await expect(page.getByText('We could not send your sign-in link. Try again.')).toBeVisible();

  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();

  await expect(page.getByText('Check your email')).toBeVisible();
  await expect(
    page.getByText('We sent a magic link to alex@example.com. Continue from your inbox.'),
  ).toBeVisible();
});
