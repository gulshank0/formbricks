import Link from "next/link";

export default function ShareResultsNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="max-w-md text-center">
        <div className="mb-4 text-6xl">🔗</div>
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Share Link Not Found</h1>
        <p className="mb-6 text-slate-600">
          This share link may have expired, been revoked, or never existed. Please contact the survey owner if
          you believe this is an error.
        </p>
        <Link
          href="https://formbricks.com"
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Learn more about Formbricks
        </Link>
      </div>
    </div>
  );
}
