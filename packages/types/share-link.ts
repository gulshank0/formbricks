import { z } from "zod";

export const ZSurveyShareLink = z.object({
  id: z.string().cuid(),
  createdAt: z.date(),
  expiresAt: z.date().nullable(),
  revokedAt: z.date().nullable(),
  surveyId: z.string().cuid(),
  userId: z.string().cuid(),
});

export type TSurveyShareLink = z.infer<typeof ZSurveyShareLink>;

export const ZShareLinkExpiration = z.enum(["7_days", "30_days", "90_days", "never"]);
export type TShareLinkExpiration = z.infer<typeof ZShareLinkExpiration>;

export const ZShareLinkToken = z.object({
  shareLinkId: z.string().cuid(),
  surveyId: z.string().cuid(),
  exp: z.number().optional(),
});

export type TShareLinkToken = z.infer<typeof ZShareLinkToken>;

export const ZCreateShareLinkInput = z.object({
  surveyId: z.string().cuid(),
  expiration: ZShareLinkExpiration,
});

export type TCreateShareLinkInput = z.infer<typeof ZCreateShareLinkInput>;
