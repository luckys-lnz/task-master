"use client";

import { useState } from "react";
import { User } from "next-auth";
import { ProfileForm } from "@/components/settings/profile-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { NotificationsForm } from "@/components/settings/notifications-form";
import { AccountSettings } from "@/components/settings/account-settings";
import { User as UserIcon, Bell, Palette, Shield, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsClientProps {
  user: User;
  preferences: {
    notificationsEnabled: boolean;
    defaultView: "list" | "grid";
    theme: "light" | "dark" | "system";
  };
}

const settingsSections = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "preferences", label: "Preferences", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account", icon: Shield },
] as const;

export function SettingsClient({ user, preferences }: SettingsClientProps) {
  const [activeSection, setActiveSection] = useState("profile");

  const activeIcon = settingsSections.find((s) => s.id === activeSection)?.icon || UserIcon;
  const ActiveIcon = activeIcon;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-12rem)]">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="sticky top-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Manage your account and preferences
            </p>
          </div>
          
          <nav className="space-y-1" aria-label="Settings navigation">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveSection(section.id);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                  aria-label={`${section.label} settings`}
                  aria-current={isActive ? "page" : undefined}
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn(
                      "h-4 w-4",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )} />
                    <span>{section.label}</span>
                  </div>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-foreground" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="space-y-1 mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ActiveIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {settingsSections.find((s) => s.id === activeSection)?.label}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activeSection === "profile" && "Update your personal information and profile picture"}
                {activeSection === "preferences" && "Customize your Task-Master experience and appearance"}
                {activeSection === "notifications" && "Manage how you receive notifications and reminders"}
                {activeSection === "account" && "Manage your account security and privacy settings"}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl">
          {activeSection === "profile" && <ProfileForm user={user} />}
          {activeSection === "preferences" && (
            <PreferencesForm initialPreferences={preferences} />
          )}
          {activeSection === "notifications" && (
            <NotificationsForm initialNotificationsEnabled={preferences.notificationsEnabled} />
          )}
          {activeSection === "account" && <AccountSettings user={user} />}
        </div>
      </main>
    </div>
  );
}
