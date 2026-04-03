export interface DailyStats {
  date: string;
  committed: number;
  reserved: number;
  limit: number;
  utilization: number;
}

export interface StatsResponse {
  plan: string;
  daily_limit: number;
  period: { from: string; to: string };
  days: DailyStats[];
  summary: {
    total_committed: number;
    avg_daily: number;
    peak_day: { date: string; count: number };
    current_streak: number;
  };
}