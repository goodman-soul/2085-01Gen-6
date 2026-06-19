import { AlertTriangle, RotateCcw, ShieldCheck, XCircle, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type {
  ExceptionRecord,
  NightCapRecord,
  DepositRefundRecord,
  BedDamageRecord,
  ManualCloseRecord,
  DamageLevel,
  CloseReason,
} from "@/types";

const typeConfig = {
  night_cap: {
    label: "夜间封顶",
    variant: "success" as const,
    icon: ShieldCheck,
  },
  deposit_refund: {
    label: "押金退还",
    variant: "info" as const,
    icon: RotateCcw,
  },
  bed_damage: {
    label: "床位损坏",
    variant: "danger" as const,
    icon: AlertTriangle,
  },
  manual_close: {
    label: "人工关闭",
    variant: "warning" as const,
    icon: XCircle,
  },
};

const damageLevelMap: Record<DamageLevel, string> = {
  minor: "轻微",
  moderate: "中等",
  severe: "严重",
};

const closeReasonMap: Record<CloseReason, string> = {
  timeout: "超时未归还",
  device_failure: "设备故障",
  user_complaint: "用户投诉",
  staff_adjustment: "人工调整",
  other: "其他原因",
};

interface RecordCardProps {
  record: ExceptionRecord;
}

function renderNightCapContent(data: NightCapRecord) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">时段</span>
        <span className="font-medium text-gray-900">{data.nightStart} ~ {data.nightEnd}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">原费用时长</span>
        <span className="font-medium text-gray-900">{data.originalHours.toFixed(1)} 小时</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">封顶后时长</span>
        <span className="font-medium text-life-green-dark">{data.cappedHours.toFixed(1)} 小时</span>
      </div>
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-life-green-light/50">
        <span className="text-sm font-medium text-life-green-dark">节省金额</span>
        <span className="text-lg font-bold text-life-green-dark">-¥{data.savedAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}

function renderDepositRefundContent(data: DepositRefundRecord) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-medical-blue-light/50">
        <span className="text-sm font-medium text-medical-blue-dark">退款金额</span>
        <span className="text-lg font-bold text-medical-blue-dark">¥{data.refundAmount.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">退款方式</span>
        <span className="font-medium text-gray-900">{data.refundMethod}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">状态</span>
        <Badge variant="success">已完成</Badge>
      </div>
      {data.remark && (
        <div className="flex items-start justify-between gap-4 text-sm pt-2 border-t border-gray-100">
          <span className="text-gray-500 whitespace-nowrap">备注</span>
          <span className="font-medium text-gray-900 text-right">{data.remark}</span>
        </div>
      )}
    </div>
  );
}

function renderBedDamageContent(data: BedDamageRecord) {
  const levelVariant = data.damageLevel === "minor" ? "warning" : data.damageLevel === "moderate" ? "warning" : "danger";
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">损坏等级</span>
        <Badge variant={levelVariant}>{damageLevelMap[data.damageLevel]}</Badge>
      </div>
      <div className="flex items-start justify-between gap-4 text-sm">
        <span className="text-gray-500 whitespace-nowrap">损坏描述</span>
        <span className="font-medium text-gray-900 text-right">{data.damageDescription}</span>
      </div>
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50">
        <span className="text-sm font-medium text-danger-red">扣费金额</span>
        <span className="text-lg font-bold text-danger-red">-¥{data.deductionAmount.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">处理状态</span>
        <Badge variant="success">已处理</Badge>
      </div>
    </div>
  );
}

function renderManualCloseContent(data: ManualCloseRecord) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">关闭原因</span>
        <Badge variant="warning">{closeReasonMap[data.closeReason]}</Badge>
      </div>
      {data.closeRemark && (
        <div className="flex items-start justify-between gap-4 text-sm">
          <span className="text-gray-500 whitespace-nowrap">详细说明</span>
          <span className="font-medium text-gray-900 text-right">{data.closeRemark}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">费用调整方式</span>
        <span className="font-medium text-gray-900">按实际时长结算</span>
      </div>
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50">
        <span className="text-sm font-medium text-warn-orange">调整后金额</span>
        <span className="text-lg font-bold text-warn-orange">已结算</span>
      </div>
    </div>
  );
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

export function RecordCard({ record }: RecordCardProps) {
  const config = typeConfig[record.type];
  const Icon = config.icon;

  const renderContent = () => {
    switch (record.type) {
      case "night_cap":
        return renderNightCapContent(record.data as NightCapRecord);
      case "deposit_refund":
        return renderDepositRefundContent(record.data as DepositRefundRecord);
      case "bed_damage":
        return renderBedDamageContent(record.data as BedDamageRecord);
      case "manual_close":
        return renderManualCloseContent(record.data as ManualCloseRecord);
      default:
        return null;
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              record.type === "night_cap"
                ? "bg-life-green-light"
                : record.type === "deposit_refund"
                ? "bg-medical-blue-light"
                : record.type === "bed_damage"
                ? "bg-red-50"
                : "bg-amber-50"
            }`}
          >
            <Icon
              className={`w-5 h-5 ${
                record.type === "night_cap"
                  ? "text-life-green-dark"
                  : record.type === "deposit_refund"
                  ? "text-medical-blue-dark"
                  : record.type === "bed_damage"
                  ? "text-danger-red"
                  : "text-warn-orange"
              }`}
            />
          </div>
          <div>
            <Badge variant={config.variant}>{config.label}</Badge>
            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
              <Info className="w-3 h-3" />
              <span>床位 {record.bedNumber}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 pb-4 border-b border-gray-100">{renderContent()}</div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>操作人：{record.operator}</span>
        <span>{formatTime(record.createdAt)}</span>
      </div>
    </Card>
  );
}
