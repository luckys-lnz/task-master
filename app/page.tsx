import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { validateUserExists } from "@/lib/auth-utils";
import HomePageClient from "./page-client";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    // Validate user still exists before redirecting
    const user = await validateUserExists(session.user.id);
    if (user) {
      redirect("/dashboard");
    }
    // If user doesn't exist, don't redirect - let them see the home page
  }

  return <HomePageClient />;
}
