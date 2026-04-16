import { BoxAccessGate } from '@/src/features/workspace-access';

type BoxRouteProps = {
  params: Promise<{
    boxId: string;
  }>;
};

export default async function BoxRoute({ params }: BoxRouteProps) {
  const { boxId } = await params;

  return <BoxAccessGate boxId={boxId} />;
}
