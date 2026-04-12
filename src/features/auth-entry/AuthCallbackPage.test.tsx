import React from 'react';
import { render, waitFor } from '@testing-library/react';
import AuthCallbackRoute from '../../../app/auth/callback/page';

const exchangeCodeForSessionMock = vi.fn();

vi.mock('./supabaseBrowserClient', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
    },
  }),
}));

describe('Auth callback route', () => {
  beforeEach(() => {
    exchangeCodeForSessionMock.mockReset();
    window.history.replaceState({}, '', '/auth/callback?code=magic-code');
  });

  it('exchanges the auth code from the callback route', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });

    render(<AuthCallbackRoute />);

    await waitFor(() => {
      expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('magic-code');
    });
  });
});
