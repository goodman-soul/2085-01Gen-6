import { DollarSign, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { FeeDetail } from "@/types";

interface FeeBreakdownProps {
  feeDetail: FeeDetail;
  depositAmount?: number;
  showTotal?: boolean;
}

export function FeeBreakdown({ feeDetail, depositAmount = 200, showTotal = true }: FeeBreakdownProps) {
  const actualPayment = feeDetail.totalAmount;
  const depositRefund = depositAmount - feeDetail.totalAmount;
  const showDepositSection = showTotal;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <DollarSign className="w-5 h-5 text-medical-blue-dark" />
        <h3 className="text-lg font-semibold text-gray-900">费用明细</h3>
      </div>

      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">基础费用</span>
          <span className="text-sm font-medium text-gray-900">¥{feeDetail.baseFee.toFixed(2)}</span>
        </div>

        {feeDetail.nightCapDiscount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">夜间封顶减免</span>
              <Badge variant="success" className="gap-1 py-0.5">
                <Sparkles className="w-3 h-3" />
                优惠
              </Badge>
            </div>
            <span className="text-sm font-medium text-life-green-dark">-¥{feeDetail.nightCapDiscount.toFixed(2)}</span>
          </div>
        )}

        {feeDetail.dailyCapDiscount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">全天封顶减免</span>
              <Badge variant="success" className="gap-1 py-0.5">
                <Sparkles className="w-3 h-3" />
                优惠
              </Badge>
            </div>
            <span className="text-sm font-medium text-life-green-dark">-¥{feeDetail.dailyCapDiscount.toFixed(2)}</span>
          </div>
        )}

        {feeDetail.cleaningFee > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">清洁费用</span>
            <span className="text-sm font-medium text-warn-orange">+¥{feeDetail.cleaningFee.toFixed(2)}</span>
          </div>
        )}

        {feeDetail.damageDeduction > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">损坏扣费</span>
            <span className="text-sm font-medium text-danger-red">+¥{feeDetail.damageDeduction.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="my-5 border-t border-dashed border-gray-200" />

      {showDepositSection && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-gray-700">实付金额</span>
            <span className="text-2xl font-bold text-gray-900">¥{actualPayment.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">押金金额</span>
            <span className="text-sm font-medium text-gray-900">¥{depositAmount.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-life-green-light/60 border border-life-green/20">
            <span className="text-sm font-medium text-life-green-dark">应退押金</span>
            <span className="text-2xl font-bold text-life-green-dark">¥{Math.max(0, depositRefund).toFixed(2)}</span>
          </div>
        </div>
      )}
      {!showDepositSection && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-gray-700">费用总计</span>
            <span className="text-2xl font-bold text-gray-900">¥{actualPayment.toFixed(2)}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
