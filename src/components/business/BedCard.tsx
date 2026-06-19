import { Bed, MapPin, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Bed as BedType, BedStatus } from "@/types";
import { cn } from "@/lib/utils";

interface BedCardProps {
  bed: BedType;
  onClick?: () => void;
}

const statusMap: Record<BedStatus, { label: string; variant: "success" | "available" | "warning" | "danger" | "info" | "default" }> = {
  available: { label: "可用", variant: "success" },
  occupied: { label: "使用中", variant: "info" },
  maintenance: { label: "维护中", variant: "warning" },
  damaged: { label: "已损坏", variant: "danger" },
};

export function BedCard({ bed, onClick }: BedCardProps) {
  const isAvailable = bed.status === "available";
  const isDisabled = bed.status === "occupied" || bed.status === "damaged";

  return (
    <Card
      className={cn(
        "p-5 cursor-pointer transition-all duration-200",
        isAvailable && "hover:shadow-lg hover:-translate-y-0.5 border-life-green/50 hover:border-life-green",
        bed.status === "occupied" && "bg-gray-50 border-gray-200 opacity-80 cursor-not-allowed",
        bed.status === "damaged" && "bg-gray-50 border-danger-red/30 opacity-80 cursor-not-allowed",
        bed.status === "maintenance" && "border-warn-orange/40"
      )}
      onClick={() => !isDisabled && onClick?.()}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isAvailable && "bg-life-green-light",
              bed.status === "occupied" && "bg-medical-blue-light",
              bed.status === "maintenance" && "bg-amber-50",
              bed.status === "damaged" && "bg-red-50"
            )}
          >
            <Bed
              className={cn(
                "w-6 h-6",
                isAvailable && "text-life-green-dark",
                bed.status === "occupied" && "text-medical-blue-dark",
                bed.status === "maintenance" && "text-warn-orange",
                bed.status === "damaged" && "text-danger-red"
              )}
            />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-wide">
              {bed.bedNumber}
            </h3>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{bed.ward} · {bed.floor}楼</span>
            </div>
          </div>
        </div>
        <Badge variant={statusMap[bed.status].variant}>
          {statusMap[bed.status].label}
        </Badge>
      </div>

      <div className="space-y-2 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-gray-500">
            <DollarSign className="w-4 h-4" />
            时租金
          </span>
          <span className="font-semibold text-gray-900">¥{bed.hourlyRate}/小时</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 pl-5.5">押金</span>
          <span className="font-semibold text-gray-900">¥{bed.depositAmount}</span>
        </div>
      </div>
    </Card>
  );
}
