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
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
      <div>
        <p className="text-brand-700 text-[10px] font-semibold tracking-[0.08em] uppercase">
          Welcome back
        </p>
        <h1 className="text-brand-900 mt-1.5 text-2xl font-semibold tracking-tight">
          Sign in to BluePrint
        </h1>
        <p className="text-brand-700 mt-1.5 text-xs leading-relaxed">
          Pick up where you left off and keep your projects moving.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email" className={authLabelStyles}>
            Email
          </label>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className={authInputStyles}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="login-password" className={authLabelStyles}>
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              className={`${authInputStyles} pr-10`}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="text-brand-700 hover:text-brand-900 absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
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
          {isSubmitting && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-brand-700 mt-6 text-center text-xs">
        New to BluePrint?{" "}
        <Link
          href={signupHref(nextPath)}
          className="text-brand-900 font-semibold underline-offset-2 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
