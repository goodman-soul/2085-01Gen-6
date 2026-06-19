import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Bed,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  LogOut,
  User,
  Moon,
  Wallet,
  Hammer,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useOrderStore } from '@/store/useOrderStore';
import { useRecordStore } from '@/store/useRecordStore';
import { useBedStore } from '@/store/useBedStore';
import { formatDateTime, formatDuration } from '@/utils/dateUtils';
import type { Order, ExceptionRecord, RecordType } from '@/types';

const ADMIN_NAME_KEY = 'admin_name';
const ADMIN_TOKEN_KEY = 'admin_token';

const recordTypeIcons: Record<RecordType, typeof Moon> = {
  night_cap: Moon,
  deposit_refund: Wallet,
  bed_damage: Hammer,
  manual_close: XCircle,
};

const recordTypeLabels: Record<RecordType, string> = {
  night_cap: '夜间封顶',
  deposit_refund: '押金退回',
  bed_damage: '床架损坏',
  manual_close: '人工关闭',
};

const recordTypeColors: Record<RecordType, string> = {
  night_cap: 'bg-indigo-100 text-indigo-600',
  deposit_refund: 'bg-life-green-light text-life-green-dark',
  bed_damage: 'bg-red-100 text-danger-red',
  manual_close: 'bg-amber-100 text-warn-orange',
};

