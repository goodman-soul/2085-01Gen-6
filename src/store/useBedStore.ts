import { create } from 'zustand';
import type { Bed, BedStatus } from '../types';
import { initialBeds } from '../utils/mockData';

interface BedState {
  beds: Bed[];
  loading: boolean;
  initBeds: () => void;
  getAvailableBeds: () => Bed[];
  getBedById: (id: string) => Bed | undefined;
  updateBedStatus: (id: string, status: BedStatus) => void;
}

const STORAGE_KEY = 'bed-store';

function loadFromStorage(): Bed[] | null {
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

function saveToStorage(beds: Bed[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(beds));
  } catch {
    // ignore
  }
}

export const useBedStore = create<BedState>((set, get) => ({
  beds: [],
  loading: false,

  initBeds: () => {
    set({ loading: true });
    const stored = loadFromStorage();
    const beds = stored && stored.length > 0 ? stored : initialBeds;
    set({ beds, loading: false });
    saveToStorage(beds);
  },

  getAvailableBeds: () => {
    return get().beds.filter((bed) => bed.status === 'available');
  },

  getBedById: (id: string) => {
    return get().beds.find((bed) => bed.id === id);
  },

  updateBedStatus: (id: string, status: BedStatus) => {
    const beds = get().beds.map((bed) =>
      bed.id === id ? { ...bed, status } : bed
    );
    set({ beds });
    saveToStorage(beds);
  },
}));
