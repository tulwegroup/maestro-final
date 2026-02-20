import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maestro - Your One-Stop Operating System for Life in the UAE",
  description: "AI-powered life automation platform that handles all government services, utility bills, renewals, and payments through a single intelligent interface.",
  keywords: ["UAE", "Maestro", "Government Services", "DEWA", "RTA", "UAE Pass", "Payments", "Life Automation"],
  authors: [{ name: "Maestro Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Maestro - UAE Life Automation Platform",
    description: "Your One-Stop Operating System for Life in the UAE",
    url: "https://maestro.ae",
    siteName: "Maestro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Maestro - UAE Life Automation Platform",
    description: "Your One-Stop Operating System for Life in the UAE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background bg-pattern">
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
