import type { Metadata } from "next";
import AuthScreen from "@/components/auth/AuthScreen";
import InvitePage from "@/components/auth/InviteAccept";

export const metadata: Metadata = {
  title: "Accept invitation",
  robots: { index: false, follow: false },
};

export default function InviteTokenPage() {
  return (
    <AuthScreen width="lg">
      <InvitePage />
    </AuthScreen>
  );
}
