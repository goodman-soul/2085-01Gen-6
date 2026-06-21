import type { Bed, Order, ExceptionRecord, Admin } from './types.js';
import { formatDateTime } from './utils/dateUtils.js';
import { calculateFee } from './feeCalculator.js';

export const wards: string[] = [
  '内科病区',
  '外科病区',
  '妇产科病区',
  '儿科病区',
  'ICU病区',
];

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

let orderCounter = 0;

export function generateOrderId(): string {
  orderCounter++;
  const year = new Date().getFullYear();
  return `ord-${year}-${String(orderCounter).padStart(3, '0')}`;
}

export function generateRecordId(): string {
  const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  return `rec-${hex()}-${hex()}`;
}

function createInitialBeds(): Bed[] {
  const now = Date.now();
  return [
    {
      id: 'bed-nk001',
      bedNumber: 'NK-001',
      ward: wards[0],
      floor: 3,
      status: 'available',
      hourlyRate: 3,
      depositAmount: 200,
      qrCode: 'BED-NK-001-QR',
      lastMaintenanceDate: formatDateTime(new Date(now - 7 * 24 * 60 * 60 * 1000)),
    },
    {
      id: 'bed-nk002',
      bedNumber: 'NK-002',
      ward: wards[0],
      floor: 3,
      status: 'occupied',
      hourlyRate: 3,
      depositAmount: 200,
      qrCode: 'BED-NK-002-QR',
      lastMaintenanceDate: formatDateTime(new Date(now - 5 * 24 * 60 * 60 * 1000)),
    },
    {
      id: 'bed-wk001',
      bedNumber: 'WK-001',
      ward: wards[1],
      floor: 5,
      status: 'available',
      hourlyRate: 3,
      depositAmount: 200,
      qrCode: 'BED-WK-001-QR',
      lastMaintenanceDate: formatDateTime(new Date(now - 10 * 24 * 60 * 60 * 1000)),
    },
    {
      id: 'bed-wk002',
      bedNumber: 'WK-002',
      ward: wards[1],
      floor: 5,
      status: 'maintenance',
      hourlyRate: 3,
      depositAmount: 200,
      qrCode: 'BED-WK-002-QR',
      lastMaintenanceDate: formatDateTime(new Date(now - 1 * 24 * 60 * 60 * 1000)),
    },
    {
      id: 'bed-fc001',
      bedNumber: 'FC-001',
      ward: wards[2],
      floor: 4,
      status: 'damaged',
      hourlyRate: 3,
      depositAmount: 200,
      qrCode: 'BED-FC-001-QR',
      lastMaintenanceDate: formatDateTime(new Date(now - 14 * 24 * 60 * 60 * 1000)),
    },
    {
      id: 'bed-icu001',
      bedNumber: 'ICU-001',
      ward: wards[4],
      floor: 6,
      status: 'available',
      hourlyRate: 3,
      depositAmount: 200,
      qrCode: 'BED-ICU-001-QR',
      lastMaintenanceDate: formatDateTime(new Date(now - 3 * 24 * 60 * 60 * 1000)),
    },
  ];
}

function createInitialOrders(beds: Bed[]): Order[] {
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

  const year = now.getFullYear();

  return [
    {
      id: `ord-${year}-001`,
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
      id: `ord-${year}-002`,
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
      id: `ord-${year}-003`,
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
}

function createInitialRecords(orders: Order[]): ExceptionRecord[] {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

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

  return [
    {
      id: 'rec-a001-b001',
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
      id: 'rec-a001-b002',
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
      id: 'rec-a002-b001',
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
      id: 'rec-a002-b002',
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
      id: 'rec-a002-b003',
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
}

function createInitialAdmin(): Admin[] {
  return [
    {
      username: 'admin',
      password: 'admin123',
      name: '系统管理员',
      role: 'super_admin',
    },
  ];
}

export const beds: Bed[] = [];
export const orders: Order[] = [];
export const records: ExceptionRecord[] = [];
export const admin: Admin[] = [];

export function resetDb(): void {
  beds.length = 0;
  orders.length = 0;
  records.length = 0;
  admin.length = 0;
  orderCounter = 0;

  const initBeds = createInitialBeds();
  beds.push(...initBeds);

  const initOrders = createInitialOrders(initBeds);
  orders.push(...initOrders);
  orderCounter = initOrders.length;

  const initRecords = createInitialRecords(initOrders);
  records.push(...initRecords);

  const initAdmin = createInitialAdmin();
  admin.push(...initAdmin);
}

resetDb();
