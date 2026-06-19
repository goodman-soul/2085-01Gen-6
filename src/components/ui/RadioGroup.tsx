import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RadioGroupOption {
  value: string | number;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  options: RadioGroupOption[];
  className?: string;
  optionClassName?: string;
  direction?: "horizontal" | "vertical";
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  options,
  className,
  optionClassName,
  direction = "vertical",
}) => {
  const [internalValue, setInternalValue] = React.useState<string | number | undefined>(
    defaultValue ?? controlledValue
  );
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleChange = (value: string | number) => {
    if (!isControlled) {
      setInternalValue(value);
    }
    onChange?.(value);
  };

  return (
    <div
      role="radiogroup"
      className={cn(
        direction === "vertical" ? "flex flex-col gap-3" : "flex flex-wrap gap-3",
        className
      )}
    >
      {options.map((option) => {
        const isSelected = currentValue === option.value;
        const isDisabled = option.disabled;

        return (
          <label
            key={option.value}
            className={cn(
              "relative flex items-start gap-3",
              "p-4 rounded-lg border-2 cursor-pointer",
              "transition-all duration-200",
              isSelected
                ? "border-medical-blue bg-medical-blue/5"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
              isDisabled && "opacity-50 cursor-not-allowed hover:border-gray-200 hover:bg-white",
              optionClassName
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => !isDisabled && handleChange(option.value)}
              className="sr-only"
            />
            <div
              className={cn(
                "flex-shrink-0 mt-0.5",
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                "transition-all duration-200",
                isSelected
                  ? "border-medical-blue bg-medical-blue"
                  : "border-gray-300 bg-white",
                isDisabled && "cursor-not-allowed"
              )}
              aria-hidden="true"
            >
              {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-medical-blue-dark" : "text-gray-900"
                )}
              >
                {option.label}
              </div>
              {option.description && (
                <div className="mt-0.5 text-xs text-gray-500">{option.description}</div>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
};

RadioGroup.displayName = "RadioGroup";
