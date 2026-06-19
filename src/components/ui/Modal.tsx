import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  title?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  width?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  onClose,
  children,
  className,
  width = "max-w-lg",
  showCloseButton = true,
}) => {
  const [isMounted, setIsMounted] = React.useState(open);
  const [isVisible, setIsVisible] = React.useState(open);

  React.useEffect(() => {
    if (open) {
      setIsMounted(true);
      const timer = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(timer);
    } else if (isMounted) {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open, isMounted]);

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!isMounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "transition-opacity duration-200 ease-out",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full",
          width,
          "bg-white rounded-xl shadow-2xl",
          "transform transition-all duration-200 ease-out",
          isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4",
          className
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "inline-flex items-center justify-center",
                  "w-8 h-8 rounded-lg",
                  "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                  "transition-colors duration-150",
                  "focus:outline-none focus:ring-2 focus:ring-medical-blue/50"
                )}
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

Modal.displayName = "Modal";
