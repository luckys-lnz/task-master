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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Task Master',
  description: 'A modern task management application',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground`}>
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
                <UserNav />
              </div>
            </header>
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </AuthSessionProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
