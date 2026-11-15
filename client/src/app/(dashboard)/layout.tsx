"use client";

import DashboardWrapper from "@/app/dashboardWrapper";
import StoreProvider from "@/app/redux";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireOnboarding from "@/components/auth/RequireOnboarding";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The store has to sit above RequireOnboarding: the gate reads the current
  // user through RTK Query, and the shell below it shares that same store.
  return (
    <RequireAuth>
      <StoreProvider>
        <RequireOnboarding>
          <DashboardWrapper>{children}</DashboardWrapper>
        </RequireOnboarding>
      </StoreProvider>
    </RequireAuth>
  );
}
