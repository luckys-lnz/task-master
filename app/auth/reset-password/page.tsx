"use client";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { CheckSquare } from "lucide-react";

export default function ResetPasswordPage() {
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
              &ldquo;Create a strong password to keep your account secure.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Reset Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your new password below
            </p>
          </div>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
