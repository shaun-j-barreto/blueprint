import type { Metadata } from "next";
import { Suspense } from "react";
import AuthFormFallback from "@/components/auth/AuthFormFallback";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your BluePrint workspace.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
