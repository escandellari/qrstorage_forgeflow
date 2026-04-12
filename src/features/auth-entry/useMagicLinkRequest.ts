'use client';

import { useCallback } from 'react';
import { getSupabaseBrowserClient } from './supabaseBrowserClient';

export function useMagicLinkRequest() {
  return useCallback(async (email: string) => {
    const redirectTo = new URL('/auth/callback', window.location.origin).toString();

    const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      throw error;
    }
  }, []);
}
