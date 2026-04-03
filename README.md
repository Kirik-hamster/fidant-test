## How to run
1. `cd backend && npm install`
2. Настроить `.env` (использовать `.env.example` как шаблон)
3. `npx prisma migrate dev` — создание таблиц
4. `npx prisma generate` — генерация типов клиента
5. `npx prisma db seed` — наполнение тестовыми данными
6. `npm run dev` — запуск сервера