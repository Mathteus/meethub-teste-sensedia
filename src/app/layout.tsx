import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import TanstackProvider from "./tanstack-provider";
import { AuthProvider } from "@/lib/auth/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MeetHub",
  description: "MeetHub - Gerencie suas reuniões com facilidade",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TanstackProvider>
          <AuthProvider>
            <NuqsAdapter>
              <body className="min-h-full flex flex-col">{children}</body>
            </NuqsAdapter>
          </AuthProvider>
        </TanstackProvider>
      </ThemeProvider>
    </html>
  );
}
