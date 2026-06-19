import { useEffect, useState } from "react";
import { QrCode, Camera } from "lucide-react";

interface ScanAnimationProps {
  onComplete?: () => void;
}

export function ScanAnimation({ onComplete }: ScanAnimationProps) {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComplete(true);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const Corner = ({ position }: { position: "tl" | "tr" | "bl" | "br" }) => {
    const baseClass = "absolute w-8 h-8 border-medical-blue";
    const positionClasses = {
      tl: "top-0 left-0 border-t-4 border-l-4 rounded-tl-xl",
      tr: "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl",
      bl: "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl",
      br: "bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl",
    };
    return <div className={`${baseClass} ${positionClasses[position]}`} />;
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative w-64 h-64">
        <div className="absolute inset-0 rounded-full bg-medical-blue/10 animate-pulse-ring" />
        <div
          className="absolute inset-0 rounded-full bg-medical-blue/5 animate-pulse-ring"
          style={{ animationDelay: "0.5s" }}
        />

        <div className="absolute inset-6 rounded-2xl bg-white shadow-xl overflow-hidden">
          <div className="absolute inset-4 rounded-xl border-2 border-medical-blue/30 overflow-hidden">
            <Corner position="tl" />
            <Corner position="tr" />
            <Corner position="bl" />
            <Corner position="br" />

            <div className="absolute inset-0 flex items-center justify-center">
              <QrCode className="w-32 h-32 text-gray-300" />
            </div>

            {!isComplete && (
              <div className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-medical-blue to-transparent rounded-full shadow-lg animate-scan-line" />
            )}

            {isComplete && (
              <div className="absolute inset-0 bg-life-green/10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-life-green flex items-center justify-center animate-bounce">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-life-green-dark">扫码成功</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-gray-500">
        <Camera className="w-5 h-5" />
        <span className="text-sm">{isComplete ? "识别成功" : "请将二维码对准扫描框"}</span>
      </div>
    </div>
  );
}
