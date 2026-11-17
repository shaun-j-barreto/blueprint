import {
  CalendarRange,
  Columns3,
  LayoutDashboard,
  List,
  Mail,
  Search,
  ShieldCheck,
  Table2,
  Users,
} from "lucide-react";

const CAPABILITIES = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Columns3, label: "Board" },
  { icon: List, label: "List" },
  { icon: Table2, label: "Table" },
  { icon: CalendarRange, label: "Timeline" },
  { icon: Search, label: "Scoped search" },
  { icon: Users, label: "People" },
  { icon: ShieldCheck, label: "Roles" },
  { icon: Mail, label: "Invitations" },
];

export default function CapabilityStrip() {
  return (
    <section
      aria-label="Workspace capabilities"
      className="relative overflow-hidden border-y border-white/10 bg-[#0b1120] py-6"
    >
      <div
        aria-hidden="true"
        className="blueprint-grid-dark absolute inset-0 opacity-40"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-[12%] h-24 w-[380px] -translate-y-1/2 rounded-full bg-indigo-500/15 blur-[70px]"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 right-[8%] h-24 w-[300px] -translate-y-1/2 rounded-full bg-cyan-400/10 blur-[70px]"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-10">
        <div className="shrink-0">
          <p className="font-mono text-[9px] font-semibold tracking-[0.22em] text-indigo-300 uppercase">
            One workspace
            <span className="mx-2 text-white/25">/</span>
            Every view
          </p>
          <p className="mt-1.5 hidden text-xs text-slate-400 lg:block">
            Nine primitives. No tab-hopping.
          </p>
        </div>

        <div className="marquee-pause relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="animate-marquee-x flex w-max items-center">
            {[0, 1].map((copy) => (
              <ul
                key={copy}
                aria-hidden={copy === 1}
                className="flex items-center gap-2.5 pr-2.5"
              >
                {CAPABILITIES.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-2.5 text-[11px] font-semibold whitespace-nowrap text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-indigo-400/40 hover:bg-white/[0.08]"
                  >
                    <Icon
                      className="h-3.5 w-3.5 text-indigo-300 transition-colors group-hover:text-cyan-300"
                      aria-hidden="true"
                    />
                    {label}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
