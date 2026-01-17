"use client";

import { Clock, MousePointerClick, PlayCircle, XCircle } from "lucide-react";
import { TSurveySummary } from "@formbricks/types/surveys/types";

interface PublicSummaryMetadataProps {
  surveySummary: TSurveySummary["meta"];
  tab: "dropOffs" | undefined;
  setTab: (tab: "dropOffs" | undefined) => void;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  percentage,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  percentage?: number;
  iconColor: string;
}) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <div className="flex items-center gap-2">
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      {percentage !== undefined && <span className="text-sm text-slate-500">{percentage.toFixed(1)}%</span>}
    </div>
  </div>
);

export const PublicSummaryMetadata = ({ surveySummary, tab, setTab }: PublicSummaryMetadataProps) => {
  const formatTime = (seconds: number): string => {
    if (seconds === 0) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={MousePointerClick}
          label="Impressions"
          value={surveySummary.displayCount}
          iconColor="text-blue-500"
        />
        <StatCard
          icon={PlayCircle}
          label="Started"
          value={surveySummary.totalResponses}
          percentage={surveySummary.startsPercentage}
          iconColor="text-green-500"
        />
        <StatCard
          icon={XCircle}
          label="Completed"
          value={surveySummary.completedResponses}
          percentage={surveySummary.completedPercentage}
          iconColor="text-purple-500"
        />
        <StatCard
          icon={Clock}
          label="Avg. Time"
          value={formatTime(surveySummary.ttcAverage / 1000)}
          iconColor="text-orange-500"
        />
      </div>

      {/* Drop-off Analysis Tab */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab(tab === "dropOffs" ? undefined : "dropOffs")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "dropOffs"
              ? "bg-slate-900 text-white"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
          }`}>
          Drop-off Analysis ({surveySummary.dropOffCount} dropped,{" "}
          {surveySummary.dropOffPercentage.toFixed(1)}%)
        </button>
      </div>
    </div>
  );
};
