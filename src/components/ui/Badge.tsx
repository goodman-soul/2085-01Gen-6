import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "success" | "available" | "warning" | "danger" | "info" | "default";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  success:
    "bg-life-green-light text-life-green-dark border-life-green/30",
  available:
    "bg-life-green-light text-life-green-dark border-life-green/30",
  warning:
    "bg-amber-50 text-warn-orange border-warn-orange/30",
  danger:
    "bg-red-50 text-danger-red border-danger-red/30",
  info:
    "bg-medical-blue-light text-medical-blue-dark border-medical-blue/30",
  default:
    "bg-gray-100 text-gray-600 border-gray-200",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1",
        "px-2.5 py-0.5 text-xs font-medium",
        "rounded-full border",
        "transition-colors duration-150",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
);

Badge.displayName = "Badge";
