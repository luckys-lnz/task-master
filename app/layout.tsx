import { ThemeProvider } from "@/components/theme-provider"
import './globals.css'
import AuthSessionProvider from "@/components/session-provider"
import Link from "next/link"
import { CheckSquare } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Toaster } from "sonner";

import type { Metadata } from 'next'

// Import GeistSans and GeistMono from the appropriate package
import { GeistSans, GeistMono } from 'geist/font'

const geistSans = GeistSans
const geistMono = GeistMono

export const metadata: Metadata = {
  title: 'Task Master',
  description: 'Task Master, Stay on top of your tasks',
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthSessionProvider>
            <header className="flex items-center justify-between p-4 h-16 border-b sticky top-0 z-50 bg-background">
              <Link href="/" className="flex items-center gap-2">
                <CheckSquare className="h-6 w-6" />
                <span className="font-semibold">Task Master</span>
              </Link>
              <div className="flex items-center gap-4">
                <ThemeSwitcher />
                {/* <AuthButtons /> */}
              </div>
            </header>
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            <Toaster position="bottom-right" />
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
