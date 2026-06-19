import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  BedDouble,
  MapPin,
  Sparkles,
  CircleDot,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { FeeBreakdown } from '@/components/business/FeeBreakdown';
import { OrderTimer } from '@/components/business/OrderTimer';
import { useOrderStore } from '@/store/useOrderStore';
import { useRecordStore } from '@/store/useRecordStore';
import { useBedStore } from '@/store/useBedStore';
import { wards } from '@/utils/mockData';
import { calculateFee } from '@/utils/feeCalculator';
import { formatDateTime } from '@/utils/dateUtils';
import { CleanStatus, FeeDetail } from '@/types';

const CLEANING_FEE_MAP: Record<CleanStatus, number> = {
  clean: 0,
  need_clean: 20,
  heavily_soiled: 50,
};

export default function ReturnPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { initOrders, getOrderById, completeOrder } = useOrderStore();
  const { addRecord } = useRecordStore();
  const { initBeds } = useBedStore();

  const [bedNumber, setBedNumber] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [cleanStatus, setCleanStatus] = useState<CleanStatus>('clean');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewEndTime] = useState(new Date().toISOString());

  useEffect(() => {
    initOrders();
    initBeds();
  }, [initOrders, initBeds]);

  const order = orderId ? getOrderById(orderId) : undefined;

  useEffect(() => {
    if (order) {
      setBedNumber(order.bedNumber);
      setSelectedWard(order.ward);
    }
  }, [order]);

  const wardOptions = wards.map((w) => ({ value: w, label: w }));

  const previewFee: FeeDetail = useMemo(() => {
    if (!order) {
      return {
        baseFee: 0,
        nightCapDiscount: 0,
        dailyCapDiscount: 0,
        damageDeduction: 0,
        cleaningFee: 0,
        totalAmount: 0,
      };
    }
    return calculateFee(order.startTime, previewEndTime, {
      cleaningFee: CLEANING_FEE_MAP[cleanStatus],
    });
  }, [order, previewEndTime, cleanStatus]);

  const depositRefund = order
    ? Number(Math.max(0, order.depositAmount - previewFee.totalAmount).toFixed(2))
    : 0;

  const handleSubmit = async () => {
    if (!order || !orderId) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const endTime = new Date().toISOString();
      const feeDetail = calculateFee(order.startTime, endTime, {
        cleaningFee: CLEANING_FEE_MAP[cleanStatus],
      });

      const updatedOrder = completeOrder(orderId, {
        endTime,
        cleanStatus,
        returnWard: selectedWard || order.ward,
      });

      if (!updatedOrder) {
        throw new Error('归还失败，请重试');
      }

      const now = new Date().toISOString();

      if (feeDetail.nightCapDiscount > 0) {
        const nightStart = new Date(order.startTime);
        nightStart.setHours(22, 0, 0, 0);
        const nightEnd = new Date(nightStart);
        nightEnd.setDate(nightEnd.getDate() + 1);
        nightEnd.setHours(6, 0, 0, 0);

        addRecord({
          orderId: updatedOrder.id,
          bedNumber: updatedOrder.bedNumber,
          type: 'night_cap',
          operator: '系统',
          createdAt: now,
          data: {
            type: 'night_cap',
            nightStart: formatDateTime(nightStart),
            nightEnd: formatDateTime(nightEnd),
            originalHours: 10,
            cappedHours: 8,
            savedAmount: feeDetail.nightCapDiscount,
          },
        });
      }

      addRecord({
        orderId: updatedOrder.id,
        bedNumber: updatedOrder.bedNumber,
        type: 'deposit_refund',
        operator: '系统',
        createdAt: now,
        data: {
          type: 'deposit_refund',
          refundAmount: depositRefund,
          refundMethod: '微信原路退回',
          refundTime: now,
          remark: cleanStatus === 'clean' ? '正常归还，费用结算完成' : `扣清洁费¥${CLEANING_FEE_MAP[cleanStatus]}后退回`,
        },
      });

      navigate(`/orders/${updatedOrder.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '归还失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white px-5 py-4 border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center mr-3 -ml-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">归还确认</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-5">
          <AlertCircle className="w-16 h-16 text-danger-red mb-4" />
          <p className="text-gray-900 font-semibold mb-1">未找到订单信息</p>
          <p className="text-sm text-gray-500 mb-6">请返回订单列表</p>
          <Link to="/orders">
            <Button variant="primary">查看订单</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-white px-5 py-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/orders/${order.id}`)}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center mr-3 -ml-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">归还确认</h1>
        </div>
      </header>

      <main className="px-5 py-5 space-y-5">
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-warn-orange/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-warn-orange/20 flex items-center justify-center">
                  <BedDouble className="w-6 h-6 text-warn-orange" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{order.bedNumber}</h2>
                  <p className="text-sm text-gray-500">{order.ward}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">已用时长</p>
                <OrderTimer startTime={order.startTime} endTime={previewEndTime} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              开始时间: {formatDateTime(order.startTime)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">归还信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">床号</label>
              <Input
                value={bedNumber}
                onChange={(e) => setBedNumber(e.target.value)}
                prefixIcon={<BedDouble className="w-4 h-4" />}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">归还病区</label>
              <Select
                options={wardOptions}
                placeholder="请选择病区"
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">清洁状态</label>
              <RadioGroup
                name="cleanStatus"
                value={cleanStatus}
                onChange={(v) => setCleanStatus(v as CleanStatus)}
                options={[
                  {
                    value: 'clean',
                    label: (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-life-green" />
                        <span>已清洁</span>
                      </div>
                    ),
                    description: <span className="text-life-green-dark">无额外费用</span>,
                  },
                  {
                    value: 'need_clean',
                    label: (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-warn-orange" />
                        <span>需清洁</span>
                      </div>
                    ),
                    description: <span className="text-warn-orange">+ ¥20 清洁费</span>,
                  },
                  {
                    value: 'heavily_soiled',
                    label: (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-danger-red" />
                        <span>污渍严重</span>
                      </div>
                    ),
                    description: <span className="text-danger-red">+ ¥50 深度清洁费</span>,
                  },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CircleDot className="w-5 h-5 text-medical-blue" />
              费用预览
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FeeBreakdown feeDetail={previewFee} showTotal={false} />
            <div className="flex items-center justify-between p-4 bg-life-green-light/50 rounded-xl border border-life-green/20">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-life-green-dark" />
                <span className="text-sm text-life-green-dark font-medium">预计退还押金</span>
              </div>
              <span className="text-xl font-bold text-life-green-dark tabular-nums">
                ¥{depositRefund.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger-red shrink-0 mt-0.5" />
            <p className="text-sm text-danger-red">{errorMsg}</p>
          </div>
        )}

        <div className="sticky bottom-0 -mx-5 px-5 py-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
          <Button
            variant="primary"
            size="lg"
            className="w-full shadow-lg"
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                归还中...
              </>
            ) : (
              <>确认归还</>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
