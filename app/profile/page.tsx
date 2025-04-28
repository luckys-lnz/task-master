"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, Mail, MapPin, Edit } from "lucide-react"
import { ProfileEditForm } from "@/components/profile-edit-form"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"
import { format } from "date-fns"

interface UserStats {
  tasksCreated: number
  tasksCompleted: number
  completionRate: string
}

interface UserProfile {
  name: string
  email: string
  avatarUrl: string
  location: string
  bio: string
  createdAt: string
}

export default function ProfilePage() {
  const { user } = useUser()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/profile/stats')
        ])

        if (!profileRes.ok || !statsRes.ok) {
          throw new Error('Failed to fetch profile data')
        }

        const [profileData, statsData] = await Promise.all([
          profileRes.json(),
          statsRes.json()
        ])

        setProfile(profileData)
        setStats(statsData)
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [toast])

  const handleSaveProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedData = await response.json()
      setProfile(updatedData)
      setIsEditing(false)

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Failed to load profile data</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {isEditing ? (
          <div className="md:col-span-3">
            <ProfileEditForm
              profile={profile}
              onSave={handleSaveProfile}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <>
            <Card className="md:col-span-1">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  <AvatarFallback>
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold mt-4">{profile.name}</h2>
                <p className="text-sm text-muted-foreground">{profile.email}</p>

                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  <span>Joined {format(new Date(profile.createdAt), 'MMMM yyyy')}</span>
                </div>

                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{profile.location || 'Not specified'}</span>
                </div>

                <Button className="mt-6 w-full" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>About</CardTitle>
                <CardDescription>Your personal information and statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
                  <p>{profile.bio || 'No bio provided'}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Statistics</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{stats.tasksCreated}</p>
                      <p className="text-xs text-muted-foreground">Tasks Created</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{stats.tasksCompleted}</p>
                      <p className="text-xs text-muted-foreground">Tasks Completed</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{stats.completionRate}</p>
                      <p className="text-xs text-muted-foreground">Completion Rate</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Badges</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.tasksCompleted >= 100 && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        Task Master
                      </Badge>
                    )}
                    {stats.tasksCompleted >= 50 && (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        Power User
                      </Badge>
                    )}
                    {Number(stats.completionRate.replace('%', '')) >= 80 && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Completionist
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/50 flex justify-between">
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                <Button variant="outline" size="sm">
                  Export Data
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
