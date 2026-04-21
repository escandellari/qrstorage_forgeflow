'use client';

import { useCallback } from 'react';
import { buildAuthCallbackUrl } from '@/src/features/workspace-access/authRedirect';
import { getSupabaseBrowserClient } from './supabaseBrowserClient';

export function useMagicLinkRequest() {
  return useCallback(async (email: string, nextPath?: string) => {
    const redirectTo = buildAuthCallbackUrl(nextPath);
    console.log('Sending magic link to:', email, 'redirectTo:', redirectTo);

    const { data, error } = await getSupabaseBrowserClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    console.log('signInWithOtp result:', { data, error });

    if (error) {
      // Provide more specific error messages based on error properties
      const errorMsg = error.message || String(error);
      const errorStatus = (error as unknown as { status?: number }).status;
      console.log('Error details:', { errorMsg, errorStatus });

      // Detect rate limit (HTTP 429)
      if (errorStatus === 429 || errorMsg.includes('429') || errorMsg.includes('rate_limit') || errorMsg.includes('too many')) {
        throw new Error('Too many requests. Please wait 60 seconds and try again.');
      }
      if (errorStatus === 422) {
        throw new Error('This email is not allowed. Check your Supabase configuration.');
      }
      // Default fallback message with details
      throw new Error(`We could not send your sign-in link. Try again. (${errorMsg})`);
    }

    // Check if data exists - for OTP, data should exist even on success
    if (!data) {
      throw new Error('We could not send your sign-in link. Try again.');
    }
  }, []);
}
