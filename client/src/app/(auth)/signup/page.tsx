import type { Metadata } from "next";
import { Suspense } from "react";
import AuthFormFallback from "@/components/auth/AuthFormFallback";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a BluePrint workspace and start planning your projects.",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <SignupForm />
    </Suspense>
  );
}
