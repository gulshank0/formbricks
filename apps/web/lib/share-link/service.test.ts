import { beforeEach, describe, expect, test, vi } from "vitest";
import { prisma } from "@formbricks/database";
import { cache } from "@/lib/cache";
// Import after mocks are set up
import {
  createShareLink,
  getShareLinkById,
  getShareLinksBySurveyId,
  getSurveyIdFromToken,
  regenerateShareToken,
  revokeShareLink,
  validateShareLink,
  validateShareToken,
} from "./service";
import { generateShareToken, verifyShareToken } from "./token";

// Mock dependencies
vi.mock("@formbricks/database", () => ({
  prisma: {
    surveyShareLink: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/cache", () => ({
  cache: Object.assign(
    vi.fn((fn) => fn),
    {
      revalidateTag: vi.fn(),
    }
  ),
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXTAUTH_SECRET: "test-secret-key-for-testing-purposes-only",
  },
}));

const mockSurveyId = "cltest123456789012345";
const mockUserId = "cluser123456789012345";
const mockShareLinkId = "clshare12345678901234";

const mockShareLink = {
  id: mockShareLinkId,
  createdAt: new Date("2026-01-17T12:00:00Z"),
  expiresAt: new Date("2026-01-24T12:00:00Z"),
  revokedAt: null,
  surveyId: mockSurveyId,
  userId: mockUserId,
};

describe("Share Link Token Services", () => {
  describe("generateShareToken", () => {
    test("generates a valid token with expiration", () => {
      const expiresAt = new Date("2026-01-24T12:00:00Z");
      const token = generateShareToken(mockShareLinkId, mockSurveyId, expiresAt);

      expect(token).toBeDefined();
      expect(token.split(".")).toHaveLength(3);
      expect(token.startsWith("v1.")).toBe(true);
    });

    test("generates a valid token without expiration", () => {
      const token = generateShareToken(mockShareLinkId, mockSurveyId, null);

      expect(token).toBeDefined();
      expect(token.split(".")).toHaveLength(3);
    });
  });

  describe("verifyShareToken", () => {
    test("verifies a valid token", () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const token = generateShareToken(mockShareLinkId, mockSurveyId, expiresAt);

      const payload = verifyShareToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.shareLinkId).toBe(mockShareLinkId);
      expect(payload?.surveyId).toBe(mockSurveyId);
    });

    test("rejects expired tokens", () => {
      const expiresAt = new Date(Date.now() - 1000); // Already expired
      const token = generateShareToken(mockShareLinkId, mockSurveyId, expiresAt);

      const payload = verifyShareToken(token);

      expect(payload).toBeNull();
    });

    test("rejects tampered tokens", () => {
      const token = generateShareToken(mockShareLinkId, mockSurveyId, null);
      const tamperedToken = token.slice(0, -5) + "xxxxx";

      const payload = verifyShareToken(tamperedToken);

      expect(payload).toBeNull();
    });

    test("rejects malformed tokens", () => {
      expect(verifyShareToken("invalid")).toBeNull();
      expect(verifyShareToken("")).toBeNull();
      expect(verifyShareToken("a.b")).toBeNull();
      expect(verifyShareToken("a.b.c.d")).toBeNull();
    });

    test("rejects tokens with wrong version", () => {
      const token = generateShareToken(mockShareLinkId, mockSurveyId, null);
      const wrongVersion = "v2" + token.slice(2);

      const payload = verifyShareToken(wrongVersion);

      expect(payload).toBeNull();
    });
  });
});

