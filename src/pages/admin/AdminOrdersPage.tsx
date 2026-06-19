import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Eye,
  XCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { useOrderStore } from '@/store/useOrderStore';
import { useRecordStore } from '@/store/useRecordStore';
import { formatDateTime, formatDuration } from '@/utils/dateUtils';
import { calculateFee } from '@/utils/feeCalculator';
import type { Order, OrderStatus, CloseReason, ManualCloseRecord } from '@/types';

const ADMIN_NAME_KEY = 'admin_name';

const statusBadgeMap: Record<
  OrderStatus,
  { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; label: string }
> = {
  active: { variant: 'success', label: '进行中' },
  pending: { variant: 'warning', label: '待支付' },
  completed: { variant: 'info', label: '已完成' },
  manual_closed: { variant: 'warning', label: '人工关闭' },
  cancelled: { variant: 'default', label: '已取消' },
  returning: { variant: 'warning', label: '归还中' },
};

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'manual_closed', label: '人工关闭' },
  { value: 'cancelled', label: '已取消' },
  { value: 'pending', label: '待支付' },
  { value: 'returning', label: '归还中' },
];

const closeReasonOptions = [
  { value: 'timeout', label: '超时未还', description: '用户超过合理时间未归还陪护床' },
  { value: 'device_failure', label: '设备故障', description: '扫码设备或锁具出现故障' },
  { value: 'user_complaint', label: '用户投诉', description: '用户投诉后协商关闭订单' },
  { value: 'staff_adjustment', label: '医护调整', description: '医护人员床位调配需要' },
  { value: 'other', label: '其他', description: '其他特殊原因，需填写备注说明' },
];

const feeAdjustmentOptions = [
  { value: 'full_waiver', label: '全额减免', description: '不收取任何费用，全额退还押金' },
  { value: 'partial_waiver', label: '部分减免', description: '按百分比减免部分费用' },
  { value: 'normal_charge', label: '正常计费', description: '按照实际使用时长正常计费' },
];

interface ViewOrderModalProps {
  order: Order | null;
  onClose: () => void;
}

