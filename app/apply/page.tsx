"use client";

import { useState } from "react";
import ApplicationForm from "@/components/ApplicationForm";
import { ApplicationResponse } from "@/lib/types";

export default function ApplyPage() {
  const [submissionResult, setSubmissionResult] =
    useState<ApplicationResponse | null>(null);

  if (submissionResult) {
    return (
      <main className="min-h-screen p-8 max-w-2xl mx-auto">
        <div className="border rounded-lg p-6 bg-green-50">
          <h1 className="text-2xl font-bold text-green-800 mb-4">
            Application Submitted Successfully
          </h1>

          <div className="space-y-3">
            <p>
              <span className="font-medium">Application ID:</span>{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {submissionResult.applicationId}
              </code>
            </p>

            <p>
              <span className="font-medium">Review Status:</span>{" "}
              <span
                className={`px-2 py-1 rounded text-sm ${
                  submissionResult.reviewTier === "standard"
                    ? "bg-green-200 text-green-800"
                    : "bg-yellow-200 text-yellow-800"
                }`}
              >
                {submissionResult.reviewTier === "standard"
                  ? "Standard Processing"
                  : "Manual Review Required"}
              </span>
            </p>

            {submissionResult.riskFlags.length > 0 && (
              <div>
                <p className="font-medium mb-1">Review Notes:</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {submissionResult.riskFlags.map((flag, index) => (
                    <li key={index}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={() => setSubmissionResult(null)}
            className="mt-6 text-blue-600 hover:underline"
          >
            Submit Another Application
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Stipend Application</h1>
      <p className="text-gray-600 mb-8">
        Please complete all required fields below to submit your stipend application.
      </p>

      <ApplicationForm onSuccess={setSubmissionResult} />
    </main>
  );
}
