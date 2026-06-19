import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Hash,
  Wallet,
  HandCoins,
  ChevronRight,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Empty from '@/components/Empty';
import { OrderTimer } from '@/components/business/OrderTimer';
import { FeeBreakdown } from '@/components/business/FeeBreakdown';
import { RecordCard } from '@/components/business/RecordCard';
import { useOrderStore } from '@/store/useOrderStore';
import { useRecordStore } from '@/store/useRecordStore';
import { formatDateTime, formatDuration } from '@/utils/dateUtils';
import { OrderStatus, Order } from '@/types';

const statusConfig: Record<OrderStatus, {
  label: string;
  variant: 'success' | 'available' | 'warning' | 'danger' | 'info' | 'default';
}> = {
  pending: { label: '待处理', variant: 'warning' },
  active: { label: '进行中', variant: 'warning' },
  returning: { label: '归还中', variant: 'info' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'default' },
  manual_closed: { label: '人工关闭', variant: 'info' },
};

const cleanStatusMap = {
  clean: { label: '已清洁', variant: 'success' as const },
  need_clean: { label: '需清洁', variant: 'warning' as const },
  heavily_soiled: { label: '污渍严重', variant: 'danger' as const },
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-all">{value}</p>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { initOrders, getOrderById } = useOrderStore();
  const { initRecords, getRecordsByOrderId } = useRecordStore();

  useEffect(() => {
    initOrders();
    initRecords();
  }, [initOrders, initRecords]);

  const order = orderId ? getOrderById(orderId) : undefined;
  const records = orderId ? getRecordsByOrderId(orderId) : [];

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white px-5 py-4 border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/orders')}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center mr-3 -ml-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">订单详情</h1>
          </div>
        </header>
        <Empty description="未找到该订单" />
      </div>
    );
  }

  const config = statusConfig[order.status];
  const isActive = order.status === 'active' || order.status === 'returning';

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-white px-5 py-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/orders')}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center mr-3 -ml-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">订单详情</h1>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </header>

      <main className="px-5 py-5 space-y-5">
        <Card className={isActive ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-warn-orange/30' : 'bg-gradient-to-br from-life-green-light/30 to-medical-blue-light/30'}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isActive ? 'bg-warn-orange/20' : 'bg-life-green/20'
                }`}>
                  <BedDouble className={`w-7 h-7 ${isActive ? 'text-warn-orange' : 'text-life-green-dark'}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-0.5">{order.bedNumber}</h2>
                  <p className="text-sm text-gray-600">{order.ward}</p>
                </div>
              </div>
              {isActive ? (
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">已用时</p>
                  <OrderTimer startTime={order.startTime} />
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">总用时</p>
                  <p className="text-lg font-semibold text-life-green-dark tabular-nums">
                    {order.durationMinutes ? formatDuration(order.durationMinutes) : '-'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-medical-blue" />
              订单信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow icon={Hash} label="订单编号" value={order.id} />
            <InfoRow icon={BedDouble} label="床号" value={`${order.bedNumber} (${order.ward})`} />
            <InfoRow icon={Phone} label="用户手机" value={order.userPhone} />
            <div className="flex items-start gap-3 py-2.5 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">租借病区 / 归还病区</p>
                <p className="text-sm font-medium text-gray-900">
                  {order.ward}
                  {order.returnWard && order.returnWard !== order.ward && (
                    <span className="text-gray-500 mx-1">→</span>
                  )}
                  {order.returnWard && order.returnWard !== order.ward && (
                    <span>{order.returnWard}</span>
                  )}
                </p>
              </div>
            </div>
            {order.cleanStatus && (
              <div className="flex items-start gap-3 py-2.5 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">清洁状态</p>
                  <Badge variant={cleanStatusMap[order.cleanStatus].variant}>
                    {cleanStatusMap[order.cleanStatus].label}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-medical-blue" />
              时间信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow icon={Clock} label="开始时间" value={formatDateTime(order.startTime)} />
            <InfoRow
              icon={Clock}
              label="结束时间"
              value={order.endTime ? formatDateTime(order.endTime) : '-'}
            />
            {order.durationMinutes !== undefined && order.durationMinutes !== null && (
              <div className="flex items-start gap-3 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">使用时长</p>
                  <p className="text-sm font-semibold text-life-green-dark">
                    {formatDuration(order.durationMinutes)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {order.feeDetail && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-5 h-5 text-medical-blue" />
                费用明细
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FeeBreakdown feeDetail={order.feeDetail} />
            </CardContent>
          </Card>
        )}

        {(order.depositRefund !== undefined || order.depositAmount) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-life-green" />
                押金信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                  <span className="text-sm text-gray-600">支付押金</span>
                  <span className="text-sm font-medium text-gray-900 tabular-nums">¥{order.depositAmount.toFixed(2)}</span>
                </div>
                {order.actualPayment !== undefined && (
                  <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                    <span className="text-sm text-gray-600">消费金额</span>
                    <span className="text-sm font-medium text-danger-red tabular-nums">-¥{order.actualPayment.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3">
                  <span className="text-sm font-semibold text-life-green-dark flex items-center gap-1">
                    <HandCoins className="w-4 h-4" />
                    退还押金
                  </span>
                  <span className="text-lg font-bold text-life-green-dark tabular-nums">
                    ¥{(order.depositRefund ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {records.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-warn-orange" />
                  关联异常记录
                </div>
                <Link
                  to="/records"
                  className="text-xs text-medical-blue flex items-center gap-0.5 hover:underline"
                >
                  查看全部 <ChevronRight className="w-3 h-3" />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {records.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
            </CardContent>
          </Card>
        )}

        {isActive && (
          <div className="sticky bottom-0 -mx-5 px-5 py-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
            <Button
              variant="primary"
              size="lg"
              className="w-full shadow-lg"
              onClick={() => navigate(`/return/${order.id}`)}
            >
              <HandCoins className="w-5 h-5" />
              去归还
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
