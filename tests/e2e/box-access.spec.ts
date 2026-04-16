import { test, expect } from '@playwright/test';
import { existingBox } from './box-test-helpers';

test('a signed-out box visitor signs in and returns to the requested box page', async ({ page }) => {
  let membershipRequestCount = 0;

  await page.route('**/rest/v1/workspace_memberships**', async (route) => {
    membershipRequestCount += 1;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body:
        membershipRequestCount === 1
          ? JSON.stringify([])
          : JSON.stringify([{ workspace_id: 'workspace-1' }]),
    });
  });

  await page.route('**/auth/v1/otp**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  await page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        expires_at: 1760000000,
        token_type: 'bearer',
        user: {
          id: 'user-1',
          email: 'alex@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2026-04-12T10:00:00.000Z',
        },
      }),
    });
  });

  await page.route('**/rest/v1/workspaces**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'workspace-1', name: 'Home Base' }),
    });
  });

  await page.route('**/rest/v1/boxes**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([existingBox]),
    });
  });

  await page.route('**/rest/v1/items**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/boxes/BOX-0001');

  await expect(page.getByRole('heading', { name: 'Sign in to open BOX-0001' })).toBeVisible();

  await page.getByLabel('Email address').fill('alex@example.com');
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();

  await expect(page.getByText('Check your email')).toBeVisible();

  await page.goto('/auth/callback?code=magic-code&next=%2Fboxes%2FBOX-0001');

  await expect(page).toHaveURL(/\/boxes\/BOX-0001$/);
  await expect(page.getByRole('heading', { name: 'BOX-0001' })).toBeVisible();
  await expect(page.getByLabel('Box name')).toHaveValue('Winter clothes');
});
