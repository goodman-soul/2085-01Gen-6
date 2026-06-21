import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Moon,
  Wallet,
  Hammer,
  XCircle,
  AlertOctagon,
  Wrench,
  CheckCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useRecordStore } from '@/store/useRecordStore';
import { useBedStore } from '@/store/useBedStore';
import { formatDateTime } from '@/utils/dateUtils';
import type {
  ExceptionRecord,
  RecordType,
  NightCapRecord,
  DepositRefundRecord,
  BedDamageRecord,
  ManualCloseRecord,
  DamageLevel,
  CloseReason,
} from '@/types';

const ADMIN_NAME_KEY = 'admin_name';

type TabKey = 'all' | RecordType;

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

const recordTypeBadgeVariants: Record<RecordType, 'info' | 'success' | 'danger' | 'warning'> = {
  night_cap: 'info',
  deposit_refund: 'success',
  bed_damage: 'danger',
  manual_close: 'warning',
};

const recordTypeBgColors: Record<RecordType, string> = {
  night_cap: 'bg-indigo-100 text-indigo-600',
  deposit_refund: 'bg-life-green-light text-life-green-dark',
  bed_damage: 'bg-red-100 text-danger-red',
  manual_close: 'bg-amber-100 text-warn-orange',
};

const damageLevelLabels: Record<DamageLevel, string> = {
  minor: '轻微损坏',
  moderate: '中度损坏',
  severe: '严重损坏',
};

const closeReasonLabels: Record<CloseReason, string> = {
  timeout: '超时未还',
  device_failure: '设备故障',
  user_complaint: '用户投诉',
  staff_adjustment: '医护调整',
  other: '其他',
};

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'night_cap', label: '夜间封顶' },
  { key: 'deposit_refund', label: '押金退回' },
  { key: 'bed_damage', label: '床架损坏' },
  { key: 'manual_close', label: '人工关闭' },
];

interface RecordCardProps {
  record: ExceptionRecord;
  onMarkRepaired?: (record: ExceptionRecord) => void;
  onConfirmRefund?: (record: ExceptionRecord) => void;
}

