import { Metadata } from "next";
import VerifyEmailPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Verify Email | Task Master",
  description: "Verify your email address",
};

export default function VerifyEmailPage() {
  return <VerifyEmailPageClient />;
}
