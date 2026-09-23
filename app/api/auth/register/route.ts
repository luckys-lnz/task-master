import { NextResponse } from "next/server";

// TODO: Restore the commented email/password registration flow after the Google-only phase.
// The previous implementation remains disabled here until that flow is intentionally reopened.
export async function POST() {
  return NextResponse.json(
    { error: "Email/password registration is temporarily disabled. Please use Google." },
    { status: 410 }
  );
}
