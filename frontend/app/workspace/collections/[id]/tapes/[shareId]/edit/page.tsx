"use client";

import { useParams } from "next/navigation";
import { ManageTape } from "@/components/manage-tape";

export default function WorkspaceEditTapePage() {
  const params = useParams();
  const shareId = params.shareId as string;

  return <ManageTape shareId={shareId} />;
}
