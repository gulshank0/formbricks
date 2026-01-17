import "server-only";
import { createHmac } from "crypto";
import { TShareLinkToken } from "@formbricks/types/share-link";
import { env } from "@/lib/env";

const ALGORITHM = "sha256";
const TOKEN_VERSION = "v1";

/**
 * Creates a URL-safe base64 encoded string
 */
const toBase64Url = (str: string): string => {
  return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/**
 * Decodes a URL-safe base64 string
 */
const fromBase64Url = (str: string): string => {
  // Add back padding if needed
  let padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  if (pad) {
    padded += "=".repeat(4 - pad);
  }
  return Buffer.from(padded, "base64").toString("utf-8");
};

/**
 * Generates a signature for the token payload
 */
const sign = (payload: string): string => {
  const secret = env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not defined");
  }
  return createHmac(ALGORITHM, secret).update(payload).digest("base64url");
};

/**
 * Generates a signed share token for a share link
 *
 * @param shareLinkId - The ID of the share link
 * @param surveyId - The ID of the survey being shared
 * @param expiresAt - Optional expiration date for the token
 * @returns A signed token string
 */
export const generateShareToken = (shareLinkId: string, surveyId: string, expiresAt: Date | null): string => {
  const payload: TShareLinkToken = {
    shareLinkId,
    surveyId,
    ...(expiresAt && { exp: Math.floor(expiresAt.getTime() / 1000) }),
  };

  const payloadString = JSON.stringify(payload);
  const encodedPayload = toBase64Url(payloadString);
  const signature = sign(encodedPayload);

  return `${TOKEN_VERSION}.${encodedPayload}.${signature}`;
};

/**
 * Verifies and decodes a share token
 *
 * @param token - The token to verify
 * @returns The decoded token payload or null if invalid/expired
 */
export const verifyShareToken = (token: string): TShareLinkToken | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [version, encodedPayload, signature] = parts;

    // Check version
    if (version !== TOKEN_VERSION) {
      return null;
    }

    // Verify signature
    const expectedSignature = sign(encodedPayload);
    if (signature !== expectedSignature) {
      return null;
    }

    // Decode payload
    const payloadString = fromBase64Url(encodedPayload);
    const payload = JSON.parse(payloadString) as TShareLinkToken;

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};
