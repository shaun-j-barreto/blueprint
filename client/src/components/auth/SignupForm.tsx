"use client";

import { authClient, useSession } from "@/lib/auth-client";
import { loginHref, safeAuthRedirect } from "@/lib/auth";
import {
  authCardStyles,
  authErrorStyles,
  authInputStyles,
  authLabelStyles,
  authPrimaryButtonStyles,
} from "@/components/auth/styles";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ._-]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 10;

const validate = ({
  username,
  email,
  password,
  confirmPassword,
}: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}): string | null => {
  if (username.length < 3 || username.length > 40) {
    return "Username must be between 3 and 40 characters.";
  }

  if (!USERNAME_PATTERN.test(username)) {
    return "Username can only use letters, numbers, spaces, dots, dashes, and underscores.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
};

const passwordScore = (value: string): number => {
  let score = 0;
  if (value.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (value.length >= 14) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1;
  return score;
};

const SignupForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeAuthRedirect(searchParams.get("next"));
  const { data: session } = useSession();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const strength = useMemo(() => passwordScore(password), [password]);
  const strengthLabel =
    strength <= 1 ? "Weak" : strength === 2 ? "Fair" : strength === 3 ? "Good" : "Strong";
  const strengthTone =
    strength <= 1
      ? "bg-rose-500"
      : strength === 2
        ? "bg-amber-500"
        : strength === 3
          ? "bg-lime-500"
          : "bg-emerald-500";

  useEffect(() => {
    if (session?.user) router.replace(nextPath);
  }, [session?.user, nextPath, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const validationError = validate({
      username: trimmedUsername,
      email: trimmedEmail,
      password,
      confirmPassword,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: trimmedUsername,
        email: trimmedEmail,
        password,
      });

      if (signUpError) {
        setError(
          signUpError.message?.trim() ||
            "We could not create your account. Please try again.",
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
            Get started
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-brand-900">
            Create your account
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-brand-700">
            Your workspace starts empty. Create your first project once you are
            in.
          </p>
        </div>
        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-500/70 bg-brand-200 text-indigo-600 sm:flex">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <form className="mt-6 space-y-3.5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="signup-username" className={authLabelStyles}>
            Username
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-brand-700/70"
              aria-hidden="true"
            />
            <input
              id="signup-username"
              type="text"
              name="username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={40}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="How your team will see you"
              className={`${authInputStyles} pl-10`}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup-email" className={authLabelStyles}>
            Email
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-brand-700/70"
              aria-hidden="true"
            />
            <input
              id="signup-email"
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
          <label htmlFor="signup-password" className={authLabelStyles}>
            Password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-brand-700/70"
              aria-hidden="true"
            />
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 10 characters"
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

          {password.length > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex flex-1 gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((segment) => (
                  <span
                    key={segment}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      segment < strength ? strengthTone : "bg-brand-500/70"
                    }`}
                  />
                ))}
              </div>
              <span
                aria-live="polite"
                className="text-[10px] font-medium text-brand-700"
              >
                {password.length < MIN_PASSWORD_LENGTH
                  ? `At least ${MIN_PASSWORD_LENGTH} characters`
                  : strengthLabel}
              </span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="signup-confirm-password" className={authLabelStyles}>
            Confirm password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-brand-700/70"
              aria-hidden="true"
            />
            <input
              id="signup-confirm-password"
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              className={`${authInputStyles} pl-10`}
              disabled={isSubmitting}
            />
          </div>
          {confirmPassword.length > 0 && confirmPassword !== password && (
            <p className="mt-1 text-[10px] font-medium text-rose-600">
              Passwords do not match yet.
            </p>
          )}
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
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          )}
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-brand-700">
        Already have an account?{" "}
        <Link
          href={loginHref(nextPath)}
          className="font-semibold text-brand-900 underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default SignupForm;
