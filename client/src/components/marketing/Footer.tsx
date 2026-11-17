import { CalendarRange, Columns3, List, Table2 } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "./blueprint";

const PRODUCT_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#product", label: "Product" },
  { href: "#workflow", label: "Workflow" },
];

const ACCOUNT_LINKS = [
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Create account" },
  { href: "/home", label: "Dashboard" },
];

const VIEWS = [
  { icon: Columns3, label: "Board" },
  { icon: List, label: "List" },
  { icon: Table2, label: "Table" },
  { icon: CalendarRange, label: "Timeline" },
];

export default function Footer({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <footer className="border-brand-500/70 bg-brand-100 relative overflow-hidden border-t">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent"
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr] md:gap-12">
          <div>
            <BrandMark />
            <p className="text-brand-700 mt-5 max-w-xs text-xs leading-relaxed">
              A shared workspace for small product teams. Plan projects, track
              tasks, and keep everyone facing the same blueprint.
            </p>

            <ul className="mt-5 flex flex-wrap gap-1.5">
              {VIEWS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="border-brand-500/70 bg-brand-200/60 text-brand-700 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold"
                >
                  <Icon
                    className="h-3 w-3 text-indigo-500"
                    aria-hidden="true"
                  />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Product">
            <p className="text-brand-700 font-mono text-[9px] font-semibold tracking-[0.18em] uppercase">
              Product
            </p>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-brand-700 hover:text-brand-900 text-xs font-medium transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Account">
            <p className="text-brand-700 font-mono text-[9px] font-semibold tracking-[0.18em] uppercase">
              Account
            </p>
            <ul className="mt-4 space-y-2.5">
              {ACCOUNT_LINKS.filter(
                (link) => isSignedIn || link.href !== "/home",
              ).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-brand-700 hover:text-brand-900 text-xs font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-brand-500/70 mt-12 flex flex-col items-start justify-between gap-3 border-t pt-6 sm:flex-row sm:items-center">
          <p className="text-brand-700 text-xs">
            © {new Date().getFullYear()} BluePrint. Built for focused teams.
          </p>
          <p className="text-brand-700/80 font-mono text-[9px] font-semibold tracking-[0.18em] uppercase">
            Plan the work / ship the blueprint
          </p>
        </div>
      </div>
    </footer>
  );
}
