'use client';

import { FormEvent, useState } from 'react';
import { useMagicLinkRequest } from './useMagicLinkRequest';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type AuthEntryPageProps = {
  title?: string;
  description?: string;
  nextPath?: string;
};

function LayersIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6b4fd8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
    </svg>
  );
}

export function AuthEntryPage({
  title = 'qrstorage',
  description = 'Sign in to manage your storage',
  nextPath,
}: AuthEntryPageProps) {
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
      await requestMagicLink(email, nextPath);
      setIsSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('Too many requests')) {
        setErrorMessage('Too many requests. Please wait 60 seconds and try again.');
      } else if (message.includes('We could not send')) {
        setErrorMessage('We could not send your sign-in link. Try again.');
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {isSent ? (
          <>
            <div className="auth-sent-icon">
              <EnvelopeIcon />
            </div>
            <h1 className="auth-sent-title">Check your email</h1>
            <p className="auth-sent-body">
              We sent a sign-in link to{' '}
              <span className="auth-sent-email">{email}</span>
            </p>
          </>
        ) : (
          <>
            <div className="auth-app-icon">
              <LayersIcon />
            </div>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{description}</p>
            <form noValidate onSubmit={handleSubmit} className="auth-form">
              <label htmlFor="email" className="ui-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrorMessage(null);
                }}
                className="ui-input"
              />
              {errorMessage ? (
                <p role="alert" className="ui-alert">
                  {errorMessage}
                </p>
              ) : null}
              <button type="submit" disabled={isSubmitting} className="ui-btn-primary">
                {isSubmitting ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
