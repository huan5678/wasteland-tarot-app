import { api } from '@/lib/apiClient';

export const profileAPI = {
  uploadAvatar: async (file: File): Promise<{ message: string; avatar_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ message: string; avatar_url: string }>('/profile/avatar', formData);
  },
  
  getProfile: async () => {
    return api.get('/profile/me');
  },
  
  updateProfile: async (data: Record<string, unknown>) => {
    return api.patch('/profile/me', data);
  }
};
