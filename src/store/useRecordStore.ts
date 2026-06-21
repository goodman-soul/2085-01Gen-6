import { create } from 'zustand';
import type { ExceptionRecord, RecordType } from '../types';
import { recordApi } from '../api/records';

type PartialRecord = Partial<Omit<ExceptionRecord, 'id' | 'createdAt'>>;

interface RecordState {
  records: ExceptionRecord[];
  loading: boolean;
  fetchRecords: (params?: { type?: RecordType; orderId?: string }) => Promise<void>;
  addRecord: (record: Omit<ExceptionRecord, 'id' | 'createdAt'> & { createdAt?: string }) => Promise<void>;
  getRecordsByType: (type: RecordType) => ExceptionRecord[];
  getRecordsByOrderId: (orderId: string) => ExceptionRecord[];
  updateRecord: (id: string, updates: PartialRecord) => Promise<void>;
}

export const useRecordStore = create<RecordState>((set, get) => ({
  records: [],
  loading: false,

  fetchRecords: async (params) => {
    set({ loading: true });
    try {
      const records = await recordApi.list(params);
      set({ records, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  addRecord: async (record) => {
    set({ loading: true });
    try {
      await recordApi.create(record as Record<string, unknown>);
      set({ loading: false });
      await get().fetchRecords();
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  getRecordsByType: (type: RecordType) => {
    return get().records.filter((record) => record.type === type);
  },

  getRecordsByOrderId: (orderId: string) => {
    return get().records.filter((record) => record.orderId === orderId);
  },

  updateRecord: async (id: string, updates: PartialRecord) => {
    set({ loading: true });
    try {
      await recordApi.update(id, updates as Record<string, unknown>);
      set({ loading: false });
      await get().fetchRecords();
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
