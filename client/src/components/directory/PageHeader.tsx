import type { ReactNode } from "react";
import { EYEBROW_CLASS } from "./styles";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  right?: ReactNode;
};

export const PageHeader = ({
  eyebrow,
  title,
  subtitle,
  right,
}: PageHeaderProps) => (
  <div className="flex flex-wrap items-end justify-between gap-3 pt-5 pb-4">
    <div className="min-w-0">
      <p className={EYEBROW_CLASS}>{eyebrow}</p>
      <h1 className="text-brand-900 mt-1 text-2xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="text-brand-700 mt-1 text-xs">{subtitle}</p>
    </div>

    {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
  </div>
);
