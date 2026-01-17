import "server-only";
import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { TShareLinkExpiration, TSurveyShareLink } from "@formbricks/types/share-link";
import { cache } from "@/lib/cache";
import { generateShareToken, verifyShareToken } from "./token";

const SHARE_LINK_CACHE_KEY = "surveyShareLink";
const SHARE_LINK_TAG = (id: string) => `${SHARE_LINK_CACHE_KEY}-${id}`;
const SURVEY_SHARE_LINKS_TAG = (surveyId: string) => `${SHARE_LINK_CACHE_KEY}-survey-${surveyId}`;

/**
 * Calculates expiration date based on the expiration option
 */
const getExpirationDate = (expiration: TShareLinkExpiration): Date | null => {
  const now = new Date();

  switch (expiration) {
    case "7_days":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "30_days":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case "90_days":
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    case "never":
      return null;
    default:
      return null;
  }
};

/**
 * Creates a new share link for a survey
 *
 * @param surveyId - The ID of the survey to share
 * @param userId - The ID of the user creating the share link
 * @param expiration - The expiration period for the link
 * @returns An object containing the share link record and the signed token
 */
export const createShareLink = async (
  surveyId: string,
  userId: string,
  expiration: TShareLinkExpiration
): Promise<{ shareLink: TSurveyShareLink; token: string }> => {
  const expiresAt = getExpirationDate(expiration);

  const shareLink = await prisma.surveyShareLink.create({
    data: {
      surveyId,
      userId,
      expiresAt,
    },
  });

  const token = generateShareToken(shareLink.id, surveyId, expiresAt);

  return {
    shareLink: shareLink as TSurveyShareLink,
    token,
  };
};

/**
 * Gets all active share links for a survey
 */
export const getShareLinksBySurveyId = reactCache(
  async (surveyId: string): Promise<TSurveyShareLink[]> =>
    cache(
      async () => {
        const shareLinks = await prisma.surveyShareLink.findMany({
          where: {
            surveyId,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return shareLinks as TSurveyShareLink[];
      },
      [SURVEY_SHARE_LINKS_TAG(surveyId)],
      {
        tags: [SURVEY_SHARE_LINKS_TAG(surveyId)],
      }
    )()
);

/**
 * Gets a single share link by ID
 */
export const getShareLinkById = reactCache(
  async (id: string): Promise<TSurveyShareLink | null> =>
    cache(
      async () => {
        const shareLink = await prisma.surveyShareLink.findUnique({
          where: { id },
        });

        return shareLink as TSurveyShareLink | null;
      },
      [SHARE_LINK_TAG(id)],
      {
        tags: [SHARE_LINK_TAG(id)],
      }
    )()
);

/**
 * Revokes a share link by setting the revokedAt timestamp
 *
 * @param id - The ID of the share link to revoke
 * @returns The updated share link
 */
export const revokeShareLink = async (id: string): Promise<TSurveyShareLink> => {
  const shareLink = await prisma.surveyShareLink.update({
    where: { id },
    data: {
      revokedAt: new Date(),
    },
  });

  // Invalidate cache
  cache.revalidateTag(SHARE_LINK_TAG(id));
  cache.revalidateTag(SURVEY_SHARE_LINKS_TAG(shareLink.surveyId));

  return shareLink as TSurveyShareLink;
};

/**
 * Validates a share link - checks if it's not revoked and not expired
 *
 * @param id - The ID of the share link to validate
 * @returns The share link if valid, null otherwise
 */
export const validateShareLink = async (id: string): Promise<TSurveyShareLink | null> => {
  const shareLink = await getShareLinkById(id);

  if (!shareLink) {
    return null;
  }

  // Check if revoked
  if (shareLink.revokedAt) {
    return null;
  }

  // Check if expired
  if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
    return null;
  }

  return shareLink;
};

/**
 * Validates a share token and returns the share link if valid
 *
 * @param token - The token to validate
 * @returns The share link if valid, null otherwise
 */
export const validateShareToken = async (token: string): Promise<TSurveyShareLink | null> => {
  const payload = verifyShareToken(token);

  if (!payload) {
    return null;
  }

  return validateShareLink(payload.shareLinkId);
};

/**
 * Gets the survey ID from a share token without full validation
 * Used for initial routing and survey data fetching
 *
 * @param token - The token to parse
 * @returns The survey ID if token is parseable, null otherwise
 */
export const getSurveyIdFromToken = (token: string): string | null => {
  const payload = verifyShareToken(token);
  return payload?.surveyId || null;
};

/**
 * Regenerates a token for an existing share link
 * Used when the user wants to copy the link again
 *
 * @param shareLinkId - The ID of the share link
 * @returns The token string or null if share link not found
 */
export const regenerateShareToken = async (shareLinkId: string): Promise<string | null> => {
  const shareLink = await getShareLinkById(shareLinkId);

  if (!shareLink) {
    return null;
  }

  return generateShareToken(shareLink.id, shareLink.surveyId, shareLink.expiresAt);
};