function ViewOrderModal({ order, onClose }: ViewOrderModalProps) {
  if (!order) return null;

  const statusConfig = statusBadgeMap[order.status];
  const duration = order.durationMinutes
    ? formatDuration(order.durationMinutes)
    : order.startTime
    ? formatDuration(
        Math.max(1, Math.round((Date.now() - new Date(order.startTime).getTime()) / (1000 * 60)))
      )
    : '-';

  return (
    <Modal open={!!order} onClose={onClose} title="订单详情" width="max-w-xl">
      <div className="space-y-5">
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
          <div>
            <div className="text-xs text-gray-500 mb-1">订单编号</div>
            <div className="text-sm font-mono font-medium text-gray-900">{order.id}</div>
          </div>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">床号</div>
            <div className="text-sm font-medium text-gray-900">{order.bedNumber}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">病区</div>
            <div className="text-sm font-medium text-gray-900">{order.ward}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">用户手机号</div>
            <div className="text-sm font-medium text-gray-900">{order.userPhone}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">押金</div>
            <div className="text-sm font-medium text-gray-900">¥{order.depositAmount.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">开始时间</div>
            <div className="text-sm font-medium text-gray-900">{formatDateTime(order.startTime)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">结束时间</div>
            <div className="text-sm font-medium text-gray-900">
              {order.endTime ? formatDateTime(order.endTime) : '-'}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-gray-500 mb-1">使用时长</div>
            <div className="text-sm font-medium text-gray-900">{duration}</div>
          </div>
        </div>

        {order.feeDetail && (
          <div className="border-t border-gray-100 pt-4">
            <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
              <FileText size={16} className="text-medical-blue" />
              费用明细
            </div>
            <div className="space-y-2 p-4 rounded-xl bg-gray-50">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">基础费用</span>
                <span className="text-gray-900">¥{order.feeDetail.baseFee.toFixed(2)}</span>
              </div>
              {order.feeDetail.nightCapDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-600">夜间封顶优惠</span>
                  <span className="text-indigo-600">-¥{order.feeDetail.nightCapDiscount.toFixed(2)}</span>
                </div>
              )}
              {order.feeDetail.dailyCapDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-life-green-dark">每日封顶优惠</span>
                  <span className="text-life-green-dark">-¥{order.feeDetail.dailyCapDiscount.toFixed(2)}</span>
                </div>
              )}
              {order.feeDetail.cleaningFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">清洁费</span>
                  <span className="text-gray-900">+¥{order.feeDetail.cleaningFee.toFixed(2)}</span>
                </div>
              )}
              {order.feeDetail.damageDeduction > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-danger-red">损坏赔偿</span>
                  <span className="text-danger-red">+¥{order.feeDetail.damageDeduction.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-medium text-gray-900">总计应付</span>
                <span className="font-bold text-medical-blue-dark text-base">
                  ¥{order.feeDetail.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">实付金额</div>
                <div className="text-sm font-semibold text-danger-red">
                  ¥{(order.actualPayment || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">押金退还</div>
                <div className="text-sm font-semibold text-life-green-dark">
                  ¥{(order.depositRefund || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface CloseOrderModalProps {
  order: Order | null;
  onClose: () => void;
  onConfirm: (data: {
    closeReason: CloseReason;
    closeRemark?: string;
    feeAdjustment: 'full_waiver' | 'partial_waiver' | 'normal_charge';
    waiverPercent?: number;
  }) => void;
}

function CloseOrderModal({ order, onClose, onConfirm }: CloseOrderModalProps) {
  const [closeReason, setCloseReason] = useState<string>('timeout');
  const [closeRemark, setCloseRemark] = useState('');
  const [feeAdjustment, setFeeAdjustment] = useState<string>('normal_charge');
  const [waiverPercent, setWaiverPercent] = useState('50');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (order) {
      setCloseReason('timeout');
      setCloseRemark('');
      setFeeAdjustment('normal_charge');
      setWaiverPercent('50');
      setErrors({});
    }
  }, [order]);

  if (!order) return null;

  const handleConfirm = () => {
    const newErrors: { [key: string]: string } = {};

    if (closeReason === 'other' && !closeRemark.trim()) {
      newErrors.closeRemark = '请填写其他原因说明';
    }

    if (feeAdjustment === 'partial_waiver') {
      const percent = Number(waiverPercent);
      if (isNaN(percent) || percent < 0 || percent > 100) {
        newErrors.waiverPercent = '请输入0-100之间的有效百分比';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm({
      closeReason: closeReason as CloseReason,
      closeRemark: closeRemark.trim() || undefined,
      feeAdjustment: feeAdjustment as 'full_waiver' | 'partial_waiver' | 'normal_charge',
      waiverPercent: feeAdjustment === 'partial_waiver' ? Number(waiverPercent) : undefined,
    });
  };

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <AlertCircle size={20} className="text-danger-red" />
          <span>人工关闭订单</span>
        </div>
      }
      width="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 text-danger-red text-sm font-medium mb-2">
            <AlertCircle size={16} />
            关闭确认
          </div>
          <div className="text-xs text-gray-600 space-y-0.5">
            <div>订单号：<span className="font-mono">{order.id}</span></div>
            <div>床号：{order.bedNumber} / 病区：{order.ward}</div>
            <div>开始时间：{formatDateTime(order.startTime)}</div>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-900 mb-3">关闭原因</div>
          <RadioGroup
            name="closeReason"
            value={closeReason}
            onChange={(val) => setCloseReason(String(val))}
            options={closeReasonOptions}
          />
        </div>

        {closeReason === 'other' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              其他原因说明 <span className="text-danger-red">*</span>
            </label>
            <textarea
              value={closeRemark}
              onChange={(e) => setCloseRemark(e.target.value)}
              placeholder="请详细说明关闭原因..."
              rows={3}
              className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                errors.closeRemark
                  ? 'border-danger-red/50 focus:ring-danger-red/30 focus:border-danger-red'
                  : 'border-gray-300 focus:ring-medical-blue/30 focus:border-medical-blue'
              } resize-none`}
            />
            {errors.closeRemark && (
              <p className="mt-1.5 text-xs text-danger-red">{errors.closeRemark}</p>
            )}
          </div>
        )}

        <div>
          <div className="text-sm font-medium text-gray-900 mb-3">费用调整方式</div>
          <RadioGroup
            name="feeAdjustment"
            value={feeAdjustment}
            onChange={(val) => setFeeAdjustment(String(val))}
            options={feeAdjustmentOptions}
          />
        </div>

        {feeAdjustment === 'partial_waiver' && (
          <div className="pl-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              减免比例（%）<span className="text-danger-red">*</span>
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={waiverPercent}
                onChange={(e) => setWaiverPercent(e.target.value)}
                placeholder="50"
                min={0}
                max={100}
                error={!!errors.waiverPercent}
                errorMessage={errors.waiverPercent}
                suffixIcon={<span className="text-xs text-gray-500">%</span>}
                className="max-w-[200px]"
              />
              <div className="text-xs text-gray-500">
                预估费用：¥
                {(() => {
                  const fee = calculateFee(order.startTime, new Date().toISOString());
                  const percent = Number(waiverPercent) || 0;
                  const finalFee = Number((fee.totalAmount * (1 - percent / 100)).toFixed(2));
                  return finalFee.toFixed(2);
                })()}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            确认关闭订单
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminOrdersPage() {
  const { orders, initOrders, manualCloseOrder } = useOrderStore();
  const { addRecord, initRecords } = useRecordStore();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [closeOrder, setCloseOrder] = useState<Order | null>(null);

  const adminName = localStorage.getItem(ADMIN_NAME_KEY) || '管理员';

  useEffect(() => {
    initOrders();
    initRecords();
  }, [initOrders, initRecords]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(kw) ||
          o.bedNumber.toLowerCase().includes(kw) ||
          o.userPhone.includes(kw)
      );
    }

    if (status) {
      result = result.filter((o) => o.status === status);
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, keyword, status]);

  const handleCloseOrder = (data: {
    closeReason: CloseReason;
    closeRemark?: string;
    feeAdjustment: 'full_waiver' | 'partial_waiver' | 'normal_charge';
    waiverPercent?: number;
  }) => {
    if (!closeOrder) return;

    let adjustedAmount: number | undefined;
    if (data.feeAdjustment === 'partial_waiver' && data.waiverPercent !== undefined) {
      const fee = calculateFee(closeOrder.startTime, new Date().toISOString());
      adjustedAmount = Number((fee.totalAmount * (1 - data.waiverPercent / 100)).toFixed(2));
    }

    const updatedOrder = manualCloseOrder(closeOrder.id, {
      closeReason: data.closeReason,
      operator: adminName,
      feeAdjustment: data.feeAdjustment,
      adjustedAmount,
    });

    if (updatedOrder) {
      const now = new Date().toISOString();
      const recordData: ManualCloseRecord = {
        type: 'manual_close',
        closeReason: data.closeReason,
        closeRemark: data.closeRemark,
        closeTime: now,
      };

      addRecord({
        orderId: updatedOrder.id,
        bedNumber: updatedOrder.bedNumber,
        type: 'manual_close',
        operator: adminName,
        data: recordData,
        createdAt: now,
      });
    }

    setCloseOrder(null);
  };

  return (
    <div className="space-y-5">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[280px] max-w-md">
              <Input
                placeholder="搜索订单ID / 床号 / 手机号"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                prefixIcon={<Search size={18} />}
              />
            </div>
            <div className="w-44">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={statusOptions}
                placeholder="全部状态"
              />
            </div>
            <Button>
              <Search size={16} />
              搜索
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-3 border-b border-gray-100">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText size={18} className="text-medical-blue" />
            订单列表
            <span className="text-sm font-normal text-gray-500">
              （共 {filteredOrders.length} 条）
            </span>
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  订单ID
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  床号
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  病区
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  手机号
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  开始时间
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  费用
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-gray-400 text-sm">
                    暂无订单数据
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusConfig = statusBadgeMap[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-sm font-mono text-gray-900">
                        {order.id}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {order.bedNumber}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{order.ward}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{order.userPhone}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDateTime(order.startTime)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">
                        ¥{(order.actualPayment ?? 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {order.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setCloseOrder(order)}
                            >
                              <XCircle size={14} />
                              人工关闭
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setViewOrder(order)}
                            >
                              <Eye size={14} />
                              查看
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ViewOrderModal order={viewOrder} onClose={() => setViewOrder(null)} />
      <CloseOrderModal
        order={closeOrder}
        onClose={() => setCloseOrder(null)}
        onConfirm={handleCloseOrder}
      />
    </div>
  );
}
