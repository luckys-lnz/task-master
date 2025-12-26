import { Metadata } from "next";
import SignUpPageClient from "./page-client";

export const metadata: Metadata = {
  title: "Sign Up | Task Master",
  description: "Create your Task Master account",
};

export default function SignUpPage() {
  return <SignUpPageClient />;
}