import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSurveySummary } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/lib/surveySummary";
import { getSurveyIdFromToken, validateShareToken } from "@/lib/share-link/service";
import { getSurvey } from "@/lib/survey/service";
import { PublicSummaryPage } from "./components/PublicSummaryPage";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const surveyId = getSurveyIdFromToken(token);

  if (!surveyId) {
    return {
      title: "Survey Results | Formbricks",
    };
  }

  const survey = await getSurvey(surveyId);

  return {
    title: survey ? `${survey.name} - Results | Formbricks` : "Survey Results | Formbricks",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ShareResultsPage({ params }: PageProps) {
  const { token } = await params;

  // Validate the share token and link
  const shareLink = await validateShareToken(token);

  if (!shareLink) {
    notFound();
  }

  // Fetch survey and summary data
  const survey = await getSurvey(shareLink.surveyId);

  if (!survey) {
    notFound();
  }

  // Get summary data without filters (public view has no filtering)
  const surveySummary = await getSurveySummary(shareLink.surveyId);

  if (!surveySummary) {
    notFound();
  }

  return <PublicSummaryPage survey={survey} surveySummary={surveySummary} />;
}
