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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

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
      <div>
        <p className="text-brand-700 text-[10px] font-semibold tracking-[0.08em] uppercase">
          Get started
        </p>
        <h1 className="text-brand-900 mt-1.5 text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-brand-700 mt-1.5 text-xs leading-relaxed">
          Your workspace starts empty. Create your first project once you are
          in.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="signup-username" className={authLabelStyles}>
            Username
          </label>
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
            className={authInputStyles}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="signup-email" className={authLabelStyles}>
            Email
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password" className={authLabelStyles}>
            Password
          </label>
          <div className="relative">
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

        <div>
          <label htmlFor="signup-confirm-password" className={authLabelStyles}>
            Confirm password
          </label>
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
            className={authInputStyles}
            disabled={isSubmitting}
          />
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
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-brand-700 mt-6 text-center text-xs">
        Already have an account?{" "}
        <Link
          href={loginHref(nextPath)}
          className="text-brand-900 font-semibold underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default SignupForm;
