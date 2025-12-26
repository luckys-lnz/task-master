"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";

const preferencesSchema = z.object({
  notificationsEnabled: z.boolean(),
  defaultView: z.enum(["list", "grid"]),
  theme: z.enum(["light", "dark", "system"]),
});

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

interface PreferencesFormProps {
  initialPreferences: {
    notificationsEnabled: boolean;
    defaultView: "list" | "grid";
    theme: "light" | "dark" | "system";
  };
}

export function PreferencesForm({ initialPreferences }: PreferencesFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      notificationsEnabled: initialPreferences.notificationsEnabled,
      defaultView: initialPreferences.defaultView,
      theme: initialPreferences.theme || "system",
    },
  });

  async function onSubmit(data: PreferencesFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update preferences");

      // Update theme
      setTheme(data.theme);

      toast({
        title: "Preferences updated",
        description: "Your preferences have been updated successfully.",
      });

      router.refresh();
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customize your Task-Master experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for task reminders and updates.
              </p>
            </div>
            <Switch
              id="notifications"
              checked={form.watch("notificationsEnabled")}
              onCheckedChange={(checked: boolean) =>
                form.setValue("notificationsEnabled", checked)
              }
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label>Default View</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Choose how you want to view your tasks by default.
              </p>
              <RadioGroup
                value={form.watch("defaultView")}
                onValueChange={(value: "list" | "grid") =>
                  form.setValue("defaultView", value)
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="list" id="list" />
                  <Label htmlFor="list">List</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="grid" id="grid" />
                  <Label htmlFor="grid">Grid</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Choose your preferred theme.
              </p>
              <RadioGroup
                value={form.watch("theme")}
                onValueChange={(value: "light" | "dark" | "system") =>
                  form.setValue("theme", value)
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system">System</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Preferences
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 