import { api } from '@/lib/apiClient';

export interface TokenExtensionStats {
  total_extensions: number;
  activity_extensions: number;
  loyalty_extensions: number;
  total_minutes_extended: number;
  average_extension_minutes: number;
  success_rate: number;
  daily_stats: {
    date: string;
    total: number;
    activity: number;
    loyalty: number;
    minutes_extended: number;
  }[];
}

export interface TokenExtensionEvent {
  id: string;
  type: string; // 'activity' | 'loyalty'
  type_text: string;
  event_data: {
    extension_type: string;
    extension_minutes: number;
    success: boolean;
    reason?: string;
  };
  success_text: string;
  readable_time: string;
  created_at: string;
}

export interface TokenExtensionHistory {
  total_count: number;
  extensions: TokenExtensionEvent[];
}

export const getTokenExtensionStats = async (startDate: string, endDate: string): Promise<TokenExtensionStats> => {
  return api.get<TokenExtensionStats>(`/token-analytics/stats?start_date=${startDate}&end_date=${endDate}`);
};

export const getTokenExtensionHistory = async (
  type: 'activity' | 'loyalty' | undefined,
  startDate: string,
  endDate: string,
  limit: number = 100
): Promise<TokenExtensionHistory> => {
  const query = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    limit: String(limit)
  });
  if (type) query.append('type', type);
  
  return api.get<TokenExtensionHistory>(`/token-analytics/history?${query.toString()}`);
};
