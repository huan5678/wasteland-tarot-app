import { api } from '@/lib/apiClient';
import type { PublicReadingData } from '@/types/api';

export const shareAPI = {
  getSharedReading: async (token: string): Promise<PublicReadingData> => {
    return api.get<PublicReadingData>(`/share/${token}`);
  }
};
