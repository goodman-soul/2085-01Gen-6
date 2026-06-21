import { apiGet, apiPatch } from './client';
import type { Bed, BedStatus } from '@/types';

export const bedApi = {
  list: (params?: { ward?: string; status?: string }) => apiGet<Bed[]>('/beds', params as Record<string, unknown>),
  getById: (id: string) => apiGet<Bed>(`/beds/${id}`),
  getByQrCode: (qrCode: string) => apiGet<Bed>(`/beds/qr/${qrCode}`),
  updateStatus: (id: string, status: BedStatus) => apiPatch<Bed>(`/beds/${id}/status`, { status }),
};
