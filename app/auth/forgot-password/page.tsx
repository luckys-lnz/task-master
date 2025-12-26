import { Metadata } from "next";
import ForgotPasswordPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Forgot Password | Task Master",
  description: "Reset your Task Master account password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
