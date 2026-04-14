import { BoxLabelPage } from '@/src/features/box-labels';

type BoxLabelRouteProps = {
  params: Promise<{
    boxId: string;
  }>;
};

export default async function BoxLabelRoute({ params }: BoxLabelRouteProps) {
  const { boxId } = await params;

  return <BoxLabelPage boxId={boxId} />;
}
