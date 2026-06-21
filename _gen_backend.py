#!/usr/bin/env python3
import os

BASE = '/Users/goodman/solo/2085/2085-01Gen-6/api'

def write_file(rel_path, content):
    full = os.path.join(BASE, rel_path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  Created {rel_path}')

# === types.ts ===
write_file('types.ts', """export type BedStatus = 'available' | 'occupied' | 'maintenance' | 'damaged';

export interface Bed {
  id: string;
  bedNumber: string;
  ward: string;
  floor: number;
  status: BedStatus;
  hourlyRate: number;
  depositAmount: number;
  qrCode: string;
  lastMaintenanceDate?: string;
}

export type OrderStatus = 'pending' | 'active' | 'returning' | 'completed' | 'cancelled' | 'manual_closed';

export type CleanStatus = 'clean' | 'need_clean' | 'heavily_soiled';

export interface FeeDetail {
  baseFee: number;
  nightCapDiscount: number;
  dailyCapDiscount: number;
  damageDeduction: number;
  cleaningFee: number;
  totalAmount: number;
}

export interface Order {
  id: string;
  bedId: string;
  bedNumber: string;
  ward: string;
  userPhone: string;
  status: OrderStatus;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  depositAmount: number;
  feeDetail?: FeeDetail;
  actualPayment?: number;
  depositRefund?: number;
  cleanStatus?: CleanStatus;
  returnWard?: string;
  nightCapped?: boolean;
  dailyCapped?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RecordType = 'night_cap' | 'deposit_refund' | 'bed_damage' | 'manual_close';

export type DamageLevel = 'minor' | 'moderate' | 'severe';

export type CloseReason = 'timeout' | 'device_failure' | 'user_complaint' | 'staff_adjustment' | 'other';

export interface NightCapRecord {
  type: 'night_cap';
  nightStart: string;
  nightEnd: string;
  originalHours: number;
  cappedHours: number;
  savedAmount: number;
}

export interface DepositRefundRecord {
  type: 'deposit_refund';
  refundAmount: number;
  refundMethod: string;
  refundTime: string;
  remark?: string;
}

export interface BedDamageRecord {
  type: 'bed_damage';
  damageLevel: DamageLevel;
  damageDescription: string;
  deductionAmount: number;
  evidenceImages?: string[];
}

export interface ManualCloseRecord {
  type: 'manual_close';
  closeReason: CloseReason;
  closeRemark?: string;
  closeTime: string;
}

export type ExceptionRecordData = NightCapRecord | DepositRefundRecord | BedDamageRecord | ManualCloseRecord;

export interface ExceptionRecord {
  id: string;
  orderId: string;
  bedNumber: string;
  type: RecordType;
  createdAt: string;
  operator: string;
  data: ExceptionRecordData;
}

export interface Admin {
  username: string;
  password: string;
  name: string;
  role: string;
}
""")

# === feeCalculator.ts ===
write_file('feeCalculator.ts', """import type { FeeDetail } from './types.js';

const HOURLY_RATE = 3;
const NIGHT_CAP = 30;
const DAILY_CAP = 60;
const NIGHT_START_HOUR = 22;
const NIGHT_END_HOUR = 6;

export const isNightHour = (hour: number): boolean => {
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
};

export const calculateNightHours = (start: Date, end: Date): number => {
  let totalNightMinutes = 0;
  const current = new Date(start);

  while (current < end) {
    const nextHour = new Date(current);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

    const segmentEnd = nextHour < end ? nextHour : end;
    const segmentDuration = (segmentEnd.getTime() - current.getTime()) / (1000 * 60);

    if (isNightHour(current.getHours())) {
      totalNightMinutes += segmentDuration;
    }

    current.setTime(nextHour.getTime());
  }

  return totalNightMinutes / 60;
};

interface NightPeriod {
  start: Date;
  end: Date;
}

const getNightPeriodsInRange = (start: Date, end: Date): NightPeriod[] => {
  const periods: NightPeriod[] = [];
  const current = new Date(start);
  current.setMinutes(0, 0, 0);

  while (current < end) {
    if (current.getHours() === NIGHT_START_HOUR) {
      const nightStart = new Date(current);
      const nightEnd = new Date(current);
      nightEnd.setDate(nightEnd.getDate() + 1);
      nightEnd.setHours(NIGHT_END_HOUR, 0, 0, 0);

      const actualStart = nightStart > start ? nightStart : start;
      const actualEnd = nightEnd < end ? nightEnd : end;

      if (actualStart < actualEnd) {
        periods.push({ start: actualStart, end: actualEnd });
      }
    }

    current.setHours(current.getHours() + 1);
  }

  return periods;
};

interface DailyPeriod {
  start: Date;
  end: Date;
}

const getDailyPeriods = (start: Date, end: Date): DailyPeriod[] => {
  const periods: DailyPeriod[] = [];
  const periodStart = new Date(start);

  while (periodStart < end) {
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 1);

    const actualEnd = periodEnd < end ? periodEnd : end;
    periods.push({ start: periodStart, end: actualEnd });

    periodStart.setTime(periodEnd.getTime());
  }

  return periods;
};

interface CalculateFeeOptions {
  hourlyRate?: number;
  nightCap?: number;
  dailyCap?: number;
  damageDeduction?: number;
  cleaningFee?: number;
}

export const calculateFee = (
  startTime: Date | string,
  endTime: Date | string,
  options: CalculateFeeOptions = {}
): FeeDetail => {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

  const hourlyRate = options.hourlyRate ?? HOURLY_RATE;
  const nightCap = options.nightCap ?? NIGHT_CAP;
  const dailyCap = options.dailyCap ?? DAILY_CAP;
  const damageDeduction = options.damageDeduction ?? 0;
  const cleaningFee = options.cleaningFee ?? 0;

  const totalMinutes = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
  const totalHours = totalMinutes / 60;
  const baseFee = Number((totalHours * hourlyRate).toFixed(2));

  let nightCapDiscount = 0;
  const nightPeriods = getNightPeriodsInRange(start, end);
  const nightCapSavings: number[] = [];

  for (const period of nightPeriods) {
    const periodHours = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60);
    const periodFee = periodHours * hourlyRate;
    if (periodFee > nightCap) {
      nightCapSavings.push(Number((periodFee - nightCap).toFixed(2)));
    }
  }
  nightCapDiscount = Number(nightCapSavings.reduce((sum, val) => sum + val, 0).toFixed(2));

  let dailyCapDiscount = 0;
  const dailyPeriods = getDailyPeriods(start, end);
  const dailyCapSavings: number[] = [];

  for (const period of dailyPeriods) {
    const periodHours = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60);
    let periodFee = periodHours * hourlyRate;

    let periodNightDiscount = 0;
    const periodNightHours = calculateNightHours(period.start, period.end);
    const periodNightFee = periodNightHours * hourlyRate;
    if (periodNightFee > nightCap && periodNightHours > 0) {
      periodNightDiscount = periodNightFee - nightCap;
    }

    periodFee = periodFee - periodNightDiscount;

    if (periodFee > dailyCap) {
      const saving = Number((periodFee - dailyCap).toFixed(2));
      dailyCapSavings.push(saving);
    }
  }
  dailyCapDiscount = Number(dailyCapSavings.reduce((sum, val) => sum + val, 0).toFixed(2));

  let totalAmount = baseFee - nightCapDiscount - dailyCapDiscount + damageDeduction + cleaningFee;
  totalAmount = Number(Math.max(0, totalAmount).toFixed(2));

  return {
    baseFee,
    nightCapDiscount,
    dailyCapDiscount,
    damageDeduction,
    cleaningFee,
    totalAmount,
  };
};
""")

# === db.ts ===
write_file('db.ts', """import type { Bed, Order, ExceptionRecord, Admin } from './types.js';
import { formatDateTime } from './utils/dateUtils.js';
import { calculateFee } from './feeCalculator.js';

export const wards: string[] = [
  '\\u5185\\u79d1\\u75c5\\u533a',
  '\\u5916\\u79d1\\u75c5\\u533a',
  '\\u5987\\u4ea7\\u79d1\\u75c5\\u533a',
  '\\u513f\\u79d1\\u75c5\\u533a',
  'ICU\\u75c5\\u533a',
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
      operator: '\\u7cfb\\u7edf',
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
      operator: '\\u5f20\\u62a4\\u58eb',
      data: {
        type: 'deposit_refund',
        refundAmount: Number((200 - feeDetailCompleted.totalAmount).toFixed(2)),
        refundMethod: '\\u5fae\\u4fe1\\u539f\\u8def\\u9000\\u56de',
        refundTime: formatDateTime(todayMorning),
        remark: '\\u6b63\\u5e38\\u5f52\\u8fd8\\uff0c\\u8d39\\u7528\\u7ed3\\u7b97\\u5b8c\\u6210',
      },
    },
    {
      id: 'rec-a002-b001',
      orderId: orders[2].id,
      bedNumber: orders[2].bedNumber,
      type: 'bed_damage',
      createdAt: formatDateTime(longEnd),
      operator: '\\u674e\\u62a4\\u58eb\\u957f',
      data: {
        type: 'bed_damage',
        damageLevel: 'minor',
        damageDescription: '\\u5e8a\\u67b6\\u6276\\u624b\\u6709\\u8f7b\\u5fae\\u5212\\u75d5\\uff0c\\u5e8a\\u57ab\\u6709\\u6c61\\u6e0d',
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
      operator: '\\u738b\\u7ba1\\u7406\\u5458',
      data: {
        type: 'manual_close',
        closeReason: 'device_failure',
        closeRemark: '\\u626b\\u7801\\u8bbe\\u5907\\u6545\\u969c\\uff0c\\u65e0\\u6cd5\\u6b63\\u5e38\\u89e3\\u9501\\uff0c\\u5df2\\u5b89\\u6392\\u7ef4\\u4fee',
        closeTime: formatDateTime(new Date(now.getTime() - 3 * 60 * 60 * 1000)),
      },
    },
    {
      id: 'rec-a002-b003',
      orderId: orders[2].id,
      bedNumber: orders[2].bedNumber,
      type: 'deposit_refund',
      createdAt: formatDateTime(longEnd),
      operator: '\\u674e\\u62a4\\u58eb\\u957f',
      data: {
        type: 'deposit_refund',
        refundAmount: Number(Math.max(0, 200 - feeDetailLong.totalAmount).toFixed(2)),
        refundMethod: '\\u652f\\u4ed8\\u5b9d\\u539f\\u8def\\u9000\\u56de',
        refundTime: formatDateTime(longEnd),
        remark: '\\u6263\\u9664\\u635f\\u574f\\u8d54\\u507f50\\u5143\\u540e\\u9000\\u8fd8\\u5269\\u4f59\\u62bc\\u91d1',
      },
    },
  ];
}

function createInitialAdmin(): Admin[] {
  return [
    {
      username: 'admin',
      password: 'admin123',
      name: '\\u7cfb\\u7edf\\u7ba1\\u7406\\u5458',
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
""")

# === routes/beds.ts ===
write_file('routes/beds.ts', """import { Router } from 'express';
import { beds } from '../db.js';
import type { Bed, BedStatus } from '../types.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    let result = [...beds];
    const { ward, status } = req.query;
    if (ward) result = result.filter((b) => b.ward === ward);
    if (status) result = result.filter((b) => b.status === (status as BedStatus));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/qr/:qrCode', (req, res) => {
  try {
    const bed = beds.find((b) => b.qrCode === req.params.qrCode);
    if (!bed) {
      res.status(404).json({ error: 'Bed not found' });
      return;
    }
    res.json(bed);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:id', (req, res) => {
  try {
    const bed = beds.find((b) => b.id === req.params.id);
    if (!bed) {
      res.status(404).json({ error: 'Bed not found' });
      return;
    }
    res.json(bed);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body as { status: BedStatus };
    const bed = beds.find((b) => b.id === req.params.id);
    if (!bed) {
      res.status(404).json({ error: 'Bed not found' });
      return;
    }
    bed.status = status;
    res.json(bed);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
""")

# === routes/orders.ts ===
write_file('routes/orders.ts', """import { Router } from 'express';
import { beds, orders, records, generateOrderId, generateRecordId, generateId } from '../db.js';
import { calculateFee, calculateNightHours } from '../feeCalculator.js';
import { formatDateTime } from '../utils/dateUtils.js';
import type { Order, DamageLevel, CleanStatus, CloseReason } from '../types.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    let result = [...orders];
    const { status, phone, keyword } = req.query;
    if (status) result = result.filter((o) => o.status === status);
    if (phone) result = result.filter((o) => o.userPhone.includes(String(phone)));
    if (keyword) {
      const kw = String(keyword).toLowerCase();
      result = result.filter(
        (o) =>
          o.bedNumber.toLowerCase().includes(kw) ||
          o.userPhone.includes(kw) ||
          o.id.toLowerCase().includes(kw)
      );
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:id', (req, res) => {
  try {
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/', (req, res) => {
  try {
    const { bedId, userPhone } = req.body as { bedId: string; userPhone: string };
    const bed = beds.find((b) => b.id === bedId);
    if (!bed) {
      res.status(404).json({ error: 'Bed not found' });
      return;
    }
    if (bed.status !== 'available') {
      res.status(400).json({ error: 'Bed is not available' });
      return;
    }

    const now = new Date();
    const order: Order = {
      id: generateOrderId(),
      bedId,
      bedNumber: bed.bedNumber,
      ward: bed.ward,
      userPhone,
      status: 'active',
      startTime: formatDateTime(now),
      depositAmount: bed.depositAmount,
      createdAt: formatDateTime(now),
      updatedAt: formatDateTime(now),
    };

    orders.push(order);
    bed.status = 'occupied';

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/:id/complete', (req, res) => {
  try {
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.status !== 'active') {
      res.status(400).json({ error: 'Order is not active' });
      return;
    }

    const { cleanStatus, returnWard, damageLevel } = req.body as {
      cleanStatus: CleanStatus;
      returnWard: string;
      damageLevel?: DamageLevel;
    };

    const now = new Date();
    const startTime = new Date(order.startTime);
    const endTime = now;
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    const damageDeduction = damageLevel === 'minor' ? 50 : damageLevel === 'moderate' ? 150 : damageLevel === 'severe' ? 300 : 0;

    const feeDetail = calculateFee(startTime, endTime, { damageDeduction });
    const actualPayment = feeDetail.totalAmount;
    const depositRefund = Number(Math.max(0, order.depositAmount - actualPayment).toFixed(2));

    order.endTime = formatDateTime(endTime);
    order.durationMinutes = durationMinutes;
    order.status = 'completed';
    order.feeDetail = feeDetail;
    order.actualPayment = actualPayment;
    order.depositRefund = depositRefund;
    order.cleanStatus = cleanStatus;
    order.returnWard = returnWard;
    order.nightCapped = feeDetail.nightCapDiscount > 0;
    order.dailyCapped = feeDetail.dailyCapDiscount > 0;
    order.updatedAt = formatDateTime(now);

    const bed = beds.find((b) => b.id === order.bedId);
    if (bed) {
      if (damageLevel === 'moderate' || damageLevel === 'severe') {
        bed.status = 'damaged';
      } else if (cleanStatus === 'heavily_soiled') {
        bed.status = 'maintenance';
      } else {
        bed.status = 'available';
      }
    }

    if (feeDetail.nightCapDiscount > 0) {
      const nightHours = calculateNightHours(startTime, endTime);
      records.push({
        id: generateRecordId(),
        orderId: order.id,
        bedNumber: order.bedNumber,
        type: 'night_cap',
        createdAt: formatDateTime(now),
        operator: '\\u7cfb\\u7edf',
        data: {
          type: 'night_cap',
          nightStart: formatDateTime(new Date(startTime.getTime() + 1 * 60 * 60 * 1000)),
          nightEnd: formatDateTime(new Date(startTime.getTime() + (1 + nightHours) * 60 * 60 * 1000)),
          originalHours: Number(nightHours.toFixed(1)),
          cappedHours: 10,
          savedAmount: feeDetail.nightCapDiscount,
        },
      });
    }

    records.push({
      id: generateRecordId(),
      orderId: order.id,
      bedNumber: order.bedNumber,
      type: 'deposit_refund',
      createdAt: formatDateTime(now),
      operator: '\\u7cfb\\u7edf',
      data: {
        type: 'deposit_refund',
        refundAmount: depositRefund,
        refundMethod: '\\u5fae\\u4fe1\\u539f\\u8def\\u9000\\u56de',
        refundTime: formatDateTime(now),
        remark: '\\u6b63\\u5e38\\u5f52\\u8fd8\\uff0c\\u8d39\\u7528\\u7ed3\\u7b97\\u5b8c\\u6210',
      },
    });

    if (damageLevel) {
      const descMap: Record<DamageLevel, string> = {
        minor: '\\u8f7b\\u5fae\\u635f\\u574f',
        moderate: '\\u4e2d\\u5ea6\\u635f\\u574f',
        severe: '\\u4e25\\u91cd\\u635f\\u574f',
      };
      records.push({
        id: generateRecordId(),
        orderId: order.id,
        bedNumber: order.bedNumber,
        type: 'bed_damage',
        createdAt: formatDateTime(now),
        operator: '\\u7cfb\\u7edf',
        data: {
          type: 'bed_damage',
          damageLevel,
          damageDescription: descMap[damageLevel],
          deductionAmount: damageDeduction,
        },
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/:id/manual-close', (req, res) => {
  try {
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.status !== 'active') {
      res.status(400).json({ error: 'Order is not active' });
      return;
    }

    const { closeReason, closeRemark, feeAdjustment, waiverPercent, operator } = req.body as {
      closeReason: CloseReason;
      closeRemark?: string;
      feeAdjustment: number;
      waiverPercent?: number;
      operator: string;
    };

    const now = new Date();
    const startTime = new Date(order.startTime);
    const endTime = now;
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    let feeDetail = calculateFee(startTime, endTime);
    let totalAmount = feeDetail.totalAmount + (feeAdjustment || 0);
    if (waiverPercent && waiverPercent > 0) {
      totalAmount = Number((totalAmount * (1 - waiverPercent / 100)).toFixed(2));
    }
    totalAmount = Number(Math.max(0, totalAmount).toFixed(2));

    feeDetail = { ...feeDetail, totalAmount };
    const actualPayment = totalAmount;
    const depositRefund = Number(Math.max(0, order.depositAmount - actualPayment).toFixed(2));

    order.endTime = formatDateTime(endTime);
    order.durationMinutes = durationMinutes;
    order.status = 'manual_closed';
    order.feeDetail = feeDetail;
    order.actualPayment = actualPayment;
    order.depositRefund = depositRefund;
    order.updatedAt = formatDateTime(now);

    const bed = beds.find((b) => b.id === order.bedId);
    if (bed) {
      bed.status = 'available';
    }

    records.push({
      id: generateRecordId(),
      orderId: order.id,
      bedNumber: order.bedNumber,
      type: 'manual_close',
      createdAt: formatDateTime(now),
      operator,
      data: {
        type: 'manual_close',
        closeReason,
        closeRemark,
        closeTime: formatDateTime(now),
      },
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
""")

# === routes/records.ts ===
write_file('routes/records.ts', """import { Router } from 'express';
import { records, generateRecordId } from '../db.js';
import { formatDateTime } from '../utils/dateUtils.js';
import type { RecordType, ExceptionRecordData } from '../types.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    let result = [...records];
    const { type, orderId } = req.query;
    if (type) result = result.filter((r) => r.type === (type as RecordType));
    if (orderId) result = result.filter((r) => r.orderId === String(orderId));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:id', (req, res) => {
  try {
    const record = records.find((r) => r.id === req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/', (req, res) => {
  try {
    const { orderId, bedNumber, type, operator, data } = req.body as {
      orderId: string;
      bedNumber: string;
      type: RecordType;
      operator: string;
      data: ExceptionRecordData;
    };

    const now = new Date();
    const record = {
      id: generateRecordId(),
      orderId,
      bedNumber,
      type,
      createdAt: formatDateTime(now),
      operator,
      data,
    };

    records.push(record);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const record = records.find((r) => r.id === req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    Object.assign(record, req.body);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
""")

# === routes/admin.ts ===
write_file('routes/admin.ts', """import { Router } from 'express';
import { orders, records, admin, generateId } from '../db.js';
import { formatDateTime } from '../utils/dateUtils.js';
import type { Admin } from '../types.js';

const router = Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    const found = admin.find((a) => a.username === username && a.password === password);
    if (!found) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = `token-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const { password: _, ...adminInfo } = found;
    res.json({ token, admin: adminInfo });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/dashboard', (req, res) => {
  try {
    const now = new Date();
    const todayStr = formatDateTime(now).split(' ')[0];

    const todayOrderCount = orders.filter((o) => o.createdAt.startsWith(todayStr)).length;
    const activeOrderCount = orders.filter((o) => o.status === 'active').length;

    const todayIncome = orders
      .filter((o) => (o.status === 'completed' || o.status === 'manual_closed') && o.createdAt.startsWith(todayStr))
      .reduce((sum, o) => sum + (o.actualPayment || 0), 0);

    const pendingRecordCount = records.filter((r) => r.type === 'bed_damage').length;

    const activeOrders = orders.filter((o) => o.status === 'active');
    const recentRecords = [...records].reverse().slice(0, 10);

    res.json({
      todayOrderCount,
      activeOrderCount,
      todayIncome: Number(todayIncome.toFixed(2)),
      pendingRecordCount,
      activeOrders,
      recentRecords,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
""")

# === server.ts ===
write_file('server.ts', """import express from 'express';
import cors from 'cors';
import bedsRouter from './routes/beds.js';
import ordersRouter from './routes/orders.js';
import recordsRouter from './routes/records.js';
import adminRouter from './routes/admin.js';
import { resetDb } from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/beds', bedsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/records', recordsRouter);
app.use('/api/admin', adminRouter);

app.get('/api', (_req, res) => {
  res.json({ message: 'Hospital Bed Management API' });
});

resetDb();

if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app };
""")

print('\\nAll files created successfully!')
