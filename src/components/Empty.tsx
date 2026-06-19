import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface EmptyProps {
  description?: string;
  className?: string;
}

export default function Empty({ description = '暂无数据', className }: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6', className)}>
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
