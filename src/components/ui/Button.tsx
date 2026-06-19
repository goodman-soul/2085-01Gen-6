import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-medical-blue to-medical-blue-dark text-white hover:from-medical-blue-dark hover:to-blue-700 shadow-md hover:shadow-lg focus:ring-medical-blue/50",
  secondary:
    "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm focus:ring-gray-300/50",
  success:
    "bg-life-green text-white hover:bg-life-green-dark shadow-md hover:shadow-lg focus:ring-life-green/50",
  danger:
    "bg-danger-red text-white hover:bg-red-600 shadow-md hover:shadow-lg focus:ring-danger-red/50",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-200/50",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-md gap-1",
  md: "h-10 px-4 text-sm rounded-lg gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium",
          "transition-all duration-200 ease-in-out",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && (
          <Loader2 className="animate-spin shrink-0" size={size === "sm" ? 14 : size === "md" ? 16 : 18} />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
