import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Clock,
  Phone,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LockAnimation } from '@/components/business/LockAnimation';
import { useBedStore } from '@/store/useBedStore';
import { useOrderStore } from '@/store/useOrderStore';

type LockState = 'locked' | 'unlocking' | 'unlocked';

export default function ScanPage() {
  const { bedId } = useParams<{ bedId: string }>();
  const navigate = useNavigate();
  const { beds, initBeds, getBedById } = useBedStore();
  const { createOrder, getActiveOrders, initOrders } = useOrderStore();
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [lockState, setLockState] = useState<LockState>('locked');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    initBeds();
    initOrders();
  }, [initBeds, initOrders]);

  const bed = bedId ? getBedById(bedId) : undefined;

  useEffect(() => {
    if (!bed && beds.length > 0) {
      setErrorMsg('未找到该床位信息');
    } else if (bed && bed.status !== 'available') {
      const statusMap = {
        occupied: '该床位正在使用中',
        maintenance: '该床位正在维护中',
        damaged: '该床位已损坏',
      };
      setErrorMsg(statusMap[bed.status as keyof typeof statusMap] || '该床位暂不可用');
    }
  }, [bed, beds.length]);

  const validatePhone = (value: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!value) {
      setPhoneError('请输入手机号');
      return false;
    }
    if (!phoneRegex.test(value)) {
      setPhoneError('请输入有效的11位手机号');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePayment = async () => {
    if (!validatePhone(phone)) return;
    if (!bed || bed.status !== 'available') return;

    setLockState('unlocking');

    setTimeout(() => {
      const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      const newOrder = createOrder(bed.id, maskedPhone);

      if (newOrder) {
        setLockState('unlocked');
        setTimeout(() => {
          navigate(`/orders/${newOrder.id}`);
        }, 1500);
      } else {
        setLockState('locked');
        setErrorMsg('开锁失败，请重试');
      }
    }, 2000);
  };

  if (!bed) {
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
            <h1 className="text-lg font-semibold text-gray-900">床位详情</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-5">
          <AlertCircle className="w-16 h-16 text-danger-red mb-4" />
          <p className="text-gray-900 font-semibold mb-1">
            {errorMsg || '未找到床位信息'}
          </p>
          <p className="text-sm text-gray-500 mb-6">请返回首页重新扫码</p>
          <Link to="/">
            <Button variant="primary">返回首页</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-white px-5 py-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center mr-3 -ml-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">扫码开锁</h1>
          </div>
          <Badge variant={bed.status === 'available' ? 'available' : 'warning'}>
            {bed.status === 'available' ? '可用' : '不可用'}
          </Badge>
        </div>
      </header>

      <main className="px-5 py-5 space-y-5">
        <Card className="bg-gradient-to-br from-medical-blue to-medical-blue-dark text-white border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">床位编号</p>
                <h2 className="text-4xl font-bold mb-3">{bed.bedNumber}</h2>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <MapPin className="w-4 h-4" />
                    {bed.ward}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/90">
                    <Building2 className="w-4 h-4" />
                    {bed.floor}楼
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/15 rounded-xl px-4 py-3 backdrop-blur-sm">
                  <div className="mb-2">
                    <p className="text-xs text-white/70">时租金</p>
                    <p className="text-xl font-bold">¥{bed.hourlyRate}</p>
                  </div>
                  <div className="border-t border-white/20 pt-2">
                    <p className="text-xs text-white/70">押金</p>
                    <p className="text-xl font-bold">¥{bed.depositAmount}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">锁状态</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-4">
            <LockAnimation state={lockState} />
          </CardContent>
        </Card>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger-red shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-danger-red mb-1">操作受限</p>
              <p className="text-sm text-red-600/80">{errorMsg}</p>
            </div>
          </div>
        )}

        {lockState === 'unlocked' ? (
          <Card className="border-life-green/30 bg-life-green-light/30">
            <CardContent className="py-8 flex flex-col items-center">
              <CheckCircle2 className="w-16 h-16 text-life-green mb-3" />
              <h3 className="text-xl font-bold text-life-green-dark mb-1">开锁成功</h3>
              <p className="text-sm text-gray-600 mb-4">订单已创建，正在跳转至订单详情...</p>
              <Button
                variant="success"
                onClick={() => {
                  const actives = getActiveOrders();
                  if (actives.length > 0) navigate(`/orders/${actives[0].id}`);
                  else navigate('/');
                }}
              >
                查看订单
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-medical-blue" />
                押金支付
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">押金金额</span>
                <span className="text-2xl font-bold text-danger-red tabular-nums">¥{bed.depositAmount}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  联系手机号
                </label>
                <Input
                  type="tel"
                  placeholder="请输入11位手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => phone && validatePhone(phone)}
                  prefixIcon={<Phone className="w-4 h-4" />}
                  error={!!phoneError}
                  errorMessage={phoneError}
                  maxLength={11}
                  disabled={lockState === 'unlocking'}
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-medical-blue-light/50 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-medical-blue-dark shrink-0 mt-0.5" />
                <p className="text-xs text-medical-blue-dark leading-relaxed">
                  押金将在归还结算后原路退回。夜间22:00-次日06:00封顶¥30，每日封顶¥60。
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handlePayment}
                loading={lockState === 'unlocking'}
                disabled={!!errorMsg || lockState === 'unlocking'}
              >
                {lockState === 'unlocking' ? (
                  '正在开锁...'
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    确认支付并开锁
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>按时计费</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>安全保障</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
