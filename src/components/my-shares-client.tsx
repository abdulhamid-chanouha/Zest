"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/client";
import type { ShareSent } from "@/types";

export function MySharesClient() {
  const [shares, setShares] = useState<ShareSent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShares = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest<{ shares: ShareSent[] }>("/api/shares/sent");
      setShares(response.shares);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load shares.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadShares();
  }, [loadShares]);

  async function revokeShare(shareId: string) {
    try {
      await apiRequest(`/api/shares/${shareId}/revoke`, {
        method: "PATCH",
      });

      toast.success("Share revoked.");
      await loadShares();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke share.");
    }
  }

  async function copyShareLink(token: string) {
    const origin = window.location.origin;
    const url = `${origin}/shared/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied.");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My shares</CardTitle>
        </CardHeader>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading shares...</CardContent>
        </Card>
      ) : null}

      {!loading && !shares.length ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">You have not shared recipes yet.</CardContent>
        </Card>
      ) : null}

      {!loading
        ? shares.map((share) => (
            <Card key={share.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold">{share.recipeName}</p>
                    <p className="text-sm text-muted-foreground">
                      Shared with {share.recipientName || share.sharedWithEmail || "Link access"}
                    </p>
                  </div>
                  <Badge variant={share.revokedAt ? "outline" : "lemon"}>
                    {share.revokedAt ? "Revoked" : "Active"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyShareLink(share.shareToken)}>
                    <Copy className="mr-1 h-4 w-4" />
                    Copy link
                  </Button>
                  {!share.revokedAt ? (
                    <Button variant="secondary" size="sm" onClick={() => revokeShare(share.id)}>
                      Revoke
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        : null}
    </div>
  );
}
