"use client";

import { authClient, useSession } from "@/lib/auth-client";
import { safeAuthRedirect, signupHref } from "@/lib/auth";
import {
  authCardStyles,
  authErrorStyles,
  authInputStyles,
  authLabelStyles,
  authPrimaryButtonStyles,
} from "@/components/auth/styles";
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeAuthRedirect(searchParams.get("next"));
  const { data: session } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user) router.replace(nextPath);
  }, [session?.user, nextPath, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { error: signInError } = await authClient.signIn.email({
        email: trimmedEmail,
        password,
        rememberMe: true,
      });

      if (signInError) {
        setError(
          signInError.message?.trim() ||
            "We could not sign you in. Check your details and try again.",
        );
        setIsSubmitting(false);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className={authCardStyles}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-brand-700 uppercase">
            Welcome back
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-brand-900">
            Sign in to BluePrint
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-brand-700">
            Pick up where you left off and keep your projects moving.
          </p>
        </div>
        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-500/70 bg-brand-200 text-indigo-600 sm:flex">
          <Lock className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email" className={authLabelStyles}>
            Email
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-brand-700/70"
              aria-hidden="true"
            />
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className={`${authInputStyles} pl-10`}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className={authLabelStyles}>
            Password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-brand-700/70"
              aria-hidden="true"
            />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              className={`${authInputStyles} pr-11 pl-10`}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-brand-700 transition-colors hover:bg-brand-300 hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className={authErrorStyles}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className={authPrimaryButtonStyles}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogIn className="h-4 w-4" aria-hidden="true" />
          )}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-brand-500/80" />
        <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-brand-700 uppercase">
          New here?
        </span>
        <span className="h-px flex-1 bg-brand-500/80" />
      </div>

      <p className="mt-4 text-center text-xs text-brand-700">
        <Link
          href={signupHref(nextPath)}
          className="font-semibold text-brand-900 underline-offset-2 hover:underline"
        >
          Create an account
        </Link>{" "}
        and start with an empty workspace.
      </p>
    </div>
  );
};

export default LoginForm;
