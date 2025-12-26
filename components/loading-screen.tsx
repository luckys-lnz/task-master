"use client";

import { useEffect, useState } from "react";
import { CheckSquare } from "lucide-react";

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let timer: NodeJS.Timeout;

    // Simulate loading progress
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          return 95; // Don't complete until page is ready
        }
        return prev + Math.random() * 10;
      });
    }, 100);

    // Check if page is already loaded
    const handleLoad = () => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    };

    // Listen for page load
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    // Fallback: Complete loading after maximum time
    timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          {/* Outer glow rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-32 h-32 border-4 border-blue-500/30 rounded-full animate-ping" />
            <div className="absolute w-40 h-40 border-4 border-purple-500/30 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
            <div className="absolute w-48 h-48 border-4 border-pink-500/30 rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
          </div>

          {/* Logo container with gradient */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-60 animate-pulse" />
            <div className="relative bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/30">
              <CheckSquare 
                className="w-20 h-20 text-white mx-auto drop-shadow-lg animate-bounce-slow" 
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
          Task Master
        </h1>

        {/* Loading Text */}
        <p className="text-lg text-muted-foreground mb-8 animate-pulse">
          Loading your productivity companion...
        </p>

        {/* Progress Bar */}
        <div className="w-64 sm:w-80 h-2 bg-muted rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Progress Percentage */}
        <p className="text-sm text-muted-foreground font-medium">
          {Math.round(progress)}%
        </p>

        {/* Animated Dots */}
        <div className="flex space-x-2 mt-6">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
