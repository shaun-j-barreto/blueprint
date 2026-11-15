"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAppSelector } from "./redux";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  // Store the path the drawer was opened on. Comparing it with the current
  // path closes the drawer automatically after navigation (including
  // back/forward) without an extra render pass.
  const [mobileSidebarPath, setMobileSidebarPath] = useState<string | null>(
    null,
  );
  const pathname = usePathname();
  const isMobileSidebarOpen = mobileSidebarPath === pathname;
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  const closeMobileSidebar = () => setMobileSidebarPath(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // A resized desktop window should not keep the mobile scroll lock active.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileSidebarPath(null);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Back/forward navigation should always dismiss the drawer.
  useEffect(() => {
    const handlePopState = () => setMobileSidebarPath(null);

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileSidebarPath(null);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileSidebarOpen]);

  return (
    <div className="bg-brand-100 text-brand-800 flex min-h-screen w-full">
      <div
        id="sidebar-backdrop"
        className={`fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[1px] transition-opacity duration-200 min-[1024px]:hidden ${
          isMobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMobileSidebar}
        aria-hidden="true"
      />
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />
      <main
        className={`bg-brand-100 flex w-full flex-col ${
          isSidebarCollapsed ? "" : "min-[1024px]:pl-64"
        }`}
      >
        <Navbar
          isMobileSidebarOpen={isMobileSidebarOpen}
          onOpenMobileSidebar={() => setMobileSidebarPath(pathname)}
        />
        {children}
      </main>
    </div>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};
export default DashboardWrapper;
