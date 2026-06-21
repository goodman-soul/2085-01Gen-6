import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  Clock,
  ChevronRight,
  CircleDot,
  ClipboardList,
  HandCoins,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Empty from '@/components/Empty';
import { OrderTimer } from '@/components/business/OrderTimer';
import { useOrderStore } from '@/store/useOrderStore';
import { formatDateTime, formatDuration } from '@/utils/dateUtils';
import { Order, OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

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

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const config = statusConfig[order.status];
  const isActive = order.status === 'active';
  const navigate = useNavigate();

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md active:scale-[0.99]',
        isActive && 'border-warn-orange/30 bg-amber-50/30'
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center',
              isActive ? 'bg-warn-orange/20' : 'bg-gray-100'
            )}>
              <BedDouble className={cn('w-6 h-6', isActive ? 'text-warn-orange' : 'text-gray-500')} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-gray-900">{order.bedNumber}</h3>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
              <p className="text-xs text-gray-500">{order.ward}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{isActive ? '已用时' : '用时'}</span>
            </div>
            {isActive ? (
              <OrderTimer startTime={order.startTime} className="font-semibold text-gray-900" />
            ) : (
              <span className="font-semibold text-gray-900 tabular-nums">
                {order.durationMinutes ? formatDuration(order.durationMinutes) : '-'}
              </span>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <CircleDot className="w-3.5 h-3.5" />
              <span className="text-xs">{isActive ? '预计费用' : '实付费用'}</span>
            </div>
            <span className="font-semibold text-danger-red tabular-nums">
              ¥{order.actualPayment?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
          <span>开始: {formatDateTime(order.startTime)}</span>
          {order.endTime && <span>结束: {formatDateTime(order.endTime)}</span>}
        </div>

        {isActive && (
          <Button
            variant="primary"
            size="sm"
            className="w-full mt-4"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/return/${order.id}`);
            }}
          >
            <HandCoins className="w-4 h-4" />
            立即归还
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const { orders, fetchOrders } = useOrderStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    const initData = async () => {
      try {
        await fetchOrders();
      } catch (error) {
        console.error('Failed to load orders:', error);
      }
    };
    initData();
  }, [fetchOrders]);

  const filteredOrders = orders
    .filter((order) => {
      switch (activeTab) {
        case 'active':
          return order.status === 'active' || order.status === 'returning';
        case 'completed':
          return order.status === 'completed' || order.status === 'manual_closed';
        case 'cancelled':
          return order.status === 'cancelled';
        default:
          return true;
      }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white px-5 py-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center mr-3 -ml-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-medical-blue" />
              订单记录
            </h1>
          </div>
          <Link
            to="/records"
            className="text-xs text-medical-blue flex items-center gap-0.5 hover:underline"
          >
            异常记录 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      <div className="px-5 py-3 bg-white border-b border-gray-100 sticky top-[61px] z-10">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar -mx-1 px-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-medical-blue text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-5 py-5 space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => navigate(`/orders/${order.id}`)}
            />
          ))
        ) : (
          <Empty description={`暂无${activeTab === 'all' ? '' : filterTabs.find(t => t.key === activeTab)?.label}订单`} />
        )}
      </main>
    </div>
  );
}
