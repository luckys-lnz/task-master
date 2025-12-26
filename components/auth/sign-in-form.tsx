"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const signInSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .max(320, "Email address is too long")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, "Password is required")
    .max(128, "Password is too long"),
});

type SignInValues = z.infer<typeof signInSchema>;

function SignInFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(
    searchParams.get("error") === "CredentialsSignin" 
      ? "Invalid email or password" 
      : null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  async function onSubmit(data: SignInValues) {
    setIsLoading(true);
    setServerError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Provide more specific error messages
        if (result.error === "CredentialsSignin") {
          setServerError("Invalid email or password");
        } else if (result.error.includes("locked")) {
          setServerError("Account is temporarily locked due to too many failed login attempts. Please try again later.");
        } else if (result.error.includes("verify")) {
          setServerError("Please verify your email address before signing in. Check your inbox for the verification link.");
        } else {
          setServerError(result.error || "Invalid email or password");
        }
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      {/* Social Login Section - Put first for frequent users */}
      <Button
        variant="outline"
        type="button"
              disabled={isLoading}
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full font-medium"
      >
        <Icons.google className="mr-2 h-4 w-4" />
        Continue with Google
          </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or sign in with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                {...register("email")}
                id="email"
                placeholder="name@example.com"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                className={cn("pl-10", errors.email && "border-destructive focus-visible:ring-destructive")}
              />
            </div>
            {errors.email && (
              <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-primary hover:underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                disabled={isLoading}
                maxLength={128}
                className={cn("pl-10 pr-10", errors.password && "border-destructive focus-visible:ring-destructive")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1} // Prevent tabbing into the eye icon for speed
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
            )}
          </div>
        </div>

        {/* Global Error Message */}
        {serverError && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Sign In"
          )}
      </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="font-semibold text-primary hover:underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </div>
  );
} 

export function SignInForm() {
  return (
    <Suspense fallback={
      <div className="grid gap-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    }>
      <SignInFormContent />
    </Suspense>
  );
}