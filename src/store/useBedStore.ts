import { create } from 'zustand';
import type { Bed, BedStatus } from '../types';
import { bedApi } from '../api/beds';

interface BedState {
  beds: Bed[];
  loading: boolean;
  fetchBeds: (params?: { ward?: string; status?: string }) => Promise<void>;
  fetchBedById: (id: string) => Promise<Bed>;
  getAvailableBeds: () => Bed[];
  getBedById: (id: string) => Bed | undefined;
  updateBedStatus: (id: string, status: BedStatus) => Promise<void>;
}

export const useBedStore = create<BedState>((set, get) => ({
  beds: [],
  loading: false,

  fetchBeds: async (params) => {
    set({ loading: true });
    try {
      const beds = await bedApi.list(params);
      set({ beds, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchBedById: async (id: string) => {
    set({ loading: true });
    try {
      const bed = await bedApi.getById(id);
      const beds = get().beds.map((b) => (b.id === id ? bed : b));
      if (!beds.find((b) => b.id === id)) {
        beds.push(bed);
      }
      set({ beds, loading: false });
      return bed;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  getAvailableBeds: () => {
    return get().beds.filter((bed) => bed.status === 'available');
  },

  getBedById: (id: string) => {
    return get().beds.find((bed) => bed.id === id);
  },

  updateBedStatus: async (id: string, status: BedStatus) => {
    set({ loading: true });
    try {
      await bedApi.updateStatus(id, status);
      const beds = get().beds.map((bed) =>
        bed.id === id ? { ...bed, status } : bed
      );
      set({ beds, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
