'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from './supabaseBrowserClient';

export function AuthCallbackPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const authCode = new URLSearchParams(window.location.search).get('code');

    if (!authCode) {
      setErrorMessage('This sign-in link is invalid or expired.');
      return;
    }

    void (async () => {
      const { error } = await getSupabaseBrowserClient().auth.exchangeCodeForSession(authCode);

      if (error) {
        setErrorMessage('We could not complete your sign-in link. Try again.');
        return;
      }

      window.location.replace('/');
    })();
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: '#ffffff',
          border: '1px solid #e9e2ff',
          borderRadius: '24px',
          padding: '32px 24px',
          boxShadow: '0 20px 45px rgba(108, 74, 182, 0.12)',
        }}
      >
        <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}>
          Completing sign-in…
        </h1>
        {errorMessage ? (
          <p role="alert" style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, color: '#b42318' }}>
            {errorMessage}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, color: '#4f4565' }}>
            Please wait while we finish signing you in.
          </p>
        )}
      </section>
    </main>
  );
}
