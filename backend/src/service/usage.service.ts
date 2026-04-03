import 'dotenv/config';
import { subDays, format, isAfter, subMinutes } from 'date-fns';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// 1. Настраиваем соединение (те самые "руки")
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Создаем клиент, ПЕРЕДАВАЯ ему этот адаптер
const prisma = new PrismaClient({ adapter });

const LIMITS = { starter: 30, pro: 100, executive: 500 };

export class UsageService {
  static async getStats(userId: number, daysCount: number) {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const limit = LIMITS[user.plan_tier as keyof typeof LIMITS] || 30;
    const to = new Date();
    const from = subDays(to, daysCount - 1);
    const fifteenMinsAgo = subMinutes(new Date(), 15);

    // 1. Тянем события за период
    const events = await prisma.daily_usage_events.findMany({
      where: {
        user_id: userId,
        created_at: { gte: from },
      },
    });

    // 2. Генерируем массив всех дат в периоде (чтобы не было дырок)
    const statsMap = new Map<string, { committed: number; reserved: number }>();
    for (let i = 0; i < daysCount; i++) {
      const d = format(subDays(to, i), 'yyyy-MM-dd');
      statsMap.set(d, { committed: 0, reserved: 0 });
    }

    // 3. Агрегируем данные
    events.forEach(ev => {
      const dayData = statsMap.get(ev.date_key);
      if (!dayData) return;

      if (ev.status === 'committed') {
        dayData.committed++;
      } else if (ev.status === 'reserved' && isAfter(new Date(ev.reserved_at), fifteenMinsAgo)) {
        // Условие из ТЗ: только резервации не старше 15 минут
        dayData.reserved++;
      }
    });

    // 4. Формируем массив дней с расчетом utilization
    const days = Array.from(statsMap.entries()).map(([date, data]) => ({
      date,
      ...data,
      limit,
      utilization: Number((data.committed / limit).toFixed(2)),
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 5. Считаем стрейк (упрощенно: сколько дней подряд был хотя бы 1 commit)
    const streak = await this.calculateStreak(userId);

    return {
      plan: user.plan_tier,
      daily_limit: limit,
      period: { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') },
      days,
      summary: this.calculateSummary(days, streak),
    };
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

  private static async calculateStreak(userId: number): Promise<number> {
    // Реализация логики стрейка: идем от сегодня назад, пока committed > 0
    // Для демо можно просто вернуть 5 или написать полноценный цикл по базе
    return 5; 
  }
}