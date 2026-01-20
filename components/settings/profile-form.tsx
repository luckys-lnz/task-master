"use client";

import { useState, useEffect } from "react";
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
import { useSession } from "next-auth/react";

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
  const { update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.image || null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      avatarUrl: user.image || "",
    },
  });

  // Fetch current user's avatar from database on mount
  useEffect(() => {
    const fetchCurrentAvatar = async () => {
      try {
        const response = await fetch("/api/user/profile", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          // Use avatar_url if available, otherwise fall back to image
          const currentAvatar = userData.avatar_url || userData.image || null;
          if (currentAvatar) {
            setAvatarUrl(currentAvatar);
            form.setValue("avatarUrl", currentAvatar);
            // Update session to reflect current avatar
            await updateSession({
              image: currentAvatar,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching current avatar:", error);
        // Silently fail - user can still use the form
      }
    };

    fetchCurrentAvatar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleAvatarChange = async (url: string) => {
    setAvatarUrl(url);
    form.setValue("avatarUrl", url);
    
    // The upload endpoint already updates the database, so we just need to:
    // 1. Update the session to reflect the new avatar
    // 2. Refresh the UI
    
    try {
      // Update NextAuth session to reflect new avatar immediately
      await updateSession({
        image: url,
      });

      // Refresh to update the UI with new avatar
      router.refresh();
      
      toast({
        title: "Profile updated",
        description: "Your avatar has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating session:", error);
      // Still show success since the upload and database update succeeded
      toast({
        title: "Upload successful",
        description: "Avatar uploaded and saved. Refreshing...",
        variant: "default",
      });
      router.refresh();
    }
  };

  const handleAvatarRemove = () => {
    setAvatarUrl(null);
    form.setValue("avatarUrl", "");
  };

  const handleSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);

    try {
      // Prepare the request body
      const trimmedName = data.name.trim();
      if (trimmedName.length < 3) {
        toast({
          title: "Validation Error",
          description: "Display name must be at least 3 characters",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Determine avatarUrl - prefer state value, then form value, or undefined
      // Only include avatarUrl if it's a valid non-empty string
      let finalAvatarUrl: string | undefined = undefined;
      
      if (avatarUrl && avatarUrl.trim()) {
        finalAvatarUrl = avatarUrl.trim();
      } else if (data.avatarUrl && data.avatarUrl.trim()) {
        finalAvatarUrl = data.avatarUrl.trim();
      }

      // Build request body - only include avatarUrl if it has a valid value
      const requestBody: { name: string; avatarUrl?: string } = {
        name: trimmedName,
      };
      
      // Only add avatarUrl if it's a valid string (not null, not undefined, not empty)
      if (finalAvatarUrl && typeof finalAvatarUrl === 'string' && finalAvatarUrl.length > 0) {
        requestBody.avatarUrl = finalAvatarUrl;
      }

      // Log request for debugging
      console.log("Profile update request:", requestBody);

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // If response is not JSON, get text instead
          const text = await response.text();
          console.error("Non-JSON error response:", text);
          throw new Error(`Failed to update profile: ${response.status} ${response.statusText}`);
        }
        
        // Log full error details for debugging
        console.error("Profile update error response:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        
        const errorMessage = errorData.details 
          ? errorData.details.map((d: { message: string; path?: string }) => 
              `${d.path ? `${d.path}: ` : ""}${d.message}`
            ).join(", ")
          : errorData.error || "Failed to update profile";
        throw new Error(errorMessage);
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