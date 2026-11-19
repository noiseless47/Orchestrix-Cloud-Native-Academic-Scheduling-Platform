"use client";
import { forwardRef, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/helpers";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { label?: string };

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { className, label, children, ...rest }, ref
) {
  return (
    <label className="w-full space-y-1 block">
      {label && <span className="field-label">{label}{rest.required && <span aria-hidden="true" className="required-mark"> *</span>}</span>}
      <select
        ref={ref}
        className={cn(
          "field-control",
          className
        )}
        {...rest}
      >
        {children}
      </select>
    </label>
  );
});
