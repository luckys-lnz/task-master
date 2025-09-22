import { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { CheckSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign Up | Task Master",
  description: "Create your Task Master account",
};

export default function SignUpPage() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-muted" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="mb-8">
            <CheckSquare className="w-20 h-20 text-white mx-auto" />
          </div>
          <blockquote className="space-y-4 max-w-md mx-auto">
            <p className="text-xl font-medium italic">
              &ldquo;Join thousands of users who have already discovered the power of Task Master for managing their tasks and projects.&rdquo;
            </p>
            <div className="mt-6 pt-6 border-t border-white/30">
              <div className="flex items-center space-x-4">
                <img
                  src="https://picsum.photos/seed/user123/64/64.jpg"
                  alt="John Smith"
                  className="w-12 h-12 rounded-full"
                />
                <div className="text-left">
                  <p className="font-medium">John Smith</p>
                  <p className="text-sm text-white/70">Product Manager at TechCorp</p>
                </div>
              </div>
            </div>
          </blockquote>
          <div className="mt-8 flex space-x-3 justify-center">
            <div className="bg-white/20 p-2 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </div>
            <div className="bg-white/20 p-2 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="bg-white/20 p-2 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-sm text-white/70">Join over 10,000+ users who trust Task Master</p>
          </div>
          <p className="px-8 text-center text-sm text-muted-foreground">
            <a
              href="/auth/signin"
              className="hover:text-brand underline underline-offset-4"
            >
              Already have an account? Sign in
            </a>
          </p>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your details below to create your account
            </p>
          </div>
          <SignUpForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            <a
              href="/auth/signin"
              className="hover:text-brand underline underline-offset-4"
            >
              Already have an account? Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}