import { apiGet, apiPost } from './client';

export const adminApi = {
  login: (body: { username: string; password: string }) => apiPost<{ token: string; admin: { username: string; name: string; role: string } }>('/admin/login', body),
  dashboard: () => apiGet<{
    todayOrderCount: number; activeOrderCount: number; todayIncome: number; pendingRecordCount: number;
    activeOrders: any[]; recentRecords: any[];
  }>('/admin/dashboard'),
};
