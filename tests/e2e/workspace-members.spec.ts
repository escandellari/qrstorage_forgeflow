import { test, expect, type Route } from '@playwright/test';
import { existingBox } from './box-test-helpers';

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

test('leaving the workspace routes the current user out and revokes later inventory access', async ({
  page,
}) => {
  let membershipRequestCount = 0;
  let leaveWorkspaceRequestBody = '';

  await page.route('**/rest/v1/workspace_memberships**', async (route) => {
    membershipRequestCount += 1;

    await fulfillJson(
      route,
      membershipRequestCount === 1 ? [{ workspace_id: 'workspace-1' }] : [],
    );
  });

  await page.route('**/rest/v1/rpc/list_workspace_members**', async (route) => {
    await fulfillJson(route, [
      {
        userId: 'user-1',
        role: 'member',
        isCurrentUser: true,
      },
      {
        userId: 'user-2',
        role: 'owner',
        isCurrentUser: false,
      },
    ]);
  });

  await page.route('**/rest/v1/rpc/leave_workspace**', async (route) => {
    leaveWorkspaceRequestBody = route.request().postData() ?? '';
    await fulfillJson(route, { status: 'left' });
  });

  await page.goto('/workspace/members');

  await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();
  await expect(page.getByText('user-1')).toBeVisible();

  await page.getByRole('button', { name: 'Leave workspace' }).click();
  await page.getByRole('button', { name: 'Confirm leave workspace' }).click();

  await expect(page).toHaveURL(/\/$/);
  expect(leaveWorkspaceRequestBody).toContain('workspace-1');

  await page.goto('/inventory');

  await expect(page.getByText('We could not load your inventory. Sign in again.')).toBeVisible();
});

test('a revoked member is denied when reopening the box URL', async ({ page }) => {
  let membershipRequestCount = 0;

  await page.route('**/rest/v1/workspace_memberships**', async (route) => {
    membershipRequestCount += 1;

    await fulfillJson(
      route,
      membershipRequestCount <= 2 ? [{ workspace_id: 'workspace-1' }] : [],
    );
  });

  await page.route('**/rest/v1/boxes**', async (route) => {
    await fulfillJson(route, [existingBox]);
  });

  await page.route('**/rest/v1/items**', async (route) => {
    await fulfillJson(route, []);
  });

  await page.goto('/boxes/BOX-0001');

  await expect(page.getByRole('heading', { name: 'BOX-0001', exact: true })).toBeVisible();

  await page.goto('/boxes/BOX-0001');

  await expect(page.getByRole('heading', { name: 'Sign in to open BOX-0001' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'BOX-0001', exact: true })).not.toBeVisible();
});
