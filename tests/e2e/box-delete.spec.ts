import { test, expect } from '@playwright/test';
import { existingBox, stubActiveWorkspace } from './box-test-helpers';

test('a workspace member deletes a box, sees it removed from inventory, and later gets the deleted-box tombstone', async ({
  page,
}) => {
  let isDeleted = false;

  await page.route('**/rest/v1/workspace_memberships**', stubActiveWorkspace);

  await page.route('**/rest/v1/boxes**', async (route) => {
    const request = route.request();

    if (request.method() === 'PATCH') {
      isDeleted = true;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            ...existingBox,
            retired_at: '2026-04-20T10:00:00.000Z',
          },
        ]),
      });

      return;
    }

    const requestUrl = new URL(request.url());
    const retiredFilter = requestUrl.searchParams.get('retired_at');

    const activeBox = {
      ...existingBox,
      retired_at: null,
    };
    const retiredBox = {
      ...existingBox,
      retired_at: '2026-04-20T10:00:00.000Z',
    };

    const responseBody = !isDeleted
      ? [activeBox]
      : retiredFilter === 'not.is.null'
        ? [retiredBox]
        : [];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
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

  await expect(page.getByRole('heading', { name: 'BOX-0001' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete box' }).click();

  await expect(page).toHaveURL(/\/inventory$/);
  await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
  await expect(page.getByText('BOX-0001')).not.toBeVisible();

  await page.goto('/boxes/BOX-0001');

  await expect(page.getByRole('heading', { name: 'BOX-0001 was deleted' })).toBeVisible();
  await expect(page.getByText('This box no longer exists.')).toBeVisible();
  await expect(page.getByText('Its box ID will not be reused.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to inventory' })).toHaveAttribute(
    'href',
    '/inventory',
  );
  await expect(page.getByRole('link', { name: 'Search inventory' })).toHaveAttribute(
    'href',
    '/search',
  );
});
