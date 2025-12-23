"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link. Please request a new verification email.");
      return;
    }

    async function verifyEmail() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Verification failed");
        }

        setStatus("success");
        setMessage("Your email has been verified successfully!");
        setTimeout(() => {
          router.push("/auth/signin");
        }, 2000);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Verification failed. Please request a new verification email."
        );
      }
    }

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-muted" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="mb-8">
            <Icons.spinner className="w-20 h-20 text-white mx-auto" />
          </div>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Email Verification
            </h1>
            {status === "loading" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Icons.spinner className="h-8 w-8 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Verifying your email address...
                </p>
              </div>
            )}
            {status === "success" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                  <svg
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">{message}</p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to sign in...
                </p>
              </div>
            )}
            {status === "error" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                  <svg
                    className="h-6 w-6 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <p className="text-sm text-red-500">{message}</p>
                <div className="flex flex-col gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const email = searchParams.get("email");
                      if (email) {
                        try {
                          const response = await fetch("/api/auth/resend-verification", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email }),
                          });
                          if (response.ok) {
                            setMessage("Verification email resent! Please check your inbox.");
                            setStatus("loading");
                          } else {
                            const data = await response.json();
                            setMessage(data.error || "Failed to resend email");
                          }
                        } catch (err) {
                          setMessage("Failed to resend verification email");
                        }
                      }
                    }}
                  >
                    Resend verification email
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/auth/signin">Back to sign in</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
