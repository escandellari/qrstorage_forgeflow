import { test, expect } from '@playwright/test';

test('a signed-out invite recipient signs in, accepts the invite, and lands in the workspace', async ({
  page,
}) => {
  let createdMembershipRequestBody = '';

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
          created_at: '2026-04-20T10:00:00.000Z',
        },
      }),
    });
  });

  await page.route('**/rest/v1/workspace_invites**', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            token: 'invite-token',
            workspace_id: 'workspace-1',
            invited_email: 'alex@example.com',
            expires_at: '2099-04-20T12:00:00.000Z',
            accepted_at: '2026-04-20T12:00:00.000Z',
          },
        ]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          token: 'invite-token',
          workspace_id: 'workspace-1',
          invited_email: 'alex@example.com',
          expires_at: '2099-04-20T12:00:00.000Z',
          accepted_at: null,
        },
      ]),
    });
  });

  await page.route('**/rest/v1/workspace_memberships**', async (route) => {
    if (route.request().method() === 'POST') {
      createdMembershipRequestBody = route.request().postData() ?? '';
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          workspace_id: 'workspace-1',
          user_id: 'user-1',
          role: 'member',
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ workspace_id: 'workspace-1' }]),
    });
  });

  await page.route('**/rest/v1/boxes**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/invites/invite-token');

  await expect(page.getByRole('heading', { name: 'Sign in to accept your invite' })).toBeVisible();

  await page.getByLabel('Email address').fill('alex@example.com');
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();

  await expect(page.getByText('Check your email')).toBeVisible();

  await page.goto('/auth/callback?code=magic-code&next=%2Finvites%2Finvite-token');

  await expect(page).toHaveURL(/\/inventory$/);
  await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
  expect(createdMembershipRequestBody).toContain('workspace-1');
  expect(createdMembershipRequestBody).toContain('user-1');
  expect(createdMembershipRequestBody).toContain('member');
});

test('an already-accepted invite returns the recipient to the workspace without failing', async ({ page }) => {
  let membershipInsertCount = 0;

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
          created_at: '2026-04-20T10:00:00.000Z',
        },
      }),
    });
  });

  await page.route('**/rest/v1/workspace_invites**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          token: 'accepted-token',
          workspace_id: 'workspace-1',
          invited_email: 'alex@example.com',
          expires_at: '2099-04-20T12:00:00.000Z',
          accepted_at: '2026-04-20T12:00:00.000Z',
        },
      ]),
    });
  });

  await page.route('**/rest/v1/workspace_memberships**', async (route) => {
    if (route.request().method() === 'POST') {
      membershipInsertCount += 1;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          workspace_id: 'workspace-1',
          user_id: 'user-1',
          role: 'member',
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ workspace_id: 'workspace-1' }]),
    });
  });

  await page.route('**/rest/v1/boxes**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/invites/accepted-token');
  await page.getByLabel('Email address').fill('alex@example.com');
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
  await expect(page.getByText('Check your email')).toBeVisible();

  await page.goto('/auth/callback?code=magic-code&next=%2Finvites%2Faccepted-token');

  await expect(page).toHaveURL(/\/inventory$/);
  await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
  expect(membershipInsertCount).toBe(0);
});
