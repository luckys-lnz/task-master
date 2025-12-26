import { redirect } from "next/navigation";
import { DashboardClient } from "./page-cli";
import { getValidatedSession } from "@/lib/validate-session";

export default async function DashboardPage() {
  try {
    // Single call that validates session and user existence
    const session = await getValidatedSession();

    return (
      <DashboardClient 
        userName={session.user?.name || "User"} 
        dbConnected={true}
      />
    );
  } catch (error) {
    // Redirect to signin if validation fails
    redirect("/auth/signin");
  }
}