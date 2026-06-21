import { create } from 'zustand';
import type { Order, CleanStatus, DamageLevel } from '../types';
import { orderApi } from '../api/orders';
import { useBedStore } from './useBedStore';

interface ReturnData {
  endTime?: string;
  cleanStatus?: CleanStatus;
  returnWard?: string;
  damageLevel?: DamageLevel;
}

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
  fetchOrders: (params?: Record<string, unknown>) => Promise<void>;
  fetchOrderById: (id: string) => Promise<Order>;
  createOrder: (bedId: string, userPhone: string) => Promise<Order | null>;
  completeOrder: (orderId: string, returnData: ReturnData) => Promise<Order | null>;
  manualCloseOrder: (orderId: string, closeData: CloseData) => Promise<Order | null>;
  getActiveOrders: () => Order[];
  getOrderById: (id: string) => Order | undefined;
  getUserOrders: (phone: string) => Order[];
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrderId: null,
  loading: false,

  fetchOrders: async (params) => {
    set({ loading: true });
    try {
      const orders = await orderApi.list(params);
      set({ orders, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchOrderById: async (id: string) => {
    set({ loading: true });
    try {
      const order = await orderApi.getById(id);
      const orders = get().orders.map((o) => (o.id === id ? order : o));
      if (!orders.find((o) => o.id === id)) {
        orders.push(order);
      }
      set({ orders, loading: false });
      return order;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createOrder: async (bedId: string, userPhone: string) => {
    set({ loading: true });
    try {
      const newOrder = await orderApi.create({ bedId, userPhone });
      set({ currentOrderId: newOrder.id, loading: false });
      await get().fetchOrders();
      await useBedStore.getState().fetchBeds();
      return newOrder;
    } catch (error) {
      set({ loading: false });
      return null;
    }
  },

  completeOrder: async (orderId: string, returnData: ReturnData) => {
    set({ loading: true });
    try {
      const updatedOrder = await orderApi.complete(orderId, returnData);
      set({ loading: false });
      await get().fetchOrders();
      await useBedStore.getState().fetchBeds();
      return updatedOrder;
    } catch (error) {
      set({ loading: false });
      return null;
    }
  },

  manualCloseOrder: async (orderId: string, closeData: CloseData) => {
    set({ loading: true });
    try {
      const updatedOrder = await orderApi.manualClose(orderId, closeData);
      set({ loading: false });
      await get().fetchOrders();
      await useBedStore.getState().fetchBeds();
      return updatedOrder;
    } catch (error) {
      set({ loading: false });
      return null;
    }
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
