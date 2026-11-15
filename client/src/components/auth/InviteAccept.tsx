"use client";

import {
  authCardStyles,
  authErrorStyles,
  authInputStyles,
  authLabelStyles,
  authPrimaryButtonStyles,
} from "@/components/auth/styles";
import StoreProvider from "@/app/redux";
import { authClient, useSession } from "@/lib/auth-client";
import { getApiErrorMessage } from "@/lib/utils";
import {
  useAcceptInvitationMutation,
  useGetInvitationPreviewQuery,
  type InvitationPreview,
} from "@/state/api";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogOut,
  MailCheck,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

const roleLabel = (role: string): string =>
  role.charAt(0) + role.slice(1).toLowerCase();

const ErrorPanel = ({
  title,
  message,
}: {
  title: string;
  message: string;
}) => (
  <div className={authCardStyles}>
    <span className="border-brand-500/80 bg-brand-200 text-brand-700 flex h-10 w-10 items-center justify-center rounded-xl border">
      <ShieldAlert className="h-5 w-5 text-amber-600" aria-hidden="true" />
    </span>
    <h1 className="text-brand-900 mt-4 text-xl font-semibold tracking-tight">
      {title}
    </h1>
    <p className="text-brand-700 mt-2 text-xs leading-relaxed">{message}</p>
    <Link
      href="/login"
      className="text-brand-900 mt-5 inline-flex items-center gap-1.5 text-xs font-semibold underline-offset-2 hover:underline"
    >
      Go to sign in
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  </div>
);

