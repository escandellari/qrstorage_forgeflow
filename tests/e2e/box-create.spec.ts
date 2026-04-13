import { test, expect, type Route } from '@playwright/test';

test('a workspace member creates a box from /inventory and sees the generated ID in the list', async ({
  page,
}) => {
  let createRequestBody = '';

  await page.route('**/rest/v1/workspace_memberships**', async (route) => {
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

  await page.route('**/rest/v1/rpc/create_box', async (route) => {
    createRequestBody = route.request().postData() ?? '';

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'box-row-1',
        workspace_id: 'workspace-1',
        box_id: 'BOX-0001',
        name: 'Winter clothes',
      }),
    });
  });

  await page.goto('/inventory');

  await page.getByLabel('Box name').fill('Winter clothes');
  await page.getByRole('button', { name: 'Create box' }).click();

  await expect(page.getByText('BOX-0001')).toBeVisible();
  await expect(page.getByText('Winter clothes')).toBeVisible();
  expect(createRequestBody).toContain('Winter clothes');
});
