import { SharedTokenClient } from "@/components/shared-token-client";

type SharedTokenPageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharedTokenPage({ params }: SharedTokenPageProps) {
  const resolved = await params;
  return <SharedTokenClient token={resolved.token} />;
}
