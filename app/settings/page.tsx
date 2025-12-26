import { getValidatedSession } from "@/lib/validate-session";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  try {
    const session = await getValidatedSession();

    // Fetch user preferences
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    const preferences = user
      ? {
          notificationsEnabled: user.notifications_enabled ?? true,
          defaultView: (user.default_view as "list" | "grid") ?? "list",
          theme: (user.theme as "light" | "dark" | "system") ?? "system",
        }
      : {
          notificationsEnabled: true,
          defaultView: "list" as const,
          theme: "system" as const,
        };

  return (
    <div className="container mx-auto px-4 py-8">
      <SettingsClient
        user={session.user}
        preferences={preferences}
      />
    </div>
  );
  } catch {
    redirect("/auth/signin");
  }
}
