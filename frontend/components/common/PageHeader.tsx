"use client";
import { cn } from "@/lib/helpers";

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("page-heading", className)}>
      <div><div className="page-context">ACADEMIC WORKSPACE</div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
