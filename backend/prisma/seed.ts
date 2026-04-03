import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { subDays, format } from 'date-fns';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Очистка старых данных...');
  await prisma.daily_usage_cache.deleteMany({});
  await prisma.daily_usage_events.deleteMany({});

  const user = await prisma.users.upsert({
    where: { email: 'kirill@example.com' },
    update: {},
    create: {
      email: 'kirill@example.com',
      name: 'Kirill Myakotin',
      plan_tier: 'starter',
    },
  });

  console.log(`👤 Юзер: ${user.name} (ID: ${user.id})`);
  const eventsData = [];

  for (let i = 0; i < 30; i++) {
    const date = subDays(new Date(), i);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    // Генерируем случайное кол-во событий для красивого графика
    const committedCount = Math.floor(Math.random() * 20) + 5;
    
    for (let j = 0; j < committedCount; j++) {
      eventsData.push({
        user_id: user.id,
        date_key: dateKey,
        request_id: `req_${i}_${j}`,
        status: 'committed',
        created_at: date,
      });
    }

    // Для "сегодня" добавим резервации для проверки логики 15 минут
    if (i === 0) {
      // Свежая (5 мин назад) — попадет в счетчик reserved
      eventsData.push({
        user_id: user.id,
        date_key: dateKey,
        request_id: 'res_fresh',
        status: 'reserved',
        reserved_at: new Date(Date.now() - 5 * 60000),
        created_at: new Date(Date.now() - 5 * 60000)
      });

      // Старая (20 мин назад) — НЕ попадет в счетчик reserved
      eventsData.push({
        user_id: user.id,
        date_key: dateKey,
        request_id: 'res_stale',
        status: 'reserved',
        reserved_at: new Date(Date.now() - 20 * 60000),
        created_at: new Date(Date.now() - 20 * 60000)
      });
    }
  }

  console.log(`🚀 Заливаем ${eventsData.length} событий...`);
  await prisma.daily_usage_events.createMany({ data: eventsData });
  console.log('✅ База наполнена!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });