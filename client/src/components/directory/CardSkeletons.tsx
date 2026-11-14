type CardSkeletonsProps = {
  variant: "person" | "team";
  count?: number;
};

const cardGrid = {
  person: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3",
  team: "grid grid-cols-1 gap-3 xl:grid-cols-2",
};

export const StatSkeletons = () => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <div
        key={index}
        className="bg-brand-200/70 h-[116px] animate-pulse rounded-2xl"
      />
    ))}
  </div>
);

export const CardSkeletons = ({ variant, count = 6 }: CardSkeletonsProps) => (
  <div className={`${cardGrid[variant]} mt-4`}>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className={`bg-brand-200/70 animate-pulse rounded-2xl ${
          variant === "person" ? "h-[212px]" : "h-[260px]"
        }`}
      />
    ))}
  </div>
);