function RecordCard({ record, onMarkRepaired, onConfirmRefund }: RecordCardProps) {
  const [expanded, setExpanded] = useState(false);
  const IconComp = recordTypeIcons[record.type];
  const badgeVariant = recordTypeBadgeVariants[record.type];
  const bgColorClass = recordTypeBgColors[record.type];

  const isBedDamage = record.type === 'bed_damage';
  const isDepositRefund = record.type === 'deposit_refund';

  const damageData = isBedDamage ? (record.data as BedDamageRecord) : null;
  const depositData = isDepositRefund ? (record.data as DepositRefundRecord) : null;
  const nightCapData = record.type === 'night_cap' ? (record.data as NightCapRecord) : null;
  const manualCloseData = record.type === 'manual_close' ? (record.data as ManualCloseRecord) : null;

  const bedDamaged = isBedDamage && damageData;
  const refundNotConfirmed = isDepositRefund && depositData && !depositData.refundTime;

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bgColorClass}`}
          >
            <IconComp size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-base font-semibold text-gray-900">
                  {recordTypeLabels[record.type]}
                </span>
                <Badge variant={badgeVariant}>{recordTypeLabels[record.type]}</Badge>
                {bedDamaged && (
                  <Badge variant="danger">{damageLevelLabels[damageData.damageLevel]}</Badge>
                )}
              </div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-medical-blue transition-colors shrink-0"
              >
                {expanded ? (
                  <>
                    收起 <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    展开详情 <ChevronDown size={14} />
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">床号</div>
                <div className="font-medium text-gray-900">{record.bedNumber}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">关联订单</div>
                <div className="font-mono text-gray-900 truncate">{record.orderId}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">操作人</div>
                <div className="font-medium text-gray-900">{record.operator}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">创建时间</div>
                <div className="font-medium text-gray-900">{formatDateTime(record.createdAt)}</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 mb-3">
              {isBedDamage && damageData && (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-1.5 text-danger-red font-medium mb-1">
                    <AlertCircle size={14} />
                    损坏描述
                  </div>
                  <div className="text-gray-700 pl-5">{damageData.damageDescription}</div>
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-gray-500">扣款金额</span>
                    <span className="font-semibold text-danger-red">
                      ¥{damageData.deductionAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {isDepositRefund && depositData && (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">退款金额</span>
                    <span className="font-semibold text-life-green-dark">
                      ¥{depositData.refundAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">退款方式</span>
                    <span className="text-gray-700">{depositData.refundMethod}</span>
                  </div>
                  {depositData.refundTime && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">退款时间</span>
                      <span className="text-gray-700">{formatDateTime(depositData.refundTime)}</span>
                    </div>
                  )}
                  {depositData.remark && (
                    <div className="pt-1">
                      <span className="text-xs text-gray-500">备注：</span>
                      <span className="text-xs text-gray-600">{depositData.remark}</span>
                    </div>
                  )}
                </div>
              )}

              {record.type === 'night_cap' && nightCapData && (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">优惠时段</span>
                    <span className="text-gray-900">
                      {formatDateTime(nightCapData.nightStart)} ~{' '}
                      {formatDateTime(nightCapData.nightEnd)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">原计费时长</span>
                    <span className="text-gray-700">{nightCapData.originalHours.toFixed(1)} 小时</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">封顶后时长</span>
                    <span className="text-gray-700">{nightCapData.cappedHours.toFixed(1)} 小时</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-indigo-600 font-medium">优惠金额</span>
                    <span className="font-semibold text-indigo-600">
                      节省 ¥{nightCapData.savedAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {record.type === 'manual_close' && manualCloseData && (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">关闭原因</span>
                    <span className="font-medium text-warn-orange">
                      {closeReasonLabels[manualCloseData.closeReason]}
                    </span>
                  </div>
                  {manualCloseData.closeRemark && (
                    <div className="pt-1">
                      <span className="text-xs text-gray-500">备注：</span>
                      <span className="text-xs text-gray-600">{manualCloseData.closeRemark}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-gray-500">关闭时间</span>
                    <span className="text-gray-700">
                      {formatDateTime(manualCloseData.closeTime)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {expanded && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                  <FileText size={14} className="text-medical-blue" />
                  完整详情
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-gray-50">
                    <div className="text-gray-500 mb-0.5">记录ID</div>
                    <div className="font-mono text-gray-900 break-all">{record.id}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50">
                    <div className="text-gray-500 mb-0.5">记录类型</div>
                    <div className="font-medium text-gray-900">{recordTypeLabels[record.type]}</div>
                  </div>
                  {damageData?.evidenceImages && damageData.evidenceImages.length > 0 && (
                    <div className="col-span-2 p-2.5 rounded-lg bg-gray-50">
                      <div className="text-gray-500 mb-1">证据图片</div>
                      <div className="flex flex-wrap gap-1.5">
                        {damageData.evidenceImages.map((img, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-white border border-gray-200 text-[11px] text-gray-600"
                          >
                            {img}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(bedDamaged || refundNotConfirmed) && (
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-3">
                {bedDamaged && onMarkRepaired && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => onMarkRepaired(record)}
                  >
                    <Wrench size={14} />
                    标记已修复
                  </Button>
                )}
                {refundNotConfirmed && onConfirmRefund && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => onConfirmRefund(record)}
                  >
                    <CheckCircle size={14} />
                    确认已退款
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminRecordsPage() {
  const { records, fetchRecords, updateRecord } = useRecordStore();
  const { beds, fetchBeds, updateBedStatus } = useBedStore();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const adminName = localStorage.getItem(ADMIN_NAME_KEY) || '管理员';

  useEffect(() => {
    const initData = async () => {
      try {
        await Promise.all([fetchRecords(), fetchBeds()]);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    initData();
  }, [fetchRecords, fetchBeds]);

  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (activeTab !== 'all') {
      result = result.filter((r) => r.type === activeTab);
    }
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [records, activeTab]);

  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      all: records.length,
      night_cap: 0,
      deposit_refund: 0,
      bed_damage: 0,
      manual_close: 0,
    };
    records.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return counts;
  }, [records]);

  const handleMarkRepaired = async (record: ExceptionRecord) => {
    if (record.type !== 'bed_damage') return;

    const bed = beds.find((b) => b.bedNumber === record.bedNumber);
    if (bed) {
      await updateBedStatus(bed.id, 'available');
    }

    await updateRecord(record.id, {
      operator: adminName,
    });
  };

  const handleConfirmRefund = async (record: ExceptionRecord) => {
    if (record.type !== 'deposit_refund') return;

    const data = record.data as DepositRefundRecord;
    await updateRecord(record.id, {
      data: {
        ...data,
        refundTime: new Date().toISOString(),
      },
      operator: adminName,
    });
  };

  return (
    <div className="space-y-5">
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-medical-blue-dark'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {tab.key === 'all' ? (
                      <AlertOctagon size={16} />
                    ) : (
                      (() => {
                        const Icon = recordTypeIcons[tab.key as RecordType];
                        return <Icon size={16} />;
                      })()
                    )}
                    {tab.label}
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? 'bg-medical-blue-light text-medical-blue-dark'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {tabCounts[tab.key]}
                    </span>
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-medical-blue rounded-t" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {filteredRecords.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
              <AlertOctagon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">暂无{activeTab === 'all' ? '' : recordTypeLabels[activeTab as RecordType]}异常记录</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              onMarkRepaired={handleMarkRepaired}
              onConfirmRefund={handleConfirmRefund}
            />
          ))}
        </div>
      )}
    </div>
  );
}
