import { Badge } from "@/components/ui/Badge";
import type { BedStatus, OrderStatus, CleanStatus } from "@/types";

type StatusType = BedStatus | OrderStatus | CleanStatus;

const bedStatusMap: Record<BedStatus, { label: string; variant: "success" | "info" | "warning" | "danger" }> = {
  available: { label: "可用", variant: "success" },
  occupied: { label: "使用中", variant: "info" },
  maintenance: { label: "维护中", variant: "warning" },
  damaged: { label: "已损坏", variant: "danger" },
};

const orderStatusMap: Record<OrderStatus, { label: string; variant: "default" | "info" | "warning" | "success" | "danger" }> = {
  pending: { label: "待支付", variant: "default" },
  active: { label: "使用中", variant: "info" },
  returning: { label: "归还中", variant: "warning" },
  completed: { label: "已完成", variant: "success" },
  cancelled: { label: "已取消", variant: "danger" },
  manual_closed: { label: "人工关闭", variant: "warning" },
};

const cleanStatusMap: Record<CleanStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
  clean: { label: "已清洁", variant: "success" },
  need_clean: { label: "待清洁", variant: "warning" },
  heavily_soiled: { label: "重度污染", variant: "danger" },
};

interface StatusBadgeProps {
  status: StatusType;
  type?: "bed" | "order" | "clean";
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  let config: { label: string; variant: "success" | "available" | "warning" | "danger" | "info" | "default" };

  if (type === "bed") {
    config = bedStatusMap[status as BedStatus];
  } else if (type === "order") {
    config = orderStatusMap[status as OrderStatus];
  } else if (type === "clean") {
    config = cleanStatusMap[status as CleanStatus];
  } else {
    if (status in bedStatusMap) {
      config = bedStatusMap[status as BedStatus];
    } else if (status in orderStatusMap) {
      config = orderStatusMap[status as OrderStatus];
    } else {
      config = cleanStatusMap[status as CleanStatus];
    }
  }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

export function BedStatusBadge({ status, className }: { status: BedStatus; className?: string }) {
  return <StatusBadge status={status} type="bed" className={className} />;
}

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return <StatusBadge status={status} type="order" className={className} />;
}

export function CleanStatusBadge({ status, className }: { status: CleanStatus; className?: string }) {
  return <StatusBadge status={status} type="clean" className={className} />;
}
