import { SignUp } from "@clerk/nextjs"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up | Task Master",
  description: "Create a new Task Master account",
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  )
} 