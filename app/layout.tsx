import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { GeistSans, GeistMono } from 'geist/font'
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { CheckSquare } from "lucide-react"
import Link from "next/link"
import './globals.css'

const geistSans = GeistSans
const geistMono = GeistMono

export const metadata: Metadata = {
  title: 'Task Master',
  description: 'A beautiful task management application',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary/90",
          card: "bg-background text-foreground border-border",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "border-border hover:bg-accent",
          formFieldInput: "border-border focus:ring-primary",
          footerActionLink: "text-primary hover:text-primary/90",
          userButtonPopoverCard: "bg-background text-foreground border-border",
          userButtonPopoverActionButton: "text-foreground hover:bg-accent",
          userButtonPopoverActionButtonText: "text-foreground",
          userButtonPopoverActionButtonIcon: "text-foreground",
          userButtonPopoverFooter: "text-foreground",
          userButtonPopoverRootBox: "bg-background",
          userButtonTrigger: "text-foreground",
          userPreviewMainIdentifier: "text-foreground",
          userPreviewSecondaryIdentifier: "text-muted-foreground",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <header className="flex items-center justify-between p-4 h-16 border-b sticky top-0 z-50 bg-background">
              <Link href="/" className="flex items-center gap-2">
                <CheckSquare className="h-6 w-6" />
                <span className="font-semibold">Task Master</span>
              </Link>
              <div className="flex items-center gap-4">
                <ThemeSwitcher />
                <SignedOut>
                  <SignInButton />
                  <SignUpButton />
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </header>
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
