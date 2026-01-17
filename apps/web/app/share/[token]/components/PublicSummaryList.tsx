"use client";

import { TSurveyElementTypeEnum } from "@formbricks/types/surveys/elements";
import { TSurveySummary } from "@formbricks/types/surveys/types";

interface PublicSummaryListProps {
  summary: TSurveySummary["summary"];
}

// Simple percentage bar component
const PercentageBar = ({ percentage }: { percentage: number }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
    <div
      className="h-full rounded-full bg-slate-600 transition-all"
      style={{ width: `${Math.min(percentage, 100)}%` }}
    />
  </div>
);

// Multiple choice summary
const MultipleChoiceSummary = ({ item }: { item: any }) => (
  <div className="space-y-3">
    {item.choices?.map((choice: any, index: number) => (
      <div key={index} className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-slate-700">{choice.value || "Other"}</span>
          <span className="text-slate-500">
            {choice.count} ({choice.percentage.toFixed(1)}%)
          </span>
        </div>
        <PercentageBar percentage={choice.percentage} />
      </div>
    ))}
  </div>
);

// Rating/NPS summary
const RatingSummary = ({ item }: { item: any }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-4">
      <div className="text-3xl font-bold text-slate-900">{item.average?.toFixed(1) || "-"}</div>
      <div className="text-sm text-slate-500">Average rating out of {item.scale || 5}</div>
    </div>
    <div className="space-y-2">
      {item.choices?.map((choice: any, index: number) => (
        <div key={index} className="flex items-center gap-3">
          <span className="w-8 text-center text-sm font-medium text-slate-700">{choice.rating}</span>
          <div className="flex-1">
            <PercentageBar percentage={choice.percentage} />
          </div>
          <span className="w-16 text-right text-xs text-slate-500">{choice.count}</span>
        </div>
      ))}
    </div>
  </div>
);

// Open text summary
const OpenTextSummary = ({ item }: { item: any }) => (
  <div className="space-y-3">
    <div className="text-sm text-slate-600">
      {item.responseCount} {item.responseCount === 1 ? "response" : "responses"}
    </div>
    {item.samples?.slice(0, 5).map((sample: any, index: number) => (
      <div key={index} className="rounded-md bg-slate-100 p-3 text-sm text-slate-700">
        {sample.value || <span className="text-slate-400 italic">Empty response</span>}
      </div>
    ))}
    {item.responseCount > 5 && (
      <div className="text-center text-sm text-slate-500">+ {item.responseCount - 5} more responses</div>
    )}
  </div>
);

// NPS Summary
const NPSSummary = ({ item }: { item: any }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-6">
      <div className="text-center">
        <div className="text-4xl font-bold text-slate-900">{item.score?.toFixed(0) || "-"}</div>
        <div className="text-sm text-slate-500">NPS Score</div>
      </div>
      <div className="flex flex-1 gap-4">
        <div className="flex-1 rounded-lg bg-green-50 p-3 text-center">
          <div className="font-semibold text-green-700">{item.promoters?.percentage?.toFixed(1)}%</div>
          <div className="text-xs text-green-600">Promoters</div>
        </div>
        <div className="flex-1 rounded-lg bg-yellow-50 p-3 text-center">
          <div className="font-semibold text-yellow-700">{item.passives?.percentage?.toFixed(1)}%</div>
          <div className="text-xs text-yellow-600">Passives</div>
        </div>
        <div className="flex-1 rounded-lg bg-red-50 p-3 text-center">
          <div className="font-semibold text-red-700">{item.detractors?.percentage?.toFixed(1)}%</div>
          <div className="text-xs text-red-600">Detractors</div>
        </div>
      </div>
    </div>
  </div>
);

// Generic question card wrapper
const QuestionCard = ({
  headline,
  type,
  responseCount,
  children,
}: {
  headline: string;
  type: string;
  responseCount: number;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg border border-slate-200 bg-white p-6">
    <div className="mb-4">
      <h3 className="text-lg font-medium text-slate-900">{headline}</h3>
      <p className="mt-1 text-sm text-slate-500">
        {responseCount} {responseCount === 1 ? "response" : "responses"} • {type}
      </p>
    </div>
    {children}
  </div>
);

// Map question types to display names
const typeLabels: Record<string, string> = {
  [TSurveyElementTypeEnum.OpenText]: "Open Text",
  [TSurveyElementTypeEnum.MultipleChoiceSingle]: "Single Choice",
  [TSurveyElementTypeEnum.MultipleChoiceMulti]: "Multiple Choice",
  [TSurveyElementTypeEnum.Rating]: "Rating",
  [TSurveyElementTypeEnum.NPS]: "NPS",
  [TSurveyElementTypeEnum.CTA]: "Call to Action",
  [TSurveyElementTypeEnum.Consent]: "Consent",
  [TSurveyElementTypeEnum.PictureSelection]: "Picture Selection",
  [TSurveyElementTypeEnum.Date]: "Date",
  [TSurveyElementTypeEnum.Cal]: "Scheduling",
  [TSurveyElementTypeEnum.FileUpload]: "File Upload",
  [TSurveyElementTypeEnum.Matrix]: "Matrix",
  [TSurveyElementTypeEnum.Address]: "Address",
  [TSurveyElementTypeEnum.ContactInfo]: "Contact Info",
  [TSurveyElementTypeEnum.Ranking]: "Ranking",
  hiddenField: "Hidden Field",
};

export const PublicSummaryList = ({ summary }: PublicSummaryListProps) => {
  if (summary.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-slate-500">
        No responses yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summary.map((item, index) => {
        const element = "element" in item ? item.element : undefined;
        const itemId = "id" in item ? item.id : undefined;
        const headline = element?.headline?.default || itemId || `Question ${index + 1}`;
        const typeLabel = typeLabels[item.type] || item.type;

        let content: React.ReactNode = null;

        switch (item.type) {
          case TSurveyElementTypeEnum.MultipleChoiceSingle:
          case TSurveyElementTypeEnum.MultipleChoiceMulti:
          case TSurveyElementTypeEnum.PictureSelection:
          case TSurveyElementTypeEnum.Ranking:
            content = <MultipleChoiceSummary item={item} />;
            break;

          case TSurveyElementTypeEnum.Rating:
            content = <RatingSummary item={item} />;
            break;

          case TSurveyElementTypeEnum.NPS:
            content = <NPSSummary item={item} />;
            break;

          case TSurveyElementTypeEnum.OpenText:
          case TSurveyElementTypeEnum.Date:
          case TSurveyElementTypeEnum.FileUpload:
          case "hiddenField":
          default:
            content = <OpenTextSummary item={item} />;
            break;

          case TSurveyElementTypeEnum.CTA:
          case TSurveyElementTypeEnum.Consent:
            content = (
              <div className="text-sm text-slate-600">
                {item.responseCount} click{item.responseCount !== 1 ? "s" : ""}
              </div>
            );
            break;
        }

        return (
          <QuestionCard
            key={element?.id || itemId || index}
            headline={headline}
            type={typeLabel}
            responseCount={item.responseCount}>
            {content}
          </QuestionCard>
        );
      })}
    </div>
  );
};
