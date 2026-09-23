"use client";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

export function SignUpForm() {
  // TODO: Restore the commented email/password signup form after the Google-only phase.
  return (
    <Button
      variant="outline"
      type="button"
      className="w-full"
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
    >
      <Icons.google className="mr-2 h-4 w-4" /> Continue with Google
    </Button>
  );
}
