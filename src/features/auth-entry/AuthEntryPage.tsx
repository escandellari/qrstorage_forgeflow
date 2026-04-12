'use client';

import { FormEvent, useState } from 'react';
import { useMagicLinkRequest } from './useMagicLinkRequest';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function AuthEntryPage() {
  const requestMagicLink = useMagicLinkRequest();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await requestMagicLink(email);
      setIsSent(true);
    } catch {
      setErrorMessage('We could not send your sign-in link. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

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
        <p
          style={{
            margin: '0 0 12px',
            fontSize: '0.875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#6a4bb6',
          }}
        >
          Sign in
        </p>
        <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}>
          qrstorage_forgeflow
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: '1.125rem', lineHeight: 1.6 }}>
          Email yourself a magic link to get into your shared storage workspace.
        </p>

        {isSent ? (
          <div>
            <h2 style={{ margin: '0 0 12px', fontSize: '1.5rem' }}>Check your email</h2>
            <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, color: '#4f4565' }}>
              We sent a magic link to {email}. Continue from your inbox.
            </p>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit}>
            <label
              htmlFor="email"
              style={{ display: 'block', marginBottom: '12px', fontWeight: 700 }}
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrorMessage(null);
              }}
              style={{
                width: '100%',
                minHeight: '48px',
                padding: '0 16px',
                borderRadius: '16px',
                border: '1px solid #cfc5eb',
                marginBottom: '16px',
              }}
            />
            {errorMessage ? (
              <p
                role="alert"
                style={{ margin: '0 0 16px', fontSize: '0.95rem', color: '#b42318' }}
              >
                {errorMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                minHeight: '48px',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: '#6a4bb6',
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              {isSubmitting ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
