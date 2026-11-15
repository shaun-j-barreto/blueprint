import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="from-brand-200 to-brand-100 flex min-h-screen flex-col bg-gradient-to-b">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none"
        >
          <span className="border-brand-500/80 bg-slate-900 flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold text-white">
            B
          </span>
          <span className="text-brand-900 text-base font-semibold tracking-tight">
            BluePrint
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="text-brand-700 px-4 py-6 text-center text-[11px]">
        <p>
          BluePrint keeps your projects, tasks, and team in one shared
          workspace.
        </p>
      </footer>
    </div>
  );
}
