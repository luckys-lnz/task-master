"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Camera, Loader2 } from "lucide-react"

interface ProfileEditFormProps {
  profile: {
    name: string
    email: string
    avatarUrl: string
    location: string
    bio: string
  }
  onSave: (profile: any) => void
  onCancel: () => void
}

export function ProfileEditForm({ profile, onSave, onCancel }: ProfileEditFormProps) {
  const [formData, setFormData] = useState({ ...profile })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)

      // Get signed URL for upload
      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { signedUrl, avatarUrl } = await response.json()

      // Upload to S3
      await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      // Update form data with new avatar URL
      setFormData((prev) => ({ ...prev, avatarUrl }))

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSave(formData)
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={formData.avatarUrl} alt={formData.name} />
                <AvatarFallback>
                  {formData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <span className="sr-only">Upload avatar</span>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageChange}
                disabled={isUploading}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Click the camera icon to change your profile picture</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself"
                rows={4}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/50 flex justify-between">
          <Button type="button" onClick={onCancel} disabled={isLoading || isUploading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isUploading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
