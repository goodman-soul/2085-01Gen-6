import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderTimerProps {
  startTime: string;
  endTime?: string;
  className?: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function calculateDuration(start: string, end?: string): number {
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  return Math.max(0, Math.floor((endMs - startMs) / 1000));
}

export function OrderTimer({ startTime, endTime, className }: OrderTimerProps) {
  const [duration, setDuration] = useState(() => calculateDuration(startTime, endTime));
  const isEnded = !!endTime;

  useEffect(() => {
    if (isEnded) {
      setDuration(calculateDuration(startTime, endTime));
      return;
    }

    setDuration(calculateDuration(startTime));
    const timer = setInterval(() => {
      setDuration(calculateDuration(startTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, endTime, isEnded]);

  return (
    <div className={cn("flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/60", className)}>
      <div className="relative">
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            isEnded ? "bg-gray-400" : "bg-life-green animate-pulse"
          )}
        />
        {!isEnded && (
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-life-green animate-ping opacity-75" />
        )}
      </div>

      <div className="flex items-center gap-3">
        <Clock className={cn("w-5 h-5", isEnded ? "text-gray-400" : "text-life-green-dark")} />
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 mb-0.5">
            {isEnded ? "已结束" : "使用时长"}
          </span>
          <span
            className={cn(
              "font-mono text-3xl font-bold tracking-wider tabular-nums",
              isEnded ? "text-gray-600" : "text-gray-900"
            )}
          >
            {formatDuration(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
