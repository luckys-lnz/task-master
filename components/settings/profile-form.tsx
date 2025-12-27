"use client";

import { useState } from "react";
import { User } from "next-auth";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AvatarUpload } from "./avatar-upload";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/components/ui/use-toast";

const profileSchema = z.object({
  name: z.string().min(3, "Display name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  avatarUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.image || null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      avatarUrl: user.image || "",
    },
  });

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url);
    form.setValue("avatarUrl", url);
  };

  const handleAvatarRemove = () => {
    setAvatarUrl(null);
    form.setValue("avatarUrl", "");
  };

  const handleSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name.trim(),
          avatarUrl: avatarUrl || data.avatarUrl || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      {/* Profile Picture Section */}
      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-sm font-semibold">Profile Picture</Label>
          <p className="text-xs text-muted-foreground">
            Upload a photo to personalize your account. This will be visible to others.
          </p>
        </div>
        <AvatarUpload
          currentAvatarUrl={avatarUrl}
          userName={form.watch("name") || user.name || undefined}
          onAvatarChange={handleAvatarChange}
          onRemove={handleAvatarRemove}
          disabled={isLoading}
        />
      </div>

      <Separator className="my-8" />

      {/* Personal Information Section */}
      <div className="space-y-6">
        <div className="space-y-1">
          <Label className="text-sm font-semibold">Personal Information</Label>
          <p className="text-xs text-muted-foreground">
            Update your personal details and how others see you.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Display Name
            </Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter your full name"
              className="max-w-lg"
              aria-invalid={!!form.formState.errors.name}
              aria-describedby={form.formState.errors.name ? "name-error" : "name-help"}
              disabled={isLoading}
            />
            {form.formState.errors.name ? (
              <p id="name-error" className="text-sm text-destructive mt-1">
                {form.formState.errors.name.message}
              </p>
            ) : (
              <p id="name-help" className="text-xs text-muted-foreground mt-1">
                This is how your name will appear to others.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Email Address</Label>
            <div className="max-w-lg">
              <Input
                value={user.email || ""}
                disabled
                className="bg-muted/50 cursor-not-allowed"
                aria-label="Email address (read-only)"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Your email address cannot be changed here. Contact support if you need to update it.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            form.reset();
            setAvatarUrl(user.image || null);
          }}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
} 