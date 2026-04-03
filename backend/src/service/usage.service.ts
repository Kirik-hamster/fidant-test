import 'dotenv/config'; 
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { subDays, format, isAfter, subMinutes } from 'date-fns';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const LIMITS = { starter: 30, pro: 100, executive: 500 };

export class UsageService {
  static async getStats(userId: number, daysCount: number) {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const limit = LIMITS[user.plan_tier as keyof typeof LIMITS] || 30;
    const to = new Date();
    const from = subDays(to, daysCount - 1);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // 1. Пытаемся взять данные из КЭША (Часть 3 задания)
    const cachedRows = await prisma.daily_usage_cache.findMany({
      where: {
        user_id: userId,
        date_key: { gte: format(from, 'yyyy-MM-dd'), lte: format(to, 'yyyy-MM-dd') }
      }
    });

    const cacheMap = new Map(cachedRows.map(row => [row.date_key, row]));
    const days = [];

    // 2. Идем циклом по каждому дню в запрошенном периоде
    for (let i = 0; i < daysCount; i++) {
      const dateKey = format(subDays(to, i), 'yyyy-MM-dd');
      let committed = 0;
      let reserved = 0;

      // Если день в кэше есть И это не сегодня — берем из кэша (Fallback на сырые данные не нужен)
      if (cacheMap.has(dateKey) && dateKey !== todayStr) {
        const cached = cacheMap.get(dateKey)!;
        committed = cached.committed_count;
        reserved = cached.reserved_count;
      } else {
        // FALLBACK: Считаем из сырых событий (Часть 3 - "fallback на сырой запрос")
        const rawStats = await this.calculateRawStats(userId, dateKey);
        committed = rawStats.committed;
        reserved = rawStats.reserved;

        // Если это прошлый день, сохраняем в кэш, чтобы не считать завтра
        if (dateKey !== todayStr) {
          await this.saveToCache(userId, dateKey, committed, reserved);
        }
      }

      days.push({
        date: dateKey,
        committed,
        reserved,
        limit,
        utilization: Number((committed / limit).toFixed(2))
      });
    }

    const sortedDays = days.sort((a, b) => a.date.localeCompare(b.date));
    const streak = 5; // Пока заглушка для ТЗ

    return {
      plan: user.plan_tier,
      daily_limit: limit,
      period: { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') },
      days: sortedDays,
      summary: this.calculateSummary(sortedDays, streak),
    };
  }

  // Вспомогательный метод: считаем из таблицы событий
  private static async calculateRawStats(userId: number, dateKey: string) {
    const fifteenMinsAgo = subMinutes(new Date(), 15);
    
    const events = await prisma.daily_usage_events.findMany({
      where: { user_id: userId, date_key: dateKey }
    });

    const committed = events.filter(e => e.status === 'committed').length;
    const reserved = events.filter(e => 
      e.status === 'reserved' && isAfter(new Date(e.reserved_at), fifteenMinsAgo)
    ).length;

    return { committed, reserved };
  }

  // Вспомогательный метод: записываем в таблицу кэша
  private static async saveToCache(userId: number, dateKey: string, committed: number, reserved: number) {
    await prisma.daily_usage_cache.upsert({
      where: { user_id_date_key: { user_id: userId, date_key: dateKey } },
      update: { committed_count: committed, reserved_count: reserved },
      create: { 
        user_id: userId, 
        date_key: dateKey, 
        committed_count: committed, 
        reserved_count: reserved 
      }
    });
  }

  private static calculateSummary(days: any[], streak: number) {
    const total = days.reduce((acc, d) => acc + d.committed, 0);
    const peak = [...days].sort((a, b) => b.committed - a.committed)[0];

    return {
      total_committed: total,
      avg_daily: Number((total / days.length).toFixed(1)),
      peak_day: { date: peak.date, count: peak.committed },
      current_streak: streak,
    };
  }
}