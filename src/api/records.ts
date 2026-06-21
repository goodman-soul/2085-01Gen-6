import { apiGet, apiPost, apiPatch } from './client';
import type { ExceptionRecord, RecordType } from '@/types';

export const recordApi = {
  list: (params?: { type?: RecordType; orderId?: string }) => apiGet<ExceptionRecord[]>('/records', params as Record<string, unknown>),
  create: (body: Record<string, unknown>) => apiPost<ExceptionRecord>('/records', body),
  update: (id: string, body: Record<string, unknown>) => apiPatch<ExceptionRecord>(`/records/${id}`, body),
};
