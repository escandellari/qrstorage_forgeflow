import type { Route } from '@playwright/test';

export const existingBox = {
  id: 'box-row-1',
  workspace_id: 'workspace-1',
  box_id: 'BOX-0001',
  name: 'Winter clothes',
  location: 'Hall cupboard',
  notes: 'Coats and hats',
  label_target: 'Front handle',
};

export async function stubActiveWorkspace(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ workspace_id: 'workspace-1' }]),
  });
}

export async function stubBoxRead(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([existingBox]),
  });
}
