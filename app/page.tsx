import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Task Master
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account or create a new one to get started
          </p>
        </div>
        <div className="grid gap-4">
          <Button asChild>
            <Link href="/auth/signin">
              Sign In
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/signup">
              Create Account
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
