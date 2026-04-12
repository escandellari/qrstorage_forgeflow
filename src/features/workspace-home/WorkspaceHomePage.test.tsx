import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../../../app/page';
import { WorkspaceHomePage } from './index';

describe('HomePage route', () => {
  it('renders the primary workspace home content through app/page', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'qrstorage_forgeflow' })).toBeVisible();
    expect(screen.getByText('Track storage boxes without opening every lid.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  it('renders the workspace home boundary through the shared test setup', () => {
    render(<WorkspaceHomePage />);

    expect(screen.getByText('App shell')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'qrstorage_forgeflow' })).toBeVisible();
  });
});
