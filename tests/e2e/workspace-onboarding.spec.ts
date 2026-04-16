import { test, expect, type Page, type Route } from '@playwright/test';

function buildSessionResponse() {
  return {
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
  };
}

async function fulfillCallbackExchange(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(buildSessionResponse()),
  });
}

async function fulfillMembershipLookup(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([]),
  });
}

async function openCallback(page: Page) {
  await page.goto('/auth/callback?code=magic-code');
}

test('opening the auth callback with a valid session exchange shows workspace creation for a first-time user', async ({
  page,
}) => {
  await page.route('**/auth/v1/token**', async (route) => {
    await fulfillCallbackExchange(route);
  });

  await page.route('**/rest/v1/workspace_memberships**', async (route) => {
    await fulfillMembershipLookup(route);
  });

  await openCallback(page);

  await expect(page.getByRole('heading', { name: 'Name your shared workspace' })).toBeVisible();
  await expect(page.getByLabel('Workspace name')).toBeVisible();
});

test('submitting the workspace name creates the owner workspace and shows the signed-in home state', async ({
  page,
}) => {
  let createdWorkspaceRequestBody = '';
  let createdMembershipRequestBody = '';

  await page.route('**/auth/v1/token**', async (route) => {
    await fulfillCallbackExchange(route);
  });

  await page.route('**/rest/v1/workspace_memberships**', async (route) => {
    if (route.request().method() === 'GET') {
      await fulfillMembershipLookup(route);
      return;
    }

    createdMembershipRequestBody = route.request().postData() ?? '';
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ workspace_id: 'workspace-1', user_id: 'user-1', role: 'owner' }),
    });
  });

  await page.route('**/rest/v1/workspaces**', async (route) => {
    createdWorkspaceRequestBody = route.request().postData() ?? '';
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'workspace-1', name: 'Home Base' }),
    });
  });

  await openCallback(page);

  await page.getByLabel('Workspace name').fill('Home Base');
  await page.getByRole('button', { name: 'Create workspace' }).click();

  await expect(page.getByRole('heading', { name: 'You are inside Home Base' })).toBeVisible();
  await expect(page.getByText('Your shared workspace is ready for boxes and members.')).toBeVisible();
  expect(createdWorkspaceRequestBody).toContain('Home Base');
  expect(createdMembershipRequestBody).toContain('workspace-1');
  expect(createdMembershipRequestBody).toContain('user-1');
  expect(createdMembershipRequestBody).toContain('owner');
});
