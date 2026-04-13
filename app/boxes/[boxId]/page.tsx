import { BoxDetailsPage } from '@/src/features/box-details';

type BoxRouteProps = {
  params: Promise<{
    boxId: string;
  }>;
};

export default async function BoxRoute({ params }: BoxRouteProps) {
  const { boxId } = await params;

  return <BoxDetailsPage boxId={boxId} />;
}
