import { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Reset Password | Task Master",
  description: "Reset your Task Master account password",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPageClient />
    </Suspense>
  );
}
