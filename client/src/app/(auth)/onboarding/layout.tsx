import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome",
  description: "Confirm how your name appears to the team.",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