function getTodayRange() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  return { startOfToday, startOfYesterday, now };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { orders, initOrders } = useOrderStore();
  const { records, initRecords } = useRecordStore();
  const { initBeds } = useBedStore();

  const adminName = localStorage.getItem(ADMIN_NAME_KEY) || '管理员';

  useEffect(() => {
    initOrders();
    initRecords();
    initBeds();
  }, [initOrders, initRecords, initBeds]);

  const stats = useMemo(() => {
    const { startOfToday, startOfYesterday } = getTodayRange();

    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt) >= startOfToday
    );
    const yesterdayOrders = orders.filter(
      (o) =>
        new Date(o.createdAt) >= startOfYesterday &&
        new Date(o.createdAt) < startOfToday
    );

    const orderCountChange =
      yesterdayOrders.length > 0
        ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100
        : todayOrders.length > 0
        ? 100
        : 0;

    const activeOrders = orders.filter((o) => o.status === 'active');

    const todayIncome = orders
      .filter((o) => new Date(o.updatedAt) >= startOfToday && o.actualPayment)
      .reduce((sum, o) => sum + (o.actualPayment || 0), 0);
    const yesterdayIncome = orders
      .filter(
        (o) =>
          new Date(o.updatedAt) >= startOfYesterday &&
          new Date(o.updatedAt) < startOfToday &&
          o.actualPayment
      )
      .reduce((sum, o) => sum + (o.actualPayment || 0), 0);

    const incomeChange =
      yesterdayIncome > 0
        ? ((todayIncome - yesterdayIncome) / yesterdayIncome) * 100
        : todayIncome > 0
        ? 100
        : 0;

    const pendingRecords = records.filter((r) => {
      if (r.type === 'bed_damage') {
        const bed = useBedStore.getState().beds.find((b) => b.bedNumber === r.bedNumber);
        return bed?.status === 'damaged';
      }
      if (r.type === 'deposit_refund') {
        const data = r.data as { refundTime?: string };
        return !data.refundTime;
      }
      return false;
    });

    return {
      todayOrderCount: todayOrders.length,
      orderCountChange,
      activeOrderCount: activeOrders.length,
      todayIncome: Number(todayIncome.toFixed(2)),
      incomeChange,
      pendingRecordCount: pendingRecords.length,
    };
  }, [orders, records]);

  const activeOrdersList = useMemo(() => {
    return orders
      .filter((o) => o.status === 'active')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5);
  }, [orders]);

  const recentRecords = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [records]);

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_NAME_KEY);
    navigate('/admin', { replace: true });
  };

  return (
    <div className="space-y-6">
      <header className="h-14 -mx-6 -mt-6 mb-6 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <h1 className="text-lg font-bold text-gray-900">医院陪护床管理系统</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-medical-blue-light flex items-center justify-center">
              <User size={14} className="text-medical-blue-dark" />
            </div>
            <span className="text-sm text-gray-700 font-medium">{adminName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut size={16} />
            退出
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-5">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">今日订单数</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-gray-900">{stats.todayOrderCount}</span>
                  <span className="text-sm mb-1">
                    {stats.orderCountChange >= 0 ? (
                      <span className="flex items-center gap-0.5 text-life-green-dark">
                        <TrendingUp size={14} />
                        {stats.orderCountChange.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-danger-red">
                        <TrendingDown size={14} />
                        {Math.abs(stats.orderCountChange).toFixed(1)}%
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-medical-blue-light flex items-center justify-center">
                <FileText className="w-6 h-6 text-medical-blue-dark" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">当前在租数</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-gray-900">{stats.activeOrderCount}</span>
                  <span className="text-sm mb-1 text-gray-500">张</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-life-green-light flex items-center justify-center">
                <Bed className="w-6 h-6 text-life-green-dark" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">今日收入</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-gray-900">¥{stats.todayIncome.toFixed(2)}</span>
                  <span className="text-sm mb-1">
                    {stats.incomeChange >= 0 ? (
                      <span className="flex items-center gap-0.5 text-life-green-dark">
                        <TrendingUp size={14} />
                        {stats.incomeChange.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-danger-red">
                        <TrendingDown size={14} />
                        {Math.abs(stats.incomeChange).toFixed(1)}%
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-warn-orange" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">异常待处理</p>
                <div className="flex items-end gap-2">
                  <span
                    className={`text-3xl font-bold ${
                      stats.pendingRecordCount > 0 ? 'text-danger-red' : 'text-gray-900'
                    }`}
                  >
                    {stats.pendingRecordCount}
                  </span>
                  <span className="text-sm mb-1 text-gray-500">条</span>
                </div>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  stats.pendingRecordCount > 0 ? 'bg-red-100' : 'bg-gray-100'
                }`}
              >
                <AlertTriangle
                  className={`w-6 h-6 ${
                    stats.pendingRecordCount > 0 ? 'text-danger-red' : 'text-gray-500'
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-0">
            <CardTitle className="text-base">在租订单列表</CardTitle>
            <button
              onClick={() => navigate('/admin/orders')}
              className="flex items-center gap-0.5 text-sm text-medical-blue hover:text-medical-blue-dark transition-colors"
            >
              查看全部
              <ChevronRight size={14} />
            </button>
          </CardHeader>
          <CardContent className="p-5">
            {activeOrdersList.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">暂无在租订单</div>
            ) : (
              <div className="space-y-3">
                {activeOrdersList.map((order: Order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {order.bedNumber}
                        </span>
                        <Badge variant="success" className="text-[10px] px-1.5 py-0">
                          进行中
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{order.ward}</span>
                        <span>{order.userPhone}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <Clock size={12} />
                        已租时长
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDuration(
                          Math.max(
                            1,
                            Math.round(
                              (Date.now() - new Date(order.startTime).getTime()) / (1000 * 60)
                            )
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-0">
            <CardTitle className="text-base">最近异常记录</CardTitle>
            <button
              onClick={() => navigate('/admin/records')}
              className="flex items-center gap-0.5 text-sm text-medical-blue hover:text-medical-blue-dark transition-colors"
            >
              查看全部
              <ChevronRight size={14} />
            </button>
          </CardHeader>
          <CardContent className="p-5">
            {recentRecords.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">暂无异常记录</div>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-2 bottom-2 w-px bg-gray-200" />
                <div className="space-y-4">
                  {recentRecords.map((record: ExceptionRecord) => {
                    const IconComp = recordTypeIcons[record.type];
                    return (
                      <div key={record.id} className="relative flex gap-3 pl-0">
                        <div
                          className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${recordTypeColors[record.type]}`}
                        >
                          <IconComp size={18} />
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-gray-900">
                              {recordTypeLabels[record.type]}
                            </span>
                            <span className="text-xs text-gray-400">
                              床号 {record.bedNumber}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mb-1">
                            操作人: {record.operator}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDateTime(record.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
