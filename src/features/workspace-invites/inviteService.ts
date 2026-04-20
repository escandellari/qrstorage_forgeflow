import { getSupabaseBrowserClient } from '@/src/features/auth/supabaseBrowserClient';

type CreatedWorkspaceInvite = {
  token: string;
  invitedEmail: string;
};

function normaliseInvitedEmail(invitedEmail: string) {
  const normalisedEmail = invitedEmail.trim().toLowerCase();

  if (!normalisedEmail) {
    throw new Error('Enter an email address.');
  }

  return normalisedEmail;
}

export async function createWorkspaceInvite(workspaceId: string, invitedEmail: string) {
  const normalisedEmail = normaliseInvitedEmail(invitedEmail);
  const { data, error } = await getSupabaseBrowserClient().rpc('create_workspace_invite', {
    workspace_id_input: workspaceId,
    invited_email_input: normalisedEmail,
  });

  if (error) {
    throw error;
  }

  return data as CreatedWorkspaceInvite;
}

export type InviteAcceptanceResult =
  | {
      status: 'signed-out';
    }
  | {
      status: 'accepted';
    }
  | {
      status: 'email-mismatch';
      invitedEmail: string;
      signedInEmail: string;
    }
  | {
      status: 'expired';
      invitedEmail: string;
    }
  | {
      status: 'already-accepted';
    }
  | {
      status: 'already-member';
    }
  | {
      status: 'error';
    };

export async function acceptWorkspaceInvite(token: string): Promise<InviteAcceptanceResult> {
  const {
    data: { session },
    error: sessionError,
  } = await getSupabaseBrowserClient().auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session?.user?.email) {
    return {
      status: 'signed-out',
    };
  }

  const { data, error } = await getSupabaseBrowserClient().rpc('accept_workspace_invite', {
    token_input: token,
  });

  if (error) {
    throw error;
  }

  return data as InviteAcceptanceResult;
}
