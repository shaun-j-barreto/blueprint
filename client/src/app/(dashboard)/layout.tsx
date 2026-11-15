import DashboardWrapper from "@/app/dashboardWrapper";
import RequireAuth from "@/components/auth/RequireAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <DashboardWrapper>{children}</DashboardWrapper>
    </RequireAuth>
  );
}
