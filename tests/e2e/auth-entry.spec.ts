import { test, expect, type Page, type Route } from '@playwright/test';

const sentEmailCopy = 'We sent a magic link to alex@example.com. Continue from your inbox.';

async function fulfillMagicLinkRequest(route: Route, status: number) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: status === 200 ? JSON.stringify({}) : JSON.stringify({ message: 'provider failed' }),
  });
}

async function submitEmailForm(page: Page) {
  await page.goto('/');
  await page.getByLabel('Email address').fill('alex@example.com');
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
}

async function expectSentEmailConfirmation(page: Page) {
  await expect(page.getByText('Check your email')).toBeVisible();
  await expect(page.getByText(sentEmailCopy)).toBeVisible();
}

test('submitting a valid email on / shows the sent-email confirmation', async ({ page }) => {
  await page.route('**/auth/v1/otp**', async (route) => {
    await fulfillMagicLinkRequest(route, 200);
  });

  await submitEmailForm(page);

  await expectSentEmailConfirmation(page);
});

test('retrying after a provider failure on / reaches the sent-email confirmation', async ({ page }) => {
  let requestCount = 0;

  await page.route('**/auth/v1/otp**', async (route) => {
    requestCount += 1;
    await fulfillMagicLinkRequest(route, requestCount === 1 ? 500 : 200);
  });

  await submitEmailForm(page);

  await expect(page.getByText('We could not send your sign-in link. Try again.')).toBeVisible();
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();

  await expectSentEmailConfirmation(page);
});
