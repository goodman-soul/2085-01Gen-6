import { apiGet, apiPost, apiPatch } from './client';
import type { Order, OrderStatus, CleanStatus, DamageLevel } from '@/types';

interface CreateOrderParams {
  bedId: string;
  userPhone: string;
}

interface CompleteOrderParams {
  endTime?: string;
  cleanStatus?: CleanStatus;
  returnWard?: string;
  damageLevel?: DamageLevel;
}

interface ManualCloseOrderParams {
  closeReason?: string;
  operator?: string;
  feeAdjustment?: 'full_waiver' | 'partial_waiver' | 'normal_charge';
  adjustedAmount?: number;
}

export const orderApi = {
  list: (params?: Record<string, unknown>) => apiGet<Order[]>('/orders', params),
  getById: (id: string) => apiGet<Order>(`/orders/${id}`),
  create: (body: CreateOrderParams) => apiPost<Order>('/orders', body),
  complete: (id: string, body: CompleteOrderParams) =>
    apiPatch<Order>(`/orders/${id}/complete`, body),
  manualClose: (id: string, body: ManualCloseOrderParams) =>
    apiPatch<Order>(`/orders/${id}/manual-close`, body),
  updateStatus: (id: string, status: OrderStatus) =>
    apiPatch<Order>(`/orders/${id}/status`, { status }),
};
