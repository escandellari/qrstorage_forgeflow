import { test, expect, type Route } from '@playwright/test';

const existingBox = {
  id: 'box-row-1',
  workspace_id: 'workspace-1',
  box_id: 'BOX-0001',
  name: 'Winter clothes',
  location: 'Hall cupboard',
  notes: 'Coats and hats',
  label_target: 'Front handle',
};

const createdItem = {
  id: 'item-row-1',
  box_id: 'box-row-1',
  name: 'Beanies',
  category: 'Clothing',
  notes: 'Top shelf',
  quantity: 3,
};

const existingItem = {
  id: 'item-row-1',
  box_id: 'box-row-1',
  name: 'Beanies',
  category: 'Clothing',
  notes: 'Top shelf',
  quantity: 3,
};

const updatedItem = {
  ...existingItem,
  notes: 'Front basket',
  quantity: 5,
};

async function stubActiveWorkspace(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ workspace_id: 'workspace-1' }]),
  });
}

test('adding an item on /boxes/[boxId] updates the visible contents list for that box', async ({
  page,
}) => {
  await page.route('**/rest/v1/workspace_memberships**', stubActiveWorkspace);

  await page.route('**/rest/v1/boxes**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([existingBox]),
    });
  });

  await page.route('**/rest/v1/items**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(createdItem),
      });

      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/boxes/BOX-0001');

  await page.getByLabel('Item name').fill('Beanies');
  await page.getByLabel('Category').fill('Clothing');
  await page.getByLabel('Item notes').fill('Top shelf');
  await page.getByLabel('Quantity').fill('3');
  await page.getByRole('button', { name: 'Add item' }).click();

  await expect(page.getByRole('region', { name: 'Box items' })).toContainText('Beanies');
  await expect(page.getByRole('region', { name: 'Box items' })).toContainText('Clothing');
  await expect(page.getByRole('region', { name: 'Box items' })).toContainText('Top shelf');
  await expect(page.getByRole('region', { name: 'Box items' })).toContainText('3');
});

test('editing an existing item updates the visible quantity and notes on the box page', async ({
  page,
}) => {
  await page.route('**/rest/v1/workspace_memberships**', stubActiveWorkspace);

  await page.route('**/rest/v1/boxes**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([existingBox]),
    });
  });

  await page.route('**/rest/v1/items**', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updatedItem),
      });

      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([existingItem]),
    });
  });

  await page.goto('/boxes/BOX-0001');

  await page.getByRole('button', { name: 'Edit Beanies' }).click();
  await page.getByLabel('Item notes').fill('Front basket');
  await page.getByLabel('Quantity').fill('5');
  await page.getByRole('button', { name: 'Save item' }).click();

  await expect(page.getByRole('region', { name: 'Box items' })).toContainText('Beanies');
  await expect(page.getByRole('region', { name: 'Box items' })).toContainText('Front basket');
  await expect(page.getByRole('region', { name: 'Box items' })).toContainText('5');
  await expect(page.getByRole('region', { name: 'Box items' })).not.toContainText('Top shelf');
  await expect(page.getByRole('region', { name: 'Box items' })).not.toContainText('3');
});

test('removing an item deletes it from the visible list on the box page', async ({ page }) => {
  await page.route('**/rest/v1/workspace_memberships**', stubActiveWorkspace);

  await page.route('**/rest/v1/boxes**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([existingBox]),
    });
  });

  await page.route('**/rest/v1/items**', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 204,
        contentType: 'application/json',
        body: '',
      });

      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([existingItem]),
    });
  });

  await page.goto('/boxes/BOX-0001');

  await expect(page.getByRole('region', { name: 'Box items' })).toContainText('Beanies');
  await page.getByRole('button', { name: 'Remove Beanies' }).click();

  await expect(page.getByRole('region', { name: 'Box items' })).not.toContainText('Beanies');
  await expect(page.getByText('No items yet.')).toBeVisible();
});
