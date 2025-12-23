import { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { CheckSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Forgot Password | Task Master",
  description: "Reset your Task Master account password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-muted" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="mb-8">
            <CheckSquare className="w-20 h-20 text-white mx-auto" />
          </div>
          <blockquote className="space-y-4 max-w-md mx-auto">
            <p className="text-xl font-medium italic">
              &ldquo;Forgot your password? No worries. We'll help you get back into your account in no time.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Forgot Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
