import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/settings/profile-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateUserExists } from "@/lib/auth-utils";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Validate user still exists in database
  const existingUser = await validateUserExists(session.user.id);
  if (!existingUser) {
    redirect("/auth/signin");
  }

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
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>
      <div className="grid gap-6">
        <ProfileForm user={session.user} />
        <PreferencesForm
          initialPreferences={{
            notificationsEnabled: preferences?.notificationsEnabled ?? true,
            defaultView: preferences?.defaultView ?? "list",
            theme: preferences?.theme ?? "system",
          }}
        />
      </div>
    </div>
  );
}
