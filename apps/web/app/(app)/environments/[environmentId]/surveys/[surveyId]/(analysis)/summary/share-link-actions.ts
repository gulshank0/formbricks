"use server";

import { z } from "zod";
import { ZId } from "@formbricks/types/common";
import { ResourceNotFoundError } from "@formbricks/types/errors";
import { TSurveyShareLink, ZShareLinkExpiration } from "@formbricks/types/share-link";
import { getPublicDomain } from "@/lib/getPublicUrl";
import {
  createShareLink,
  getShareLinksBySurveyId,
  regenerateShareToken,
  revokeShareLink,
} from "@/lib/share-link/service";
import { getSurvey } from "@/lib/survey/service";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { getOrganizationIdFromSurveyId, getProjectIdFromSurveyId } from "@/lib/utils/helper";

const ZCreateShareLinkAction = z.object({
  surveyId: ZId,
  expiration: ZShareLinkExpiration,
});

export const createShareLinkAction = authenticatedActionClient
  .schema(ZCreateShareLinkAction)
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromSurveyId(parsedInput.surveyId);
    const projectId = await getProjectIdFromSurveyId(parsedInput.surveyId);

    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "projectTeam",
          minPermission: "read",
          projectId,
        },
      ],
    });

    const survey = await getSurvey(parsedInput.surveyId);
    if (!survey) {
      throw new ResourceNotFoundError("Survey", parsedInput.surveyId);
    }

    const { shareLink, token } = await createShareLink(
      parsedInput.surveyId,
      ctx.user.id,
      parsedInput.expiration
    );

    const publicDomain = getPublicDomain();
    const shareUrl = `${publicDomain}/share/${token}`;

    return {
      shareLink,
      shareUrl,
    };
  });

const ZGetShareLinksAction = z.object({
  surveyId: ZId,
});

export const getShareLinksAction = authenticatedActionClient
  .schema(ZGetShareLinksAction)
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromSurveyId(parsedInput.surveyId);
    const projectId = await getProjectIdFromSurveyId(parsedInput.surveyId);

    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "projectTeam",
          minPermission: "read",
          projectId,
        },
      ],
    });

    const shareLinks = await getShareLinksBySurveyId(parsedInput.surveyId);

    // Regenerate tokens for all share links so they can be copied
    const publicDomain = getPublicDomain();
    const shareLinksWithUrls = await Promise.all(
      shareLinks.map(async (link: TSurveyShareLink) => {
        const token = await regenerateShareToken(link.id);
        return {
          ...link,
          shareUrl: token ? `${publicDomain}/share/${token}` : null,
        };
      })
    );

    return shareLinksWithUrls;
  });

const ZRevokeShareLinkAction = z.object({
  surveyId: ZId,
  shareLinkId: ZId,
});

export const revokeShareLinkAction = authenticatedActionClient
  .schema(ZRevokeShareLinkAction)
  .action(async ({ ctx, parsedInput }) => {
    const organizationId = await getOrganizationIdFromSurveyId(parsedInput.surveyId);
    const projectId = await getProjectIdFromSurveyId(parsedInput.surveyId);

    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId,
      access: [
        {
          type: "organization",
          roles: ["owner", "manager"],
        },
        {
          type: "projectTeam",
          minPermission: "read",
          projectId,
        },
      ],
    });

    const revokedLink = await revokeShareLink(parsedInput.shareLinkId);

    return revokedLink;
  });
