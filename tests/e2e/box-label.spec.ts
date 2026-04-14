import { test, expect } from '@playwright/test';
import { existingBox, stubActiveWorkspace, stubBoxRead } from './box-test-helpers';

test('a workspace member opens the label view from the box page', async ({ page }) => {
  await page.route('**/rest/v1/workspace_memberships**', stubActiveWorkspace);
  await page.route('**/rest/v1/boxes**', stubBoxRead);

  await page.goto('/boxes/BOX-0001');

  await page.getByRole('link', { name: 'Open label view' }).click();

  await expect(page).toHaveURL(/\/boxes\/BOX-0001\/label$/);
  await expect(page.getByRole('region', { name: 'Printable box label' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'BOX-0001' })).toBeVisible();
  await expect(page.getByText(existingBox.name!)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Print label' })).toBeVisible();
});


test('leaving the label view without printing and reopening it keeps the saved box details', async ({
  page,
}) => {
  await page.route('**/rest/v1/workspace_memberships**', stubActiveWorkspace);
  await page.route('**/rest/v1/boxes**', stubBoxRead);

  await page.goto('/boxes/BOX-0001/label');

  await expect(page.getByRole('heading', { name: 'BOX-0001' })).toBeVisible();
  await expect(page.getByText(existingBox.name!)).toBeVisible();

  await page.goto('/boxes/BOX-0001');
  await page.getByRole('link', { name: 'Open label view' }).click();

  await expect(page).toHaveURL(/\/boxes\/BOX-0001\/label$/);
  await expect(page.getByRole('heading', { name: 'BOX-0001' })).toBeVisible();
  await expect(page.getByText(existingBox.name!)).toBeVisible();
});