const InvitationSummary = ({
  invitation,
}: {
  invitation: InvitationPreview;
}) => (
  <div className="border-brand-500/70 bg-brand-200/60 mt-5 rounded-xl border p-3.5">
    <p className="text-brand-800 text-xs font-semibold">
      Join {invitation.workspaceName} as a {roleLabel(invitation.role)}
    </p>
    <p className="text-brand-700 mt-1 text-[11px]">
      Invited by {invitation.inviterName}
    </p>
    <p className="text-brand-700 mt-0.5 text-[11px]">
      For {invitation.maskedEmail}
    </p>

    {invitation.projects.length > 0 && (
      <ul className="mt-3 space-y-1.5">
        {invitation.projects.map((project) => (
          <li
            key={project.projectId}
            className="text-brand-800 flex items-center justify-between gap-2 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] font-medium"
          >
            <span className="truncate">{project.name}</span>
            <span className="text-brand-700 shrink-0 text-[10px]">
              {roleLabel(project.role)}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const InviteAccept = () => {
  const router = useRouter();
  const params = useParams<{ token: string | string[] }>();
  const token = Array.isArray(params?.token)
    ? (params.token[0] ?? "")
    : (params?.token ?? "");

  const previewQuery = useGetInvitationPreviewQuery(token, { skip: !token });
  const { data: session, isPending: isSessionPending } = useSession();
  const [acceptInvitation, { isLoading: isAccepting }] =
    useAcceptInvitationMutation();

  const [error, setError] = useState("");
  const [existingAccount, setExistingAccount] = useState(false);

  const invitation = previewQuery.data?.invitation;
  const signedInEmail = session?.user?.email?.toLowerCase();
  const invitedEmail = invitation?.email.toLowerCase();
  const isSignedIn = Boolean(session?.user);
  const isCorrectAccount = Boolean(
    isSignedIn && invitedEmail && signedInEmail === invitedEmail,
  );

  const accept = async () => {
    setError("");

    try {
      await acceptInvitation(token).unwrap();
      router.replace("/onboarding");
      router.refresh();
    } catch (acceptError) {
      setError(
        getApiErrorMessage(
          acceptError,
          "Could not accept the invitation. Please try again.",
        ),
      );
    }
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invitation) return;

    setError("");
    setExistingAccount(false);

    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmPassword") ?? "");

    if (name.length < 3) {
      setError("Enter the name your teammates should see.");
      return;
    }

    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }

    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email: invitation.email,
        password,
      });

      if (signUpError) {
        if (signUpError.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
          setExistingAccount(true);
          return;
        }

        setError(
          signUpError.message?.trim() ||
            "Could not create your account. Please try again.",
        );
        return;
      }

      await acceptInvitation(token).unwrap();
      router.replace("/onboarding");
      router.refresh();
    } catch (signUpFailure) {
      setError(
        getApiErrorMessage(
          signUpFailure,
          "Could not create your account. Please try again.",
        ),
      );
    }
  };

  const handleSwitchAccount = async () => {
    setError("");
    await authClient.signOut();
    router.refresh();
  };

  if (!token) {
    return (
      <ErrorPanel
        title="Invitation not found"
        message="This link is missing its token. Ask an admin for a fresh invitation."
      />
    );
  }

  if (previewQuery.isLoading) {
    return (
      <div className={authCardStyles}>
        <div className="text-brand-700 flex items-center gap-2 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Checking your invitation…
        </div>
      </div>
    );
  }

  if (previewQuery.isError || !invitation) {
    return (
      <ErrorPanel
        title="This invitation cannot be used"
        message={getApiErrorMessage(
          previewQuery.error,
          "The link is invalid, expired, or was revoked. Ask an admin for a new one.",
        )}
      />
    );
  }

  const isBusy = isAccepting || isSessionPending || previewQuery.isFetching;
  const invitePath = `/invite/${token}`;
  const loginHref = `/login?next=${encodeURIComponent(invitePath)}`;

  return (
    <div className={authCardStyles}>
      <span className="border-brand-500/80 bg-brand-200 text-brand-700 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold">
        <MailCheck className="h-3 w-3 text-indigo-500" aria-hidden="true" />
        You have been invited
      </span>

      <h1 className="text-brand-900 mt-4 text-2xl font-semibold tracking-tight">
        Join {invitation.workspaceName}
      </h1>
      <p className="text-brand-700 mt-1.5 text-xs leading-relaxed">
        {invitation.inviterName} invited you to collaborate. Accept to get
        access to your projects.
      </p>

      <InvitationSummary invitation={invitation} />

      {isSignedIn ? (
        <div className="mt-5 space-y-3">
          {isCorrectAccount ? (
            <button
              type="button"
              onClick={() => void accept()}
              disabled={isBusy}
              className={authPrimaryButtonStyles}
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              {isBusy ? "Joining…" : "Accept invitation"}
            </button>
          ) : (
            <>
              <p className={authErrorStyles}>
                You are signed in as{" "}
                <strong>{session?.user?.email ?? "another account"}</strong>.
                This invitation belongs to {invitation.maskedEmail}.
              </p>
              <button
                type="button"
                onClick={() => void handleSwitchAccount()}
                className="border-brand-500 text-brand-800 hover:bg-brand-300 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out and switch account
              </button>
            </>
          )}
        </div>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={handleSignUp}>
          <p className="text-brand-700 text-[11px]">
            Create an account for{" "}
            <strong className="text-brand-900">{invitation.email}</strong> to
            accept.
          </p>

          <div>
            <label htmlFor="invite-name" className={authLabelStyles}>
              Display name
            </label>
            <input
              id="invite-name"
              name="name"
              type="text"
              required
              minLength={3}
              maxLength={40}
              autoComplete="name"
              placeholder="How your team will see you"
              className={authInputStyles}
              disabled={isAccepting}
            />
          </div>

          <div>
            <label htmlFor="invite-password" className={authLabelStyles}>
              Password
            </label>
            <input
              id="invite-password"
              name="password"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              placeholder="At least 10 characters"
              className={authInputStyles}
              disabled={isAccepting}
            />
          </div>

          <div>
            <label htmlFor="invite-confirm-password" className={authLabelStyles}>
              Confirm password
            </label>
            <input
              id="invite-confirm-password"
              name="confirmPassword"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              placeholder="Repeat your password"
              className={authInputStyles}
              disabled={isAccepting}
            />
          </div>

          {error && (
            <p role="alert" className={authErrorStyles}>
              {error}
            </p>
          )}

          {existingAccount && (
            <p className={authErrorStyles}>
              An account already exists for this email.{" "}
              <Link
                href={loginHref}
                className="font-semibold underline underline-offset-2"
              >
                Sign in to accept
              </Link>
              .
            </p>
          )}

          <button
            type="submit"
            className={authPrimaryButtonStyles}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserPlus className="h-4 w-4" aria-hidden="true" />
            )}
            {isAccepting ? "Joining…" : "Create account and join"}
          </button>

          <p className="text-brand-700 text-center text-[11px]">
            Already have an account?{" "}
            <Link
              href={loginHref}
              className="text-brand-900 font-semibold underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}

      {isSignedIn && isCorrectAccount && error && (
        <p role="alert" className={`${authErrorStyles} mt-3`}>
          {error}
        </p>
      )}
    </div>
  );
};

const InvitePage = () => (
  <Suspense
    fallback={
      <div className={authCardStyles}>
        <Loader2
          className="text-brand-700 h-4 w-4 animate-spin"
          aria-hidden="true"
        />
      </div>
    }
  >
    <StoreProvider>
      <InviteAccept />
    </StoreProvider>
  </Suspense>
);

export default InvitePage;
