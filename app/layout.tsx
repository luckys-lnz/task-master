import AuthSessionProvider from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import './globals.css';
import Link from "next/link";
import { CheckSquare } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserNav } from "@/components/user-nav";
import type { Metadata } from 'next';
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { LoadingScreen } from "@/components/loading-screen";
import { PageTransition } from "@/components/page-transition";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Task Master',
  description: 'A modern task management application',
  icons: {
    icon: [
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LoadingScreen />
          <AuthSessionProvider>
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-background/95 dark:supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <CheckSquare className="h-6 w-6 text-primary" />
                  <span className="font-semibold text-foreground">Task Master</span>
                </Link>
                <div className="flex items-center gap-4">
                  <ThemeSwitcher />
                  <UserNav />
                </div>
              </div>
            </header>
            <main className="w-full">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
          </AuthSessionProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
