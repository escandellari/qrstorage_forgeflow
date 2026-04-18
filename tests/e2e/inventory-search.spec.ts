import { test, expect } from '@playwright/test';
import { existingBox, stubActiveWorkspace } from './box-test-helpers';

const boxResult = {
  box_row_id: 'box-row-1',
  box_id: 'BOX-0001',
  box_name: 'Winter clothes',
  location: 'Hall cupboard',
  rank: 0.5,
  rank_source: 'box',
  match_context: 'box name: Winter clothes',
};

test('submitting a query on /search shows the matching result details and opens the box page', async ({
  page,
}) => {
  await page.route('**/rest/v1/workspace_memberships**', stubActiveWorkspace);

  await page.route('**/rest/v1/rpc/search_inventory', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([boxResult]),
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

  await page.goto('/search');

  await page.getByRole('searchbox', { name: 'Search' }).fill('winter');
  await page.getByRole('button', { name: 'Search' }).click();

  const result = page.getByRole('listitem').first();
  await expect(result).toContainText('BOX-0001');
  await expect(result).toContainText('Winter clothes');
  await expect(result).toContainText('Hall cupboard');
  await expect(result).toContainText('box name: Winter clothes');

  await page.getByRole('link', { name: /BOX-0001/i }).click();

  await expect(page).toHaveURL(/\/boxes\/BOX-0001$/);
  await expect(page.getByRole('heading', { name: 'BOX-0001' })).toBeVisible();
});
