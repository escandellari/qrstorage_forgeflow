'use client';

import { FormEvent, useState } from 'react';
import { createWorkspaceInvite } from './inviteService';

type InviteSenderProps = {
  workspaceId: string;
};

function buildInviteUrl(token: string) {
  return `${window.location.origin}/invites/${token}`;
}

function buildInviteEmailHref(invitedEmail: string, inviteUrl: string) {
  const params = new URLSearchParams({
    subject: 'Join my shared storage workspace',
    body: `Open this invite link to join the workspace: ${inviteUrl}`,
  });

  return `mailto:${invitedEmail}?${params.toString()}`;
}

export function InviteSender({ workspaceId }: InviteSenderProps) {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<{
    invitedEmail: string;
    inviteUrl: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Enter an email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const invite = await createWorkspaceInvite(workspaceId, email);
      setCreatedInvite({
        invitedEmail: invite.invitedEmail,
        inviteUrl: buildInviteUrl(invite.token),
      });
      setEmail('');
      setErrorMessage(null);
    } catch {
      setErrorMessage('We could not create your invite. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-label="Invite members">
      <h2>Invite a member</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="member-email-address">Member email address</label>
        <input
          id="member-email-address"
          type="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrorMessage(null);
          }}
        />
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating invite…' : 'Create invite'}
        </button>
      </form>
      {createdInvite ? (
        <div>
          <p>Invite ready for {createdInvite.invitedEmail}.</p>
          <a href={buildInviteEmailHref(createdInvite.invitedEmail, createdInvite.inviteUrl)}>Email invite</a>
        </div>
      ) : null}
    </section>
  );
}
