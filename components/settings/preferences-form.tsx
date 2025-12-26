"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">Default View</Label>
            <p className="text-xs text-muted-foreground">
              Choose how you want to view your tasks by default.
            </p>
          </div>
          <RadioGroup
            value={form.watch("defaultView")}
            onValueChange={(value: "list" | "grid") =>
              form.setValue("defaultView", value)
            }
            className="flex gap-8"
            aria-label="Default view selection"
          >
            <div className="flex items-center space-x-2.5">
              <RadioGroupItem value="list" id="list" />
              <Label htmlFor="list" className="font-normal cursor-pointer text-sm">
                List
              </Label>
            </div>
            <div className="flex items-center space-x-2.5">
              <RadioGroupItem value="grid" id="grid" />
              <Label htmlFor="grid" className="font-normal cursor-pointer text-sm">
                Grid
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">Theme</Label>
            <p className="text-xs text-muted-foreground">
              Choose your preferred color theme.
            </p>
          </div>
          <RadioGroup
            value={form.watch("theme")}
            onValueChange={(value: "light" | "dark" | "system") =>
              form.setValue("theme", value)
            }
            className="flex gap-8"
            aria-label="Theme selection"
          >
            <div className="flex items-center space-x-2.5">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="font-normal cursor-pointer text-sm">
                Light
              </Label>
            </div>
            <div className="flex items-center space-x-2.5">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="font-normal cursor-pointer text-sm">
                Dark
              </Label>
            </div>
            <div className="flex items-center space-x-2.5">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="font-normal cursor-pointer text-sm">
                System
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <Separator className="my-8" />

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </form>
  );
} 