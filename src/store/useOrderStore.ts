import { create } from 'zustand';
import type { Order, OrderStatus, CleanStatus, DamageLevel } from '../types';
import { initialOrders } from '../utils/mockData';
import { calculateFee } from '../utils/feeCalculator';
import { useBedStore } from './useBedStore';

interface ReturnData {
  endTime?: string;
  cleanStatus?: CleanStatus;
  returnWard?: string;
  damageLevel?: DamageLevel;
}

const CLEANING_FEE_MAP: Record<CleanStatus, number> = {
  clean: 0,
  need_clean: 10,
  heavily_soiled: 30,
};

const DAMAGE_DEDUCTION_MAP: Record<DamageLevel, number> = {
  minor: 50,
  moderate: 150,
  severe: 200,
};

interface CloseData {
  closeReason?: string;
  operator?: string;
  feeAdjustment?: 'full_waiver' | 'partial_waiver' | 'normal_charge';
  adjustedAmount?: number;
}

interface OrderState {
  orders: Order[];
  currentOrderId: string | null;
  loading: boolean;
  initOrders: () => void;
  createOrder: (bedId: string, userPhone: string) => Order | null;
  completeOrder: (orderId: string, returnData: ReturnData) => Order | null;
  manualCloseOrder: (orderId: string, closeData: CloseData) => Order | null;
  getActiveOrders: () => Order[];
  getOrderById: (id: string) => Order | undefined;
  getUserOrders: (phone: string) => Order[];
}

const STORAGE_KEY = 'order-store';

function loadFromStorage(): Order[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    return null;
  }
  return null;
}

function saveToStorage(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

function generateOrderId(orders: Order[]): string {
  const year = new Date().getFullYear();
  const prefix = `ord-${year}-`;
  const existingIds = orders
    .filter((o) => o.id.startsWith(prefix))
    .map((o) => {
      const numStr = o.id.slice(prefix.length);
      return parseInt(numStr, 10);
    })
    .filter((n) => !isNaN(n));
  const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrderId: null,
  loading: false,

  initOrders: () => {
    set({ loading: true });
    const stored = loadFromStorage();
    const orders = stored && stored.length > 0 ? stored : initialOrders;
    set({ orders, loading: false });
    saveToStorage(orders);
  },

  createOrder: (bedId: string, userPhone: string) => {
    const bed = useBedStore.getState().getBedById(bedId);
    if (!bed || bed.status !== 'available') {
      return null;
    }

    const now = new Date().toISOString();
    const orders = get().orders;
    const orderId = generateOrderId(orders);

    const newOrder: Order = {
      id: orderId,
      bedId: bed.id,
      bedNumber: bed.bedNumber,
      ward: bed.ward,
      userPhone,
      status: 'active',
      startTime: now,
      depositAmount: bed.depositAmount,
      createdAt: now,
      updatedAt: now,
    };

    const updatedOrders = [...orders, newOrder];
    set({ orders: updatedOrders, currentOrderId: orderId });
    saveToStorage(updatedOrders);

    useBedStore.getState().updateBedStatus(bedId, 'occupied');

    return newOrder;
  },

  completeOrder: (orderId: string, returnData: ReturnData) => {
    const order = get().getOrderById(orderId);
    if (!order || order.status !== 'active') {
      return null;
    }

    const endTime = returnData.endTime || new Date().toISOString();
    const durationMs = new Date(endTime).getTime() - new Date(order.startTime).getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    const cleaningFee = returnData.cleanStatus ? CLEANING_FEE_MAP[returnData.cleanStatus] : 0;
    const damageDeduction = returnData.damageLevel ? DAMAGE_DEDUCTION_MAP[returnData.damageLevel] : 0;

    const feeDetail = calculateFee(order.startTime, endTime, {
      cleaningFee,
      damageDeduction,
    });

    const actualPayment = feeDetail.totalAmount;
    const depositRefund = Math.max(0, order.depositAmount - actualPayment);

    const now = new Date().toISOString();
    const updatedOrder: Order = {
      ...order,
      status: 'completed',
      endTime,
      durationMinutes,
      feeDetail,
      actualPayment,
      depositRefund,
      cleanStatus: returnData.cleanStatus,
      returnWard: returnData.returnWard,
      nightCapped: feeDetail.nightCapDiscount > 0,
      dailyCapped: feeDetail.dailyCapDiscount > 0,
      updatedAt: now,
    };

    const updatedOrders = get().orders.map((o) =>
      o.id === orderId ? updatedOrder : o
    );
    set({ orders: updatedOrders });
    saveToStorage(updatedOrders);

    if (!returnData.damageLevel) {
      useBedStore.getState().updateBedStatus(order.bedId, 'available');
    } else {
      useBedStore.getState().updateBedStatus(order.bedId, 'damaged');
    }

    return updatedOrder;
  },

  manualCloseOrder: (orderId: string, closeData: CloseData) => {
    const order = get().getOrderById(orderId);
    if (!order || order.status !== 'active') {
      return null;
    }

    const now = new Date().toISOString();
    let actualPayment = 0;
    let feeDetail;
    let depositRefund = order.depositAmount;

    if (closeData.feeAdjustment === 'normal_charge') {
      feeDetail = calculateFee(order.startTime, now);
      actualPayment = feeDetail.totalAmount;
      depositRefund = Math.max(0, order.depositAmount - actualPayment);
    } else if (closeData.feeAdjustment === 'partial_waiver' && closeData.adjustedAmount !== undefined) {
      actualPayment = closeData.adjustedAmount;
      depositRefund = Math.max(0, order.depositAmount - actualPayment);
    }

    const endTime = now;
    const durationMs = new Date(endTime).getTime() - new Date(order.startTime).getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    const updatedOrder: Order = {
      ...order,
      status: 'manual_closed' as OrderStatus,
      endTime,
      durationMinutes,
      feeDetail,
      actualPayment,
      depositRefund,
      updatedAt: now,
    };

    const updatedOrders = get().orders.map((o) =>
      o.id === orderId ? updatedOrder : o
    );
    set({ orders: updatedOrders });
    saveToStorage(updatedOrders);

    useBedStore.getState().updateBedStatus(order.bedId, 'available');

    return updatedOrder;
  },

  getActiveOrders: () => {
    return get().orders.filter((order) => order.status === 'active');
  },

  getOrderById: (id: string) => {
    return get().orders.find((order) => order.id === id);
  },

  getUserOrders: (phone: string) => {
    return get().orders.filter((order) => order.userPhone === phone);
  },
}));
