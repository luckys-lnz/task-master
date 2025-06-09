import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/settings/profile-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Fetch user preferences
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    // Remove 'columns' if 'preferences' is not a column, or include only valid columns
  });

  const preferences = user
    ? {
        notificationsEnabled: user.notifications_enabled ?? true,
        defaultView: (user.default_view as "list" | "grid") ?? "list",
      }
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <div className="grid gap-10">
        <ProfileForm user={session.user} />
        <PreferencesForm
          initialPreferences={{
            notificationsEnabled: preferences?.notificationsEnabled ?? true,
            defaultView: preferences?.defaultView ?? "list",
          }}
        />
      </div>
    </div>
  );
}
