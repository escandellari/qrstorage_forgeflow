import { test, expect } from '@playwright/test';
import { existingBox, stubActiveWorkspace, stubBoxRead } from './box-test-helpers';

const boxResult = {
  box_row_id: 'box-row-1',
  box_id: 'BOX-0001',
  box_name: 'Winter clothes',
  location: 'Hall cupboard',
  rank: 0.5,
  rank_source: 'box',
  match_context: 'box name: Winter clothes',
};

const itemResult = {
  box_row_id: 'box-row-2',
  box_id: 'BOX-0002',
  box_name: 'Summer gear',
  location: 'Loft',
  rank: 0.9,
  rank_source: 'item',
  match_context: 'item name: Beach towel',
};

test('submitting a query on /search calls search_inventory RPC, shows ranked results, and opens the box page', async ({
  page,
}) => {
  await page.route('**/rest/v1/workspace_memberships**', stubActiveWorkspace);

  await page.route('**/rest/v1/rpc/search_inventory**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([boxResult]),
    });
  });

  await page.route('**/rest/v1/boxes**', stubBoxRead);

  await page.route('**/rest/v1/items**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/search');

  await page.getByLabel('Search').fill('winter');
  await page.getByRole('button', { name: 'Search' }).click();

  const result = page.getByRole('listitem').first();
  await expect(result).toContainText('BOX-0001');
  await expect(result).toContainText('Winter clothes');
  await expect(result).toContainText('Hall cupboard');
  await expect(result).toContainText('box name: Winter clothes');

  await page.getByRole('link', { name: /BOX-0001/i }).click();

  await expect(page).toHaveURL(/\/boxes\/BOX-0001$/);
  await expect(page.getByRole('heading', { name: 'BOX-0001' })).toBeVisible();
  await expect(page.getByText(existingBox.name!)).toBeVisible();
});

test('box-level rank_source rows appear before item-level rows in the rendered list', async ({
  page,
}) => {
  await page.route('**/rest/v1/workspace_memberships**', stubActiveWorkspace);

  await page.route('**/rest/v1/rpc/search_inventory**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([itemResult, boxResult]),
    });
  });

  await page.goto('/search');

  await page.getByLabel('Search').fill('clothes');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByText('Winter clothes').first()).toBeVisible();
  await expect(page.getByText('Summer gear').first()).toBeVisible();

  const listItems = page.getByRole('listitem');
  const firstItem = listItems.first();
  const secondItem = listItems.nth(1);

  await expect(firstItem).toContainText('BOX-0001');
  await expect(secondItem).toContainText('BOX-0002');
});
