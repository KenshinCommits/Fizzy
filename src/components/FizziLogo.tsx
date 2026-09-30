import React from "react";
import clsx from "clsx";

export function FizziLogo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        "group flex items-center font-black lowercase tracking-tighter text-brand-blue",
        className
      )}
      style={{ fontSize: "5rem", lineHeight: 1 }}
    >
      fizzy
    </div>
  );
}
