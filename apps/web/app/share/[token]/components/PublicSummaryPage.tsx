"use client";

import { useMemo, useState } from "react";
import { TSurvey, TSurveySummary } from "@formbricks/types/surveys/types";
import { SummaryDropOffs } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/SummaryDropOffs";
import { replaceHeadlineRecall } from "@/lib/utils/recall";
import { PublicSummaryList } from "./PublicSummaryList";
import { PublicSummaryMetadata } from "./PublicSummaryMetadata";

interface PublicSummaryPageProps {
  survey: TSurvey;
  surveySummary: TSurveySummary;
}

export const PublicSummaryPage = ({ survey, surveySummary }: PublicSummaryPageProps) => {
  const [tab, setTab] = useState<"dropOffs" | undefined>(undefined);

  const surveyMemoized = useMemo(() => {
    return replaceHeadlineRecall(survey, "default");
  }, [survey]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{survey.name}</h1>
              <p className="mt-1 text-sm text-slate-500">Survey Results</p>
            </div>
            <div className="text-sm text-slate-500">
              Powered by{" "}
              <a
                href="https://formbricks.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-700 hover:text-slate-900">
                Formbricks
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Metadata */}
        <PublicSummaryMetadata surveySummary={surveySummary.meta} tab={tab} setTab={setTab} />

        {/* Drop-offs */}
        {tab === "dropOffs" && <SummaryDropOffs dropOff={surveySummary.dropOff} survey={surveyMemoized} />}

        {/* Question Summaries */}
        <div className="mt-6">
          <PublicSummaryList summary={surveySummary.summary} />
        </div>
      </div>
    </div>
  );
};
