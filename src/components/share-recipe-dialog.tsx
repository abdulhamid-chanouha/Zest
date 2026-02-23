"use client";

import { Copy, Link as LinkIcon, Mail, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/client";

type ShareRecipeDialogProps = {
  recipeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShareRecipeDialog({ recipeId, open, onOpenChange }: ShareRecipeDialogProps) {
  const [email, setEmail] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [sharing, setSharing] = useState(false);

  const disabled = useMemo(() => !recipeId || sharing, [recipeId, sharing]);

  async function createShare(payload: { email?: string; generateLink?: boolean }) {
    if (!recipeId) {
      return;
    }

    setSharing(true);

    try {
      const response = await apiRequest<{ shareUrl: string }>("/api/shares", {
        method: "POST",
        body: JSON.stringify({ recipeId, ...payload }),
      });

      setShareUrl(response.shareUrl);
      toast.success("Share created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Share failed.");
    } finally {
      setSharing(false);
    }
  }

  async function copyUrl() {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share recipe
          </DialogTitle>
          <DialogDescription>
            Share read-only access by email or generate a secure token link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-email">Invite by email</Label>
            <div className="flex gap-2">
              <Input
                id="share-email"
                type="email"
                placeholder="chef@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => createShare({ email })}
                disabled={disabled || !email.trim()}
              >
                <Mail className="mr-1 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 p-3">
            <p className="mb-2 text-sm font-medium">Or generate share link</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => createShare({ generateLink: true })}
              disabled={disabled}
            >
              <LinkIcon className="mr-1 h-4 w-4" />
              Generate link
            </Button>

            {shareUrl ? (
              <div className="mt-3 flex gap-2">
                <Input readOnly value={shareUrl} />
                <Button type="button" variant="secondary" onClick={copyUrl}>
                  <Copy className="mr-1 h-4 w-4" />
                  Copy
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
