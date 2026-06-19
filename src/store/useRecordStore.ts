import { create } from 'zustand';
import type { ExceptionRecord, RecordType } from '../types';
import { initialRecords } from '../utils/mockData';

type PartialRecord = Partial<Omit<ExceptionRecord, 'id' | 'createdAt'>>;

interface RecordState {
  records: ExceptionRecord[];
  loading: boolean;
  initRecords: () => void;
  addRecord: (record: Omit<ExceptionRecord, 'id' | 'createdAt'> & { createdAt?: string }) => ExceptionRecord;
  getRecordsByType: (type: RecordType) => ExceptionRecord[];
  getRecordsByOrderId: (orderId: string) => ExceptionRecord[];
  updateRecord: (id: string, updates: PartialRecord) => ExceptionRecord | null;
}

const STORAGE_KEY = 'record-store';

function loadFromStorage(): ExceptionRecord[] | null {
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

function saveToStorage(records: ExceptionRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

function generateRandomHex(length: number): string {
  const chars = '0123456789ABCDEF';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRecordId(): string {
  return `rec-${generateRandomHex(4)}-${generateRandomHex(4)}`;
}

export const useRecordStore = create<RecordState>((set, get) => ({
  records: [],
  loading: false,

  initRecords: () => {
    set({ loading: true });
    const stored = loadFromStorage();
    const records = stored && stored.length > 0 ? stored : initialRecords;
    set({ records, loading: false });
    saveToStorage(records);
  },

  addRecord: (record) => {
    const now = new Date().toISOString();
    const newRecord: ExceptionRecord = {
      ...record,
      id: generateRecordId(),
      createdAt: record.createdAt || now,
    } as ExceptionRecord;

    const records = [...get().records, newRecord];
    set({ records });
    saveToStorage(records);

    return newRecord;
  },

  getRecordsByType: (type: RecordType) => {
    return get().records.filter((record) => record.type === type);
  },

  getRecordsByOrderId: (orderId: string) => {
    return get().records.filter((record) => record.orderId === orderId);
  },

  updateRecord: (id: string, updates: PartialRecord) => {
    const record = get().records.find((r) => r.id === id);
    if (!record) {
      return null;
    }

    const updatedRecord: ExceptionRecord = { ...record, ...updates };
    const records = get().records.map((r) =>
      r.id === id ? updatedRecord : r
    );
    set({ records });
    saveToStorage(records);

    return updatedRecord;
  },
}));
