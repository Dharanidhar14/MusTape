import { ReceiverTape } from "@/components/receiver-tape";

export default async function TapePage({
  params
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  return <ReceiverTape shareId={shareId} />;
}
