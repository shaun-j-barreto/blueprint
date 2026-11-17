import type { ReactNode } from "react";

type Tone = "light" | "dark";

export function BrandMark({
  tone = "light",
  className = "",
}: {
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span
        className={`relative flex h-8 w-8 items-center justify-center rounded-[10px] text-[13px] font-black tracking-tight ${
          tone === "dark"
            ? "bg-white text-[#070a13]"
            : "bg-[#070a13] text-white"
        }`}
      >
        B
        <span
          aria-hidden="true"
          className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ${
            tone === "dark" ? "ring-[#070a13]" : "ring-brand-100"
          }`}
        />
      </span>
      <span
        className={`text-[15px] font-semibold tracking-tight ${
          tone === "dark" ? "text-white" : "text-brand-900"
        }`}
      >
        BluePrint
      </span>
    </span>
  );
}

export function Eyebrow({
  children,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] uppercase ${
        tone === "dark" ? "text-indigo-300" : "text-indigo-600"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ring-4 ${
          tone === "dark"
            ? "bg-cyan-300 ring-cyan-400/15"
            : "bg-indigo-500 ring-indigo-500/10"
        }`}
      />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "light",
  align = "left",
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: Tone;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={`${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}
    >
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2
        className={`mt-4 text-[2rem] leading-[1.06] font-semibold tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl ${
          tone === "dark" ? "text-white" : "text-brand-900"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 max-w-2xl text-sm leading-relaxed sm:text-base ${
            align === "center" ? "mx-auto" : ""
          } ${tone === "dark" ? "text-slate-300" : "text-brand-700"}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
