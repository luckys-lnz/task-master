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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/components/ui/use-toast";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  avatarUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      avatarUrl: user.image || "",
      location: "",
      bio: "",
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      // Refresh the page to update the session
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
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
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update your profile information and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={form.watch("avatarUrl") || user.image || ""} alt={user.name || ""} />
              <AvatarFallback>
                {form.watch("name")?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-medium">{form.watch("name") || user.name || "User"}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter your name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="avatarUrl" className="text-sm font-medium">
                Avatar URL
              </label>
              <Input
                id="avatarUrl"
                {...form.register("avatarUrl")}
                className="mt-1"
                placeholder="https://example.com/avatar.jpg"
                type="url"
              />
              {form.formState.errors.avatarUrl && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.avatarUrl.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Enter a URL to your profile picture
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 