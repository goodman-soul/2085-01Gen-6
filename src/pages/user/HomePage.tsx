import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  ClipboardList,
  ShieldCheck,
  Scan,
  ArrowRight,
  Clock,
  BedDouble,
  ChevronRight,
  HandCoins,
  UserCog,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { BedCard } from '@/components/business/BedCard';
import { OrderTimer } from '@/components/business/OrderTimer';
import Empty from '@/components/Empty';
import { useBedStore } from '@/store/useBedStore';
import { useOrderStore } from '@/store/useOrderStore';
import { wards } from '@/utils/mockData';
import { cn } from '@/lib/utils';
import { Order } from '@/types';

export default function HomePage() {
  const navigate = useNavigate();
  const { beds, fetchBeds, getAvailableBeds } = useBedStore();
  const { orders, fetchOrders, getActiveOrders } = useOrderStore();
  const [bedSelectOpen, setBedSelectOpen] = useState(false);
  const [activeWard, setActiveWard] = useState<string>('全部');

  useEffect(() => {
    const initData = async () => {
      try {
        await Promise.all([fetchBeds(), fetchOrders()]);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    initData();
  }, [fetchBeds, fetchOrders]);

  const activeOrder: Order | undefined = getActiveOrders()[0];
  const availableBeds = getAvailableBeds();

  const allWards = ['全部', ...wards];
  const filteredBeds = activeWard === '全部' ? beds : beds.filter((b) => b.ward === activeWard);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-gradient-to-br from-medical-blue to-medical-blue-dark text-white px-5 pt-6 pb-16 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">医院陪护床服务</h1>
              <p className="text-xs text-white/80 mt-0.5">便捷租借 · 扫码即用</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-sm"
            >
              <ClipboardList className="w-4 h-4" />
              订单记录
            </button>
            <button
              onClick={() => navigate('/admin/login')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-sm"
            >
              <UserCog className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-5 -mt-10 space-y-5">
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardContent className="p-0">
            <button
              onClick={() => setBedSelectOpen(true)}
              className="w-full p-8 flex flex-col items-center justify-center bg-gradient-to-br from-medical-blue via-medical-blue to-blue-600 text-white active:scale-[0.98] transition-transform"
            >
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse-ring" />
                <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
                <div className="relative w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40">
                  <QrCode className="w-12 h-12" strokeWidth={2} />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-1">扫码租借</h2>
              <p className="text-sm text-white/80">扫描床位二维码，立即开始使用</p>
              <div className="mt-5 flex items-center gap-1 text-sm bg-white/15 px-4 py-2 rounded-full">
                <Scan className="w-4 h-4" />
                点击开始扫码
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </CardContent>
        </Card>

        {activeOrder && (
          <Card className="border-warn-orange/30 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-warn-orange/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-warn-orange" />
                  </div>
                  <h3 className="font-semibold text-gray-900">进行中的订单</h3>
                </div>
                <Badge variant="warning">使用中</Badge>
              </div>

              <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">床号</p>
                    <p className="text-xl font-bold text-gray-900">{activeOrder.bedNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{activeOrder.ward}</p>
                    <OrderTimer startTime={activeOrder.startTime} className="mt-1" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>开始时间: {activeOrder.startTime.replace('T', ' ').slice(0, 16)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate(`/return/${activeOrder.id}`)}
              >
                <HandCoins className="w-5 h-5" />
                去归还
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">床位状态一览</CardTitle>
              <button
                onClick={() => navigate('/records')}
                className="text-xs text-medical-blue flex items-center gap-0.5 hover:underline"
              >
                异常记录 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2 mb-4">
              {allWards.map((ward) => (
                <button
                  key={ward}
                  onClick={() => setActiveWard(ward)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    activeWard === ward
                      ? 'bg-medical-blue text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {ward}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredBeds.map((bed) => (
                <BedCard key={bed.id} bed={bed} />
              ))}
            </div>

            {filteredBeds.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">该病区暂无床位</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-life-green" />
              使用说明
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {[
                { step: '1', title: '扫码开锁', desc: '扫描床位二维码或点击首页扫码按钮', icon: Scan },
                { step: '2', title: '支付押金', desc: '支付¥200押金并输入手机号，完成开锁', icon: HandCoins },
                { step: '3', title: '归还结算', desc: '使用完毕后点击归还，押金原路退回', icon: ClipboardList },
              ].map((item, idx) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-medical-blue-light flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-medical-blue-dark" />
                    </div>
                    {idx < 2 && (
                      <div className="absolute left-1/2 top-full w-px h-4 bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-5 h-5 rounded-full bg-medical-blue text-white text-xs font-bold flex items-center justify-center">
                        {item.step}
                      </span>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    </div>
                    <p className="text-sm text-gray-500 ml-7">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Modal
        open={bedSelectOpen}
        onClose={() => setBedSelectOpen(false)}
        title="选择要租借的床位"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">请点击您面前床位对应的卡片：</p>
          {availableBeds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {availableBeds.map((bed) => (
                <BedCard
                  key={bed.id}
                  bed={bed}
                  onClick={() => {
                    setBedSelectOpen(false);
                    navigate(`/scan/${bed.id}`);
                  }}
                />
              ))}
            </div>
          ) : (
            <Empty description="暂无可租借床位" />
          )}
        </div>
      </Modal>
    </div>
  );
}
