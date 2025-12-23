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
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[0-9]/, "Include a number"),
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

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange", // Better UX: validate as they type
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
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              We’ve sent a verification link to <span className="font-semibold text-foreground">{registeredEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" variant="outline">Resend Link</Button>
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
          {/* Name Field */}
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
            {errors.name && <p className="text-[12px] font-medium text-destructive">{errors.name.message}</p>}
          </div>

          {/* Email Field */}
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
              />
            </div>
            {errors.email && <p className="text-[12px] font-medium text-destructive">{errors.email.message}</p>}
          </div>

          {/* Password Field */}
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
            {/* Simple Strength Indicator */}
            <div className="flex gap-1 pt-1">
               {[1, 2, 3, 4].map((step) => (
                 <div key={step} className={`h-1 flex-1 rounded-full transition-colors ${
                   passwordValue.length > step * 2 ? "bg-primary" : "bg-muted"
                 }`} />
               ))}
            </div>
            {errors.password && <p className="text-[12px] font-medium text-destructive">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              {...register("confirmPassword")}
              id="confirmPassword"
              type="password"
              disabled={isLoading}
            />
            {errors.confirmPassword && <p className="text-[12px] font-medium text-destructive">{errors.confirmPassword.message}</p>}
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