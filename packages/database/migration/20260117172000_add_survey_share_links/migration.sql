-- CreateTable
CREATE TABLE "SurveyShareLink" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "surveyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SurveyShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SurveyShareLink_surveyId_idx" ON "SurveyShareLink"("surveyId");

-- CreateIndex
CREATE INDEX "SurveyShareLink_expiresAt_idx" ON "SurveyShareLink"("expires_at");

-- AddForeignKey
ALTER TABLE "SurveyShareLink" ADD CONSTRAINT "SurveyShareLink_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyShareLink" ADD CONSTRAINT "SurveyShareLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
