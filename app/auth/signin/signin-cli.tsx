"use client";

import { useState, useEffect } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { CheckSquare } from "lucide-react";

const quotes = [
  "The secret of getting ahead is getting started.",
  "Small progress is still progress — keep moving forward.",
  "Focus on being productive instead of busy.",
  "Success is the sum of small efforts repeated daily.",
  "Your future is created by what you do today, not tomorrow.",
  "You are what you repeatedly do. Excellence, then, is not an act, but a habit.",
  "Don not watch the clock; do what it does. Keep going.",
  "The way to get started is to quit talking and begin doing.",
  "Productivity is being able to do things that you were never able to do before.",
  "Start where you are. Use what you have. Do what you can.",
  "It always seems impossible until it is done.",
];

export default function SignInPageClient() {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left Panel */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-muted" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="mb-8">
            <CheckSquare className="w-20 h-20 text-white mx-auto" />
          </div>

          <blockquote className="space-y-4 max-w-md mx-auto">
            <p className="text-xl font-medium italic">
              &ldquo;{quotes[quoteIndex]}&rdquo;
            </p>
            <p className="text-sm text-white/70">
              Stay productive and in control with Task Master.
            </p>
          </blockquote>

          <div className="mt-8 pt-6 border-t border-white/30 w-full max-w-sm mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="w-6 h-6 text-white/80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 11c0-1.104-.896-2-2-2s-2 .896-2 2v2a2 2 0 002 2h0a2 2 0 002-2v-2zM17 11V9a5 5 0 00-10 0v2m12 0v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6h14z"
                />
              </svg>
              <span className="text-sm text-white/70">
                Your data is encrypted and secure
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-white/70">
              Enter your credentials to sign in to your account
            </p>
          </div>
          <SignInForm />
          <p className="px-8 text-center text-sm text-white/70">
            <a
              href="/auth/signup"
              className="hover:text-brand underline underline-offset-4"
            >
              Don&apos;t have an account? Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
