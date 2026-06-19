import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, error, errorMessage, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "w-full h-10 px-3 pr-9 rounded-lg border appearance-none",
              "bg-white text-sm text-gray-900",
              "transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              error
                ? "border-danger-red/50 focus:ring-danger-red/30 focus:border-danger-red"
                : "border-gray-300 focus:ring-medical-blue/30 focus:border-medical-blue",
              !props.value && placeholder && "text-gray-400",
              props.disabled && "bg-gray-50 cursor-not-allowed opacity-70",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && errorMessage && (
          <p className="mt-1.5 text-xs text-danger-red">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
