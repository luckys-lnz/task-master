"use client";

import { useState, useEffect } from "react";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { CheckSquare } from "lucide-react";

export default function SignUpPageClient() {
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

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
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Get started with Task Master today
            </p>
          </div>

          {/* Form */}
          <div 
            className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ animationDelay: '0.2s' }}
          >
            <SignUpForm />
          </div>

          {/* Sign In Link */}
          <p 
            className={`mt-6 text-center text-sm text-muted-foreground transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ animationDelay: '0.4s' }}
          >
            Already have an account?{" "}
            <a
              href="/auth/signin"
              className="font-semibold text-primary hover:underline underline-offset-4 transition-colors"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
