import type { Metadata } from "next";
import InvitePage from "@/components/auth/InviteAccept";

export const metadata: Metadata = {
  title: "Accept invitation",
  robots: { index: false, follow: false },
};

export default function InviteTokenPage() {
  return <InvitePage />;
}
