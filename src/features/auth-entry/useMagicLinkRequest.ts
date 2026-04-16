'use client';

import { useCallback } from 'react';
import { buildAuthCallbackUrl } from '@/src/features/workspace-access/authRedirect';
import { getSupabaseBrowserClient } from './supabaseBrowserClient';

export function useMagicLinkRequest() {
  return useCallback(async (email: string, nextPath?: string) => {
    const redirectTo = buildAuthCallbackUrl(nextPath);

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
