import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BluePrint — plan projects and ship together",
    template: "%s · BluePrint",
  },
  description:
    "Plan projects, track tasks, and keep your team in sync from one shared workspace. Board, list, table, and timeline views built for small product teams.",
  applicationName: "BluePrint",
  keywords: [
    "project management",
    "task tracking",
    "team workspace",
    "product roadmap",
    "kanban",
    "timeline",
  ],
  authors: [{ name: "BluePrint" }],
  creator: "BluePrint",
  openGraph: {
    type: "website",
    siteName: "BluePrint",
    locale: "en_GB",
    url: siteUrl,
    title: "BluePrint — plan projects and ship together",
    description:
      "Plan projects, track tasks, and keep your team in sync from one shared workspace.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BluePrint — plan projects and ship together",
    description:
      "Plan projects, track tasks, and keep your team in sync from one shared workspace.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-brand-100 text-brand-800 min-h-full">{children}</body>
    </html>
  );
}
