export type BedStatus = 'available' | 'occupied' | 'maintenance' | 'damaged';

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
  feeAdjustment?: number;
  adjustedAmount?: number;
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
