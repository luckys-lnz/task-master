"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

function SignInFormContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="grid gap-4">
      {error && (
        <p className="text-center text-sm text-destructive">
          Unable to sign in with Google. Please try again.
        </p>
      )}
      <Button
        variant="outline"
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full font-medium"
      >
        <Icons.google className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>
    </div>
  );
}

export function SignInForm() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </div>
      }
    >
      <SignInFormContent />
    </Suspense>
  );
}
