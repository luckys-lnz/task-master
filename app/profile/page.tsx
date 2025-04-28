"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, Mail, MapPin, Edit } from "lucide-react"
import { ProfileEditForm } from "@/components/profile-edit-form"

export default function ProfilePage() {
  // This would come from authentication in a real app
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john@example.com",
    avatar: "/placeholder.svg?height=128&width=128",
    joinDate: "January 2023",
    location: "San Francisco, CA",
    bio: "Task management enthusiast and productivity geek. I love organizing my work and helping others do the same.",
    stats: {
      tasksCreated: 248,
      tasksCompleted: 187,
      completionRate: "75%",
    },
    badges: [
      { name: "Early Adopter", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
      { name: "Power User", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
      { name: "Completionist", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
    ],
  })

  const [isEditing, setIsEditing] = useState(false)

  const handleSaveProfile = (updatedProfile: any) => {
    setUser({
      ...user,
      ...updatedProfile,
    })
    setIsEditing(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {isEditing ? (
          <div className="md:col-span-3">
            <ProfileEditForm
              profile={{
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                location: user.location,
                bio: user.bio,
              }}
              onSave={handleSaveProfile}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <>
            <Card className="md:col-span-1">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold mt-4">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>

                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  <span>Joined {user.joinDate}</span>
                </div>

                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{user.location}</span>
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
                  <p>{user.bio}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Statistics</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{user.stats.tasksCreated}</p>
                      <p className="text-xs text-muted-foreground">Tasks Created</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{user.stats.tasksCompleted}</p>
                      <p className="text-xs text-muted-foreground">Tasks Completed</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{user.stats.completionRate}</p>
                      <p className="text-xs text-muted-foreground">Completion Rate</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Badges</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.badges.map((badge, index) => (
                      <Badge key={index} className={badge.color}>
                        {badge.name}
                      </Badge>
                    ))}
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
