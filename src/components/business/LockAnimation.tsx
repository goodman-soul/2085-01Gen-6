import { Lock, Unlock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type LockState = "locked" | "unlocking" | "unlocked";

interface LockAnimationProps {
  state: LockState;
}

export function LockAnimation({ state }: LockAnimationProps) {
  const isLocked = state === "locked";
  const isUnlocking = state === "unlocking";
  const isUnlocked = state === "unlocked";

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative w-32 h-32 mb-6">
        {isUnlocking && (
          <div className="absolute inset-0 rounded-full bg-medical-blue/20 animate-ping" />
        )}
        {isUnlocked && (
          <div className="absolute inset-0 rounded-full bg-life-green/20 animate-pulse" />
        )}

        <div
          className={cn(
            "absolute inset-2 rounded-full flex items-center justify-center transition-all duration-500",
            isLocked && "bg-gray-100 border-4 border-gray-200",
            isUnlocking && "bg-medical-blue-light border-4 border-medical-blue/40",
            isUnlocked && "bg-life-green-light border-4 border-life-green/40"
          )}
        >
          {isLocked && (
            <Lock className="w-14 h-14 text-gray-500" />
          )}
          {isUnlocking && (
            <div className="animate-spin">
              <Unlock className="w-14 h-14 text-medical-blue-dark" />
            </div>
          )}
          {isUnlocked && (
            <CheckCircle className="w-14 h-14 text-life-green-dark" strokeWidth={2} />
          )}
        </div>
      </div>

      <div className="text-center">
        <div
          className={cn(
            "text-xl font-bold mb-2 transition-colors duration-300",
            isLocked && "text-gray-700",
            isUnlocking && "text-medical-blue-dark",
            isUnlocked && "text-life-green-dark"
          )}
        >
          {isLocked && "已锁定"}
          {isUnlocking && "正在开锁..."}
          {isUnlocked && "解锁成功"}
        </div>
        <p className="text-sm text-gray-500 max-w-xs">
          {isLocked && "请扫码后开始使用陪护床"}
          {isUnlocking && "正在与设备通信，请稍候"}
          {isUnlocked && "陪护床已解锁，请您放心使用"}
        </p>
      </div>

      {isUnlocking && (
        <div className="mt-6 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-medical-blue animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-medical-blue animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-medical-blue animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      )}
    </div>
  );
}
