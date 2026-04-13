import { test, expect } from '@playwright/test';

test('an authorised member opens /boxes/[boxId] and sees the saved box details', async ({
  page,
}) => {
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
      body: JSON.stringify([
        {
          id: 'box-row-1',
          workspace_id: 'workspace-1',
          box_id: 'BOX-0001',
          name: 'Winter clothes',
          location: 'Hall cupboard',
          notes: 'Coats and hats',
          label_target: 'Front handle',
        },
      ]),
    });
  });

  await page.goto('/boxes/BOX-0001');

  await expect(page.getByRole('heading', { name: 'BOX-0001' })).toBeVisible();
  await expect(page.getByLabel('Box name')).toHaveValue('Winter clothes');
  await expect(page.getByLabel('Location')).toHaveValue('Hall cupboard');
  await expect(page.getByLabel('Notes')).toHaveValue('Coats and hats');
  await expect(page.getByLabel('Label target')).toHaveValue('Front handle');
  await expect(page.getByRole('button', { name: 'Save box details' })).toBeVisible();
});

test('an authorised member edits box details and sees the saved values on the same page', async ({
  page,
}) => {
  await page.route('**/rest/v1/workspace_memberships**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ workspace_id: 'workspace-1' }]),
    });
  });

  await page.route('**/rest/v1/boxes**', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'box-row-1',
          workspace_id: 'workspace-1',
          box_id: 'BOX-0001',
          name: 'Winter coats',
          location: 'Loft shelf',
          notes: 'Heavy jackets only',
          label_target: 'Lid top',
        }),
      });

      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'box-row-1',
          workspace_id: 'workspace-1',
          box_id: 'BOX-0001',
          name: 'Winter clothes',
          location: 'Hall cupboard',
          notes: 'Coats and hats',
          label_target: 'Front handle',
        },
      ]),
    });
  });

  await page.goto('/boxes/BOX-0001');

  await page.getByLabel('Box name').fill('Winter coats');
  await page.getByLabel('Location').fill('Loft shelf');
  await page.getByLabel('Notes').fill('Heavy jackets only');
  await page.getByLabel('Label target').fill('Lid top');
  await page.getByRole('button', { name: 'Save box details' }).click();

  await expect(page).toHaveURL(/\/boxes\/BOX-0001$/);
  await expect(page.getByLabel('Box name')).toHaveValue('Winter coats');
  await expect(page.getByLabel('Location')).toHaveValue('Loft shelf');
  await expect(page.getByLabel('Notes')).toHaveValue('Heavy jackets only');
  await expect(page.getByLabel('Label target')).toHaveValue('Lid top');
  await expect(page.getByRole('region', { name: 'Saved box details' })).toContainText('Winter coats');
  await expect(page.getByRole('region', { name: 'Saved box details' })).toContainText('Loft shelf');
  await expect(page.getByRole('region', { name: 'Saved box details' })).toContainText('Heavy jackets only');
  await expect(page.getByRole('region', { name: 'Saved box details' })).toContainText('Lid top');
});