describe("Share Link Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createShareLink", () => {
    test("creates a share link with 7 days expiration", async () => {
      vi.mocked(prisma.surveyShareLink.create).mockResolvedValue(mockShareLink as any);

      const result = await createShareLink(mockSurveyId, mockUserId, "7_days");

      expect(prisma.surveyShareLink.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          surveyId: mockSurveyId,
          userId: mockUserId,
          expiresAt: expect.any(Date),
        }),
      });
      expect(result.shareLink).toBeDefined();
      expect(result.token).toBeDefined();
    });

    test("creates a share link with no expiration", async () => {
      const noExpiryShareLink = { ...mockShareLink, expiresAt: null };
      vi.mocked(prisma.surveyShareLink.create).mockResolvedValue(noExpiryShareLink as any);

      const result = await createShareLink(mockSurveyId, mockUserId, "never");

      expect(prisma.surveyShareLink.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          surveyId: mockSurveyId,
          userId: mockUserId,
          expiresAt: null,
        }),
      });
      expect(result.shareLink.expiresAt).toBeNull();
    });
  });

  describe("getShareLinksBySurveyId", () => {
    test("returns share links for a survey", async () => {
      vi.mocked(prisma.surveyShareLink.findMany).mockResolvedValue([mockShareLink] as any);

      const result = await getShareLinksBySurveyId(mockSurveyId);

      expect(result).toHaveLength(1);
      expect(result[0].surveyId).toBe(mockSurveyId);
    });

    test("returns empty array when no share links exist", async () => {
      vi.mocked(prisma.surveyShareLink.findMany).mockResolvedValue([]);

      const result = await getShareLinksBySurveyId(mockSurveyId);

      expect(result).toHaveLength(0);
    });
  });

  describe("revokeShareLink", () => {
    test("sets revokedAt timestamp", async () => {
      const revokedShareLink = { ...mockShareLink, revokedAt: new Date() };
      vi.mocked(prisma.surveyShareLink.update).mockResolvedValue(revokedShareLink as any);

      const result = await revokeShareLink(mockShareLinkId);

      expect(prisma.surveyShareLink.update).toHaveBeenCalledWith({
        where: { id: mockShareLinkId },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result.revokedAt).not.toBeNull();
      expect(cache.revalidateTag).toHaveBeenCalled();
    });
  });

  describe("validateShareLink", () => {
    test("returns share link when valid", async () => {
      vi.mocked(prisma.surveyShareLink.findUnique).mockResolvedValue(mockShareLink as any);

      const result = await validateShareLink(mockShareLinkId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockShareLinkId);
    });

    test("returns null when share link not found", async () => {
      vi.mocked(prisma.surveyShareLink.findUnique).mockResolvedValue(null);

      const result = await validateShareLink(mockShareLinkId);

      expect(result).toBeNull();
    });

    test("returns null when share link is revoked", async () => {
      const revokedShareLink = { ...mockShareLink, revokedAt: new Date() };
      vi.mocked(prisma.surveyShareLink.findUnique).mockResolvedValue(revokedShareLink as any);

      const result = await validateShareLink(mockShareLinkId);

      expect(result).toBeNull();
    });

    test("returns null when share link is expired", async () => {
      const expiredShareLink = { ...mockShareLink, expiresAt: new Date("2020-01-01") };
      vi.mocked(prisma.surveyShareLink.findUnique).mockResolvedValue(expiredShareLink as any);

      const result = await validateShareLink(mockShareLinkId);

      expect(result).toBeNull();
    });
  });

  describe("validateShareToken", () => {
    test("returns share link when token and share link are valid", async () => {
      vi.mocked(prisma.surveyShareLink.findUnique).mockResolvedValue(mockShareLink as any);
      const token = generateShareToken(mockShareLinkId, mockSurveyId, mockShareLink.expiresAt);

      const result = await validateShareToken(token);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockShareLinkId);
    });

    test("returns null for invalid token", async () => {
      const result = await validateShareToken("invalid-token");

      expect(result).toBeNull();
    });
  });

  describe("getSurveyIdFromToken", () => {
    test("extracts survey ID from valid token", () => {
      const token = generateShareToken(mockShareLinkId, mockSurveyId, null);

      const result = getSurveyIdFromToken(token);

      expect(result).toBe(mockSurveyId);
    });

    test("returns null for invalid token", () => {
      const result = getSurveyIdFromToken("invalid-token");

      expect(result).toBeNull();
    });
  });

  describe("regenerateShareToken", () => {
    test("generates new token for existing share link", async () => {
      vi.mocked(prisma.surveyShareLink.findUnique).mockResolvedValue(mockShareLink as any);

      const result = await regenerateShareToken(mockShareLinkId);

      expect(result).not.toBeNull();
      expect(typeof result).toBe("string");
    });

    test("returns null for non-existent share link", async () => {
      vi.mocked(prisma.surveyShareLink.findUnique).mockResolvedValue(null);

      const result = await regenerateShareToken(mockShareLinkId);

      expect(result).toBeNull();
    });
  });
});
