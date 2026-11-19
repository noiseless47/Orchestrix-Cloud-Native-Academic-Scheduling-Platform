"use client";
import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/helpers";

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string };

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, label, ...rest }, ref
) {
  return (
    <label className="w-full space-y-1 block">
      {label && <span className="field-label">{label}{rest.required && <span aria-hidden="true" className="required-mark"> *</span>}</span>}
      <input
        ref={ref}
        className={cn(
          "field-control",
          className
        )}
        {...rest}
      />
    </label>
  );
});
