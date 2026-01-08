"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Loader2, AlertCircle, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ 
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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
        // Automatically sign in using the email-verification provider
        // This provider will verify the email token, mark email as verified, and sign the user in
        setStatus("loading");
        setMessage("Verifying your email and signing you in...");

        const result = await signIn("email-verification", {
          email: email,
          token: token,
          redirect: false,
        });

        if (result?.error) {
          setStatus("error");
          setMessage("Verification failed. The link may have expired or is invalid. Please request a new verification email.");
        } else if (result?.ok) {
          // Successfully verified and signed in
          setStatus("success");
          setMessage("Your email has been verified! Redirecting to dashboard...");
          // Redirect immediately without delay for better UX
          router.push("/dashboard");
          router.refresh();
        } else {
          // Should not happen, but handle it
          setStatus("error");
          setMessage("Verification failed. Please try again.");
        }
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

  const handleResend = async () => {
    const email = searchParams.get("email");
    if (!email) return;

    setIsResending(true);
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
    } catch {
      setMessage("Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Animated Background Orbs - Subtle */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div 
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 blur-3xl animate-pulse"
          style={{
            top: `${mousePosition.y * 50 - 300}%`,
            left: `${mousePosition.x * 50 - 300}%`,
            transition: 'all 0.8s ease-out',
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-orange-400/20 dark:from-purple-500/10 dark:via-pink-500/10 dark:to-orange-500/10 blur-3xl animate-pulse"
          style={{
            bottom: `${(1 - mousePosition.y) * 50 - 250}%`,
            right: `${(1 - mousePosition.x) * 50 - 250}%`,
            transition: 'all 0.8s ease-out',
            animationDelay: '1s',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md">
        <div 
          className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-40 dark:opacity-30 animate-pulse" />
              <div className="relative bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 backdrop-blur-sm rounded-2xl p-4 border border-primary/20 dark:border-primary/30 group-hover:scale-105 transition-transform duration-300">
                <CheckSquare className="w-12 h-12 text-primary mx-auto" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Email Verification
            </h1>
            <p className="text-sm text-muted-foreground">
              {status === "loading" && "Verifying your email address..."}
              {status === "success" && "Your email has been verified!"}
              {status === "error" && "Verification failed"}
            </p>
          </div>

          {/* Status Card */}
          <div 
            className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ animationDelay: '0.2s' }}
          >
            {status === "loading" && (
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                  <CardTitle>Verifying your email</CardTitle>
                  <CardDescription>
                    Please wait while we verify your email address...
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {status === "success" && (
              <Card className="border-green-100 bg-green-50/30 dark:border-green-900 dark:bg-green-950/30">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-xl">Email Verified!</CardTitle>
                  <CardDescription>
                    {message}
                  </CardDescription>
                  <CardDescription className="text-sm text-muted-foreground mt-2">
                    Taking you to your dashboard...
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {status === "error" && (
              <Card className="border-red-100 bg-red-50/30 dark:border-red-900 dark:bg-red-950/30">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-xl">Verification Failed</CardTitle>
                  <CardDescription className="text-red-700 dark:text-red-300">
                    {message}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={handleResend}
                    disabled={isResending}
                    className="w-full border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                  <Button variant="link" asChild className="text-muted-foreground hover:text-foreground">
                    <Link href="/auth/signin">Back to sign in</Link>
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPageClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-40 dark:opacity-30 animate-pulse" />
              <div className="relative bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 backdrop-blur-sm rounded-2xl p-4 border border-primary/20 dark:border-primary/30">
                <CheckSquare className="w-12 h-12 text-primary mx-auto" strokeWidth={2} />
              </div>
            </div>
          </div>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
