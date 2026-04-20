import { InviteAcceptancePage } from '@/src/features/workspace-invites';

type InviteRouteProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InviteRoute({ params }: InviteRouteProps) {
  const { token } = await params;

  return <InviteAcceptancePage token={token} />;
}
