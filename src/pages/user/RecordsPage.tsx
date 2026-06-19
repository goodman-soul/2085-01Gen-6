import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Moon,
  Wallet,
  AlertTriangle,
  XCircle,
  ClipboardList,
} from 'lucide-react';
import Empty from '@/components/Empty';
import { RecordCard } from '@/components/business/RecordCard';
import { useRecordStore } from '@/store/useRecordStore';
import { RecordType, ExceptionRecord } from '@/types';
import { cn } from '@/lib/utils';

type TabKey = RecordType;

const tabs: { key: TabKey; label: string; Icon: typeof Moon; color: string }[] = [
  { key: 'night_cap', label: '夜间封顶', Icon: Moon, color: 'text-medical-blue' },
  { key: 'deposit_refund', label: '押金退回', Icon: Wallet, color: 'text-life-green-dark' },
  { key: 'bed_damage', label: '床架损坏', Icon: AlertTriangle, color: 'text-danger-red' },
  { key: 'manual_close', label: '人工关闭', Icon: XCircle, color: 'text-warn-orange' },
];

const emptyMessages: Record<TabKey, string> = {
  night_cap: '暂无夜间封顶记录',
  deposit_refund: '暂无押金退回记录',
  bed_damage: '暂无床架损坏记录',
  manual_close: '暂无人工关闭记录',
};

export default function RecordsPage() {
  const navigate = useNavigate();
  const { records, initRecords, getRecordsByType } = useRecordStore();
  const [activeTab, setActiveTab] = useState<TabKey>('night_cap');

  useEffect(() => {
    initRecords();
  }, [initRecords]);

  const filteredRecords: ExceptionRecord[] = getRecordsByType(activeTab).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const activeTabConfig = tabs.find((t) => t.key === activeTab)!;

  const allCounts = {
    night_cap: getRecordsByType('night_cap').length,
    deposit_refund: getRecordsByType('deposit_refund').length,
    bed_damage: getRecordsByType('bed_damage').length,
    manual_close: getRecordsByType('manual_close').length,
  };

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
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-medical-blue" />
            异常记录中心
          </h1>
        </div>
      </header>

      <div className="px-5 py-4 bg-white border-b border-gray-100">
        <div className="bg-gray-50 rounded-xl p-1 grid grid-cols-4 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex flex-col items-center gap-1 py-2 rounded-lg transition-all',
                activeTab === tab.key
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-100/50'
              )}
            >
              <tab.Icon className={cn(
                'w-4 h-4',
                activeTab === tab.key ? tab.color : 'text-gray-500'
              )} />
              <span className={cn(
                'text-xs font-medium',
                activeTab === tab.key ? tab.color : 'text-gray-500'
              )}>
                {tab.label}
              </span>
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full',
                allCounts[tab.key] > 0
                  ? (activeTab === tab.key ? tab.color + ' bg-current/10' : 'bg-gray-200 text-gray-600')
                  : 'bg-gray-100 text-gray-400'
              )}>
                {allCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <activeTabConfig.Icon className={cn('w-5 h-5', activeTabConfig.color)} />
          <h2 className="font-semibold text-gray-900">{activeTabConfig.label}记录</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            共 {filteredRecords.length} 条
          </span>
        </div>
      </div>

      <main className="px-5 pb-8 space-y-4">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))
        ) : (
          <Empty description={emptyMessages[activeTab]} />
        )}
      </main>
    </div>
  );
}
