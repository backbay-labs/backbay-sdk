"use client";
import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | ReactNode;
  description?: string | ReactNode;
  header?: ReactNode;
  icon?: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "row-span-1 rounded-xl group/bento transition duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] p-4 bg-[rgba(2,4,10,0.85)] backdrop-blur-xl border border-white/[0.06] justify-between flex flex-col space-y-4",
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon}
        <div className="font-sans font-bold text-[var(--glia-color-text-primary,#CBD5E1)] mb-2 mt-2">
          {title}
        </div>
        <div className="font-sans font-normal text-[var(--glia-color-text-soft,#64748B)] text-xs">
          {description}
        </div>
      </div>
    </div>
  );
};
