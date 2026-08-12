import { ManageTape } from "@/components/manage-tape";

export default async function ManagePage({
  params
}: {
  params: Promise<{ managementToken: string }>;
}) {
  const { managementToken } = await params;
  return <ManageTape managementToken={managementToken} />;
}
