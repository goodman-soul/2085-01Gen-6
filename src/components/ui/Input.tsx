import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  error?: boolean;
  errorMessage?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, prefixIcon, suffixIcon, error, errorMessage, ...props }, ref) => {
    const inputWrapperClass = cn(
      "relative flex items-center w-full",
      "h-10 px-3 rounded-lg border",
      "bg-white",
      "transition-all duration-150",
      "focus-within:ring-2 focus-within:ring-offset-0",
      error
        ? "border-danger-red/50 focus-within:ring-danger-red/30 focus-within:border-danger-red"
        : "border-gray-300 focus-within:ring-medical-blue/30 focus-within:border-medical-blue",
      props.disabled && "bg-gray-50 cursor-not-allowed opacity-70"
    );

    const inputClass = cn(
      "w-full h-full bg-transparent outline-none text-sm",
      "text-gray-900 placeholder:text-gray-400",
      prefixIcon && "pl-2",
      suffixIcon && "pr-2",
      className
    );

    return (
      <div className="w-full">
        <div className={inputWrapperClass}>
          {prefixIcon && (
            <span className="inline-flex items-center justify-center text-gray-400 mr-1.5 shrink-0">
              {prefixIcon}
            </span>
          )}
          <input
            ref={ref}
            className={inputClass}
            {...props}
          />
          {suffixIcon && (
            <span className="inline-flex items-center justify-center text-gray-400 ml-1.5 shrink-0">
              {suffixIcon}
            </span>
          )}
        </div>
        {error && errorMessage && (
          <p className="mt-1.5 text-xs text-danger-red">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
