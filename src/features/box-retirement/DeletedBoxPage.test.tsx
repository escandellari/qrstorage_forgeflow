import React from 'react';
import { render, screen } from '@testing-library/react';
import { DeletedBoxPage } from './DeletedBoxPage';

describe('DeletedBoxPage', () => {
  it('states that the box no longer exists, that its ID will not be reused, and gives recovery links', () => {
    render(<DeletedBoxPage boxId="BOX-0001" />);

    expect(screen.getByRole('heading', { name: 'BOX-0001 was deleted' })).toBeVisible();
    expect(screen.getByText('This box no longer exists.')).toBeVisible();
    expect(screen.getByText('Its box ID will not be reused.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to inventory' })).toHaveAttribute(
      'href',
      '/inventory',
    );
    expect(screen.getByRole('link', { name: 'Search inventory' })).toHaveAttribute(
      'href',
      '/search',
    );
  });
});
