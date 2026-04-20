import { getSupabaseBrowserClient } from '@/src/features/auth/supabaseBrowserClient';

type WorkspaceInviteRow = {
  token: string;
  workspace_id: string;
  invited_email: string;
  expires_at: string;
  accepted_at: string | null;
};

function isDuplicateMembershipError(error: { code?: string; message?: string } | null) {
  return error?.code === '23505' || error?.message?.toLowerCase().includes('duplicate') === true;
}

export async function createWorkspaceInvite(workspaceId: string, invitedEmail: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const normalisedEmail = invitedEmail.trim().toLowerCase();

  const { data, error } = await getSupabaseBrowserClient()
    .from('workspace_invites')
    .insert({
      workspace_id: workspaceId,
      token,
      invited_email: normalisedEmail,
      expires_at: expiresAt,
    })
    .select('token, invited_email')
    .single();

  if (error) {
    throw error;
  }

  return {
    token: data.token as string,
    invitedEmail: data.invited_email as string,
  };
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

async function getInviteByToken(token: string): Promise<WorkspaceInviteRow | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('workspace_invites')
    .select('token, workspace_id, invited_email, expires_at, accepted_at')
    .eq('token', token);

  if (error) {
    throw error;
  }

  const invite = data[0] as WorkspaceInviteRow | undefined;

  return invite ?? null;
}

export async function acceptWorkspaceInvite(token: string): Promise<InviteAcceptanceResult> {
  const {
    data: { session },
    error: sessionError,
  } = await getSupabaseBrowserClient().auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const user = session?.user;

  if (!user?.email) {
    return {
      status: 'signed-out',
    };
  }

  const invite = await getInviteByToken(token);

  if (!invite) {
    return {
      status: 'error',
    };
  }

  const signedInEmail = user.email.trim().toLowerCase();
  const invitedEmail = invite.invited_email.trim().toLowerCase();

  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return {
      status: 'expired',
      invitedEmail,
    };
  }

  if (invite.accepted_at) {
    return {
      status: 'already-accepted',
    };
  }

  if (signedInEmail !== invitedEmail) {
    return {
      status: 'email-mismatch',
      invitedEmail,
      signedInEmail,
    };
  }

  const { error: membershipError } = await getSupabaseBrowserClient().from('workspace_memberships').insert({
    workspace_id: invite.workspace_id,
    user_id: user.id,
    role: 'member',
  });

  if (membershipError) {
    if (isDuplicateMembershipError(membershipError)) {
      return {
        status: 'already-member',
      };
    }

    throw membershipError;
  }

  const { error: inviteUpdateError } = await getSupabaseBrowserClient()
    .from('workspace_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token);

  if (inviteUpdateError) {
    throw inviteUpdateError;
  }

  return {
    status: 'accepted',
  };
}
