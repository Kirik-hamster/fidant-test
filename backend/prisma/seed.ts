import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Запуск сида через Adapter...');
  
  const user = await prisma.users.upsert({
    where: { email: 'kirill@example.com' },
    update: {},
    create: {
      email: 'kirill@example.com',
      name: 'Kirill Myakotin',
      plan_tier: 'starter',
    },
  });

  const today = new Date().toISOString().split('T')[0];
  await prisma.daily_usage_events.deleteMany({ where: { user_id: user.id } });
  await prisma.daily_usage_events.createMany({
    data: [
      { user_id: user.id, date_key: today, request_id: 'req_1', status: 'committed' },
      { user_id: user.id, date_key: today, request_id: 'req_2', status: 'committed' },
    ]
  });
  console.log('✅ Данные в базе!');
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