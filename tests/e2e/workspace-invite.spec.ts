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
      created_at: '2026-04-20T10:00:00.000Z',
    },
  };
}

function buildAcceptInviteResponse(status: 'accepted' | 'already-accepted') {
  return {
    status,
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function fulfillMagicLinkRequest(route: Route) {
  await fulfillJson(route, {});
}

async function fulfillCallbackExchange(route: Route) {
  await fulfillJson(route, buildSessionResponse());
}

async function fulfillEmptyBoxes(route: Route) {
  await fulfillJson(route, []);
}

async function stubCommonInviteRoutes(page: Page) {
  await page.route('**/auth/v1/otp**', async (route) => {
    await fulfillMagicLinkRequest(route);
  });

  await page.route('**/auth/v1/token**', async (route) => {
    await fulfillCallbackExchange(route);
  });

  await page.route('**/rest/v1/boxes**', async (route) => {
    await fulfillEmptyBoxes(route);
  });
}

async function stubAcceptInviteRoute(
  page: Page,
  response: ReturnType<typeof buildAcceptInviteResponse>,
  onCall?: (requestBody: string) => void,
) {
  await page.route('**/rest/v1/rpc/accept_workspace_invite', async (route) => {
    onCall?.(route.request().postData() ?? '');
    await fulfillJson(route, response);
  });
}

async function stubMembershipRoutes(page: Page) {
  await page.route('**/rest/v1/workspace_memberships**', async (route) => {
    await fulfillJson(route, [{ workspace_id: 'workspace-1' }]);
  });
}

function buildInviteCallbackUrl(token: string) {
  return `/auth/callback?code=magic-code&next=${encodeURIComponent(`/invites/${token}`)}`;
}

async function completeInviteSignIn(page: Page, token: string) {
  await page.goto(`/invites/${token}`);

  await expect(page.getByRole('heading', { name: 'Sign in to accept your invite' })).toBeVisible();

  await page.getByLabel('Email address').fill('alex@example.com');
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();

  await expect(page.getByText('Check your email')).toBeVisible();

  await page.goto(buildInviteCallbackUrl(token));
}

test('a signed-out invite recipient signs in, accepts the invite, and lands in the workspace', async ({
  page,
}) => {
  let acceptInviteRequestBody = '';

  await stubCommonInviteRoutes(page);
  await stubAcceptInviteRoute(page, buildAcceptInviteResponse('accepted'), (requestBody) => {
    acceptInviteRequestBody = requestBody;
  });
  await stubMembershipRoutes(page);

  await completeInviteSignIn(page, 'invite-token');

  await expect(page).toHaveURL(/\/inventory$/);
  await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
  expect(acceptInviteRequestBody).toContain('invite-token');
});

test('an already-accepted invite returns the recipient to the workspace without failing', async ({ page }) => {
  await stubCommonInviteRoutes(page);
  await stubAcceptInviteRoute(page, buildAcceptInviteResponse('already-accepted'));
  await stubMembershipRoutes(page);

  await completeInviteSignIn(page, 'accepted-token');

  await expect(page).toHaveURL(/\/inventory$/);
  await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
});
