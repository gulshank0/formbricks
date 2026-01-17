"use client";

import { BarChart3, Copy, Link2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { TSurveyShareLink } from "@formbricks/types/share-link";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { Button } from "@/modules/ui/components/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/modules/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/ui/components/select";
import { createShareLinkAction, getShareLinksAction, revokeShareLinkAction } from "../share-link-actions";

interface ShareResultsModalProps {
  surveyId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface ShareLinkWithUrl extends TSurveyShareLink {
  shareUrl: string | null;
}

const expirationOptions = [
  { value: "7_days", label: "7 days" },
  { value: "30_days", label: "30 days" },
  { value: "90_days", label: "90 days" },
  { value: "never", label: "Never expires" },
] as const;

const getStatusLabel = (
  link: TSurveyShareLink
): { label: string; variant: "success" | "warning" | "destructive" } => {
  if (link.revokedAt) {
    return { label: "Revoked", variant: "destructive" };
  }
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return { label: "Expired", variant: "warning" };
  }
  return { label: "Active", variant: "success" };
};

const formatDate = (date: Date | null): string => {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const ShareResultsModal = ({ surveyId, open, setOpen }: ShareResultsModalProps) => {
  const [shareLinks, setShareLinks] = useState<ShareLinkWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedExpiration, setSelectedExpiration] = useState<string>("30_days");

  const loadShareLinks = async () => {
    setIsLoading(true);
    try {
      const result = await getShareLinksAction({ surveyId });
      if (result?.data) {
        setShareLinks(result.data as ShareLinkWithUrl[]);
      }
    } catch (error) {
      console.error("Failed to load share links:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadShareLinks();
    }
  }, [open, surveyId]);

  const handleCreateShareLink = async () => {
    setIsCreating(true);
    try {
      const result = await createShareLinkAction({
        surveyId,
        expiration: selectedExpiration as "7_days" | "30_days" | "90_days" | "never",
      });

      if (result?.data) {
        toast.success("Share link created!");
        // Copy to clipboard automatically
        await navigator.clipboard.writeText(result.data.shareUrl);
        toast.success("Link copied to clipboard!");
        await loadShareLinks();
      } else {
        const errorMessage = getFormattedErrorMessage(result);
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error("Failed to create share link");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async (shareUrl: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleRevokeLink = async (shareLinkId: string) => {
    try {
      const result = await revokeShareLinkAction({
        surveyId,
        shareLinkId,
      });

      if (result?.data) {
        toast.success("Share link revoked");
        await loadShareLinks();
      } else {
        const errorMessage = getFormattedErrorMessage(result);
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error("Failed to revoke link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            <DialogTitle>Share Results</DialogTitle>
          </div>
          <DialogDescription>
            Create a public link to share survey results with anyone. They can view the summary statistics and
            drop-off analysis without logging in.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {/* Create new share link */}
          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-medium text-slate-900">Generate New Link</h3>
            <div className="flex gap-2">
              <Select value={selectedExpiration} onValueChange={setSelectedExpiration}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Expiration" />
                </SelectTrigger>
                <SelectContent>
                  {expirationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateShareLink} loading={isCreating} className="flex-1">
                <Link2 className="mr-2 h-4 w-4" />
                Generate Link
              </Button>
            </div>
          </div>

          {/* Existing share links */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-slate-900">Existing Links ({shareLinks.length})</h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              </div>
            ) : shareLinks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">
                No share links yet. Generate one above to get started.
              </div>
            ) : (
              <div className="max-h-64 space-y-3 overflow-y-auto">
                {shareLinks.map((link) => {
                  const status = getStatusLabel(link);
                  const isActive = status.variant === "success";

                  return (
                    <div
                      key={link.id}
                      className={`rounded-lg border p-3 ${
                        isActive ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50"
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                status.variant === "success"
                                  ? "bg-green-100 text-green-800"
                                  : status.variant === "warning"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}>
                              {status.label}
                            </span>
                            <span className="text-xs text-slate-500">
                              Created {formatDate(link.createdAt)}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Expires: {formatDate(link.expiresAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isActive && link.shareUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(link.shareUrl!)}
                              title="Copy link">
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                          {isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeLink(link.id)}
                              title="Revoke link"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Privacy note */}
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            <strong>Note:</strong> Anyone with the link can view survey results. The displayed data is the
            same as your Summary view. Make sure no sensitive information is included in responses before
            sharing.
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
