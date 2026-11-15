import { authCardStyles } from "@/components/auth/styles";

const AuthFormFallback = () => (
  <div className={authCardStyles} aria-hidden="true">
    <div className="animate-pulse space-y-3">
      <div className="bg-brand-300 h-2.5 w-24 rounded" />
      <div className="bg-brand-300 h-7 w-52 rounded-lg" />
      <div className="bg-brand-300 h-2.5 w-full max-w-xs rounded" />
    </div>
    <div className="mt-6 animate-pulse space-y-4">
      <div className="space-y-1.5">
        <div className="bg-brand-300 h-2.5 w-12 rounded" />
        <div className="bg-brand-200 h-10 w-full rounded-lg" />
      </div>
      <div className="space-y-1.5">
        <div className="bg-brand-300 h-2.5 w-16 rounded" />
        <div className="bg-brand-200 h-10 w-full rounded-lg" />
      </div>
      <div className="bg-brand-300 h-10 w-full rounded-lg" />
    </div>
  </div>
);

export default AuthFormFallback;
