import { NextResponse } from "next/server";
import { applicationStore } from "@/lib/stores/applicationStore";
import { handoffStore } from "@/lib/stores/handoffStore";
import { maskSSN } from "@/lib/utils/piiUtils";

/**
 * DEBUG ENDPOINT - For development only
 * Shows stored applications and handoff records
 * SSN is masked in the response
 */
export async function GET() {
  const applications = applicationStore.getAll().map((app) => ({
    ...app,
    ssn: maskSSN(app.ssn), // Mask SSN even in debug view
  }));

  const handoffRecords = handoffStore.getAll();

  return NextResponse.json({
    message: "Debug view - stored data",
    counts: {
      applications: applications.length,
      handoffRecords: handoffRecords.length,
    },
    applications,
    handoffRecords,
  });
}
