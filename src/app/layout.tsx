import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MAESTROPAY - UAE Life Automation Platform",
  description: "AI-powered life automation platform that handles all government services, utility bills, renewals, and payments through a single intelligent interface.",
  keywords: ["UAE", "Maestro", "MAESTROPAY", "Government Services", "DEWA", "RTA", "UAE Pass", "Payments", "Life Automation", "Crypto", "Banking"],
  authors: [{ name: "MAESTROPAY Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "MAESTROPAY - UAE Life Automation Platform",
    description: "Your One-Stop Operating System for Life in the UAE",
    url: "https://maestropay.ae",
    siteName: "MAESTROPAY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MAESTROPAY - UAE Life Automation Platform",
    description: "Your One-Stop Operating System for Life in the UAE",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MAESTROPAY",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#14b8a6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
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
        </SessionProvider>
      </body>
    </html>
  );
}
