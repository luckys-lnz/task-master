import { Metadata } from "next";
import SignInPageClient from "./signin-cli";

export const metadata: Metadata = {
  title: "Sign In | Task Master",
  description: "Sign in to your Task Master account",
};

export default function SignInPage() {
  return <SignInPageClient />;
}
