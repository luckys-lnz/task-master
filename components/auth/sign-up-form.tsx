"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const signUpSchema = z.object({
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-'\.]+$/, "Name can only contain letters, spaces, hyphens, apostrophes, and periods"),
  email: z.string()
    .email("Please enter a valid email address")
    .max(320, "Email address is too long")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character")
    .refine((pwd) => !/(.)\1{3,}/.test(pwd), "Password contains too many repeated characters")
    .refine((pwd) => {
      const common = ['password', '12345678', 'qwerty', 'admin', 'letmein', 'welcome'];
      return !common.some(c => pwd.toLowerCase().includes(c));
    }, "Password is too common. Please choose a more unique password"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
  });

  const passwordValue = watch("password", "");

  async function onSubmit(data: SignUpValues) {
    setIsLoading(true);
    setServerError("");
    try {
      const { confirmPassword, ...registerData } = data;
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Registration failed");

      setRegisteredEmail(data.email);
      
      if (responseData.verificationUrl) {
        setVerificationUrl(responseData.verificationUrl);
        console.log("🔗 Verification URL:", responseData.verificationUrl);
      }
      
      setSuccess(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div>
        <Card className="border-green-100 bg-green-50/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">Account Created Successfully!</CardTitle>
            <CardDescription className="space-y-3">
              <p>
                Your account has been created. {verificationUrl ? (
                  <>Email verification is available below.</>
                ) : (
                  <>Please check your email for verification instructions.</>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                You can sign in now, but verifying your email is recommended for account security.
              </p>
              {verificationUrl && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md text-left">
                  <p className="text-xs font-semibold mb-2 text-amber-800 dark:text-amber-200 flex items-center gap-1">
                    <span>🔗</span> Verification Link
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                    Copy this link to verify your email (expires in 24 hours):
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-primary bg-background p-2 rounded border break-all">
                      {verificationUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async (e) => {
                        try {
                          await navigator.clipboard.writeText(verificationUrl);
                          const btn = e.currentTarget;
                          const originalText = btn.textContent;
                          btn.textContent = "Copied!";
                          setTimeout(() => {
                            if (btn) btn.textContent = originalText;
                          }, 2000);
                        } catch (err) {
                          console.error("Failed to copy:", err);
                        }
                      }}
                      className="shrink-0"
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    ⚠️ Keep this link private. You can use the app without verification, but verification is recommended.
                  </p>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const response = await fetch("/api/auth/resend-verification", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: registeredEmail }),
                  });
                  const data = await response.json();
                  if (response.ok) {
                    setServerError("");
                    if (data.verificationUrl) {
                      setVerificationUrl(data.verificationUrl);
                    }
                    alert("Verification email resent! Please check your inbox.");
                  } else {
                    setServerError(data.error || "Failed to resend verification email");
                  }
                } catch {
                  setServerError("Failed to resend verification email");
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Resend Verification Email
            </Button>
            <Button variant="link" onClick={() => router.push("/auth/signin")}>Back to sign in</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                {...register("name")} 
                id="name" 
                placeholder="John Doe" 
                className="pl-10" 
                disabled={isLoading} 
              />
            </div>
            {errors.name && <p className="text-xs font-medium text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                {...register("email")} 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                className="pl-10" 
                disabled={isLoading}
                maxLength={320}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                className="pl-10 pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex gap-1 pt-1">
               {[1, 2, 3, 4].map((step) => (
                 <div key={step} className={`h-1 flex-1 rounded-full transition-colors ${
                   passwordValue.length > step * 2 ? "bg-primary" : "bg-muted"
                 }`} />
               ))}
            </div>
            {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              {...register("confirmPassword")}
              id="confirmPassword"
              type="password"
              disabled={isLoading}
              maxLength={128}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p className="text-xs font-medium text-destructive">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        {serverError && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button variant="outline" className="w-full" disabled={isLoading} onClick={() => {}}>
        <Icons.google className="mr-2 h-4 w-4" /> Google
      </Button>
    </div>
  );
}
