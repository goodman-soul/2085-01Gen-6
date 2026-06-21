import type {
  Bed,
  Order,
  ExceptionRecord,
  Admin,
} from './types';
import { formatDateTime } from './utils/dateUtils';
import { calculateFee } from './feeCalculator';

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

export const wards: string[] = [
  '内科病区',
  '外科病区',
  '妇产科病区',
  '儿科病区',
  'ICU病区',
];

let beds: Bed[] = [
  {
    id: generateId(),
    bedNumber: 'NK-001',
    ward: '内科病区',
    floor: 3,
    status: 'available',
    hourlyRate: 3,
    depositAmount: 200,
    qrCode: 'BED-NK-001-QR',
    lastMaintenanceDate: formatDateTime(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
  },
  {
    id: generateId(),
    bedNumber: 'NK-002',
    ward: '内科病区',
    floor: 3,
    status: 'occupied',
    hourlyRate: 3,
    depositAmount: 200,
    qrCode: 'BED-NK-002-QR',
    lastMaintenanceDate: formatDateTime(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
  },
  {
    id: generateId(),
    bedNumber: 'WK-001',
    ward: '外科病区',
    floor: 5,
    status: 'available',
    hourlyRate: 3,
    depositAmount: 200,
    qrCode: 'BED-WK-001-QR',
    lastMaintenanceDate: formatDateTime(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
  },
  {
    id: generateId(),
    bedNumber: 'WK-002',
    ward: '外科病区',
    floor: 5,
    status: 'maintenance',
    hourlyRate: 3,
    depositAmount: 200,
    qrCode: 'BED-WK-002-QR',
    lastMaintenanceDate: formatDateTime(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
  },
  {
    id: generateId(),
    bedNumber: 'FC-001',
    ward: '妇产科病区',
    floor: 4,
    status: 'damaged',
    hourlyRate: 3,
    depositAmount: 200,
    qrCode: 'BED-FC-001-QR',
    lastMaintenanceDate: formatDateTime(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)),
  },
  {
    id: generateId(),
    bedNumber: 'ICU-001',
    ward: 'ICU病区',
    floor: 6,
    status: 'available',
    hourlyRate: 3,
    depositAmount: 200,
    qrCode: 'BED-ICU-001-QR',
    lastMaintenanceDate: formatDateTime(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
  },
];

const now = new Date();
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);
const yesterdayNight = new Date(yesterday);
yesterdayNight.setHours(21, 0, 0, 0);
const todayMorning = new Date(yesterday);
todayMorning.setDate(todayMorning.getDate() + 1);
todayMorning.setHours(7, 30, 0, 0);

const longStart = new Date(twoDaysAgo);
longStart.setHours(20, 0, 0, 0);
const longEnd = new Date(longStart);
longEnd.setDate(longEnd.getDate() + 2);
longEnd.setHours(10, 0, 0, 0);

const feeDetailCompleted = calculateFee(yesterdayNight, todayMorning);
const feeDetailLong = calculateFee(longStart, longEnd, { damageDeduction: 50 });

let orders: Order[] = [
  {
    id: generateId(),
    bedId: beds[1].id,
    bedNumber: beds[1].bedNumber,
    ward: beds[1].ward,
    userPhone: '138****5678',
    status: 'active',
    startTime: formatDateTime(fiveHoursAgo),
    depositAmount: 200,
    createdAt: formatDateTime(fiveHoursAgo),
    updatedAt: formatDateTime(fiveHoursAgo),
  },
  {
    id: generateId(),
    bedId: beds[0].id,
    bedNumber: beds[0].bedNumber,
    ward: beds[0].ward,
    userPhone: '139****1234',
    status: 'completed',
    startTime: formatDateTime(yesterdayNight),
    endTime: formatDateTime(todayMorning),
    durationMinutes: Math.round((todayMorning.getTime() - yesterdayNight.getTime()) / (1000 * 60)),
    depositAmount: 200,
    feeDetail: feeDetailCompleted,
    actualPayment: feeDetailCompleted.totalAmount,
    depositRefund: Number((200 - feeDetailCompleted.totalAmount).toFixed(2)),
    cleanStatus: 'need_clean',
    returnWard: beds[0].ward,
    nightCapped: feeDetailCompleted.nightCapDiscount > 0,
    dailyCapped: feeDetailCompleted.dailyCapDiscount > 0,
    createdAt: formatDateTime(yesterdayNight),
    updatedAt: formatDateTime(todayMorning),
  },
  {
    id: generateId(),
    bedId: beds[4].id,
    bedNumber: beds[4].bedNumber,
    ward: beds[4].ward,
    userPhone: '137****9999',
    status: 'completed',
    startTime: formatDateTime(longStart),
    endTime: formatDateTime(longEnd),
    durationMinutes: Math.round((longEnd.getTime() - longStart.getTime()) / (1000 * 60)),
    depositAmount: 200,
    feeDetail: feeDetailLong,
    actualPayment: feeDetailLong.totalAmount,
    depositRefund: Number(Math.max(0, 200 - feeDetailLong.totalAmount).toFixed(2)),
    cleanStatus: 'heavily_soiled',
    returnWard: beds[4].ward,
    nightCapped: feeDetailLong.nightCapDiscount > 0,
    dailyCapped: feeDetailLong.dailyCapDiscount > 0,
    createdAt: formatDateTime(longStart),
    updatedAt: formatDateTime(longEnd),
  },
];

let records: ExceptionRecord[] = [
  {
    id: generateId(),
    orderId: orders[1].id,
    bedNumber: orders[1].bedNumber,
    type: 'night_cap',
    createdAt: formatDateTime(new Date(yesterdayNight.getTime() + 1 * 60 * 60 * 1000)),
    operator: '系统',
    data: {
      type: 'night_cap',
      nightStart: formatDateTime(new Date(yesterdayNight.getTime() + 1 * 60 * 60 * 1000)),
      nightEnd: formatDateTime(new Date(yesterdayNight.getTime() + 9 * 60 * 60 * 1000)),
      originalHours: 8,
      cappedHours: 10,
      savedAmount: feeDetailCompleted.nightCapDiscount,
    },
  },
  {
    id: generateId(),
    orderId: orders[1].id,
    bedNumber: orders[1].bedNumber,
    type: 'deposit_refund',
    createdAt: formatDateTime(todayMorning),
    operator: '张护士',
    data: {
      type: 'deposit_refund',
      refundAmount: Number((200 - feeDetailCompleted.totalAmount).toFixed(2)),
      refundMethod: '微信原路退回',
      refundTime: formatDateTime(todayMorning),
      remark: '正常归还，费用结算完成',
    },
  },
  {
    id: generateId(),
    orderId: orders[2].id,
    bedNumber: orders[2].bedNumber,
    type: 'bed_damage',
    createdAt: formatDateTime(longEnd),
    operator: '李护士长',
    data: {
      type: 'bed_damage',
      damageLevel: 'minor',
      damageDescription: '床架扶手有轻微划痕，床垫有污渍',
      deductionAmount: 50,
      evidenceImages: ['damage_001.jpg', 'damage_002.jpg'],
    },
  },
  {
    id: generateId(),
    orderId: generateId(),
    bedNumber: 'WK-002',
    type: 'manual_close',
    createdAt: formatDateTime(new Date(now.getTime() - 3 * 60 * 60 * 1000)),
    operator: '王管理员',
    data: {
      type: 'manual_close',
      closeReason: 'device_failure',
      closeRemark: '扫码设备故障，无法正常解锁，已安排维修',
      closeTime: formatDateTime(new Date(now.getTime() - 3 * 60 * 60 * 1000)),
    },
  },
  {
    id: generateId(),
    orderId: orders[2].id,
    bedNumber: orders[2].bedNumber,
    type: 'deposit_refund',
    createdAt: formatDateTime(longEnd),
    operator: '李护士长',
    data: {
      type: 'deposit_refund',
      refundAmount: Number(Math.max(0, 200 - feeDetailLong.totalAmount).toFixed(2)),
      refundMethod: '支付宝原路退回',
      refundTime: formatDateTime(longEnd),
      remark: '扣除损坏赔偿50元后退还剩余押金',
    },
  },
];

export const initialAdmin: Admin = {
  username: 'admin',
  password: 'admin123',
  name: '系统管理员',
  role: 'super_admin',
};
