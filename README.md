# 📊 Fidant.AI Analytics

Тестовое задание: Аналитический дашборд с кэшированием (Node.js/Prisma/React).

## 🛠 Быстрый старт (How to run)

### 1. База данных (Docker)
В корне проекта:
```bash
docker-compose up -d
```

### 2. Бэкенд
```bash
cd backend
npm install
cp .env.example .env  # Проверьте DATABASE_URL и PORT в .env
npx prisma migrate dev && npx prisma db seed
npm run dev           # Сервер на http://localhost:3000
```

### 3. Фронтенд
```bash
cd ../frontend
npm install
echo "VITE_API_URL=http://localhost:3000" > .env
npm run dev           # Дашборд на http://localhost:5173
```

---

## ⚙️ Переменные окружения (.env)

### Backend (`/backend/.env`)
* `DATABASE_URL`: Строка подключения к PostgreSQL.
* `PORT`: Порт сервера (по умолчанию `3000`).

### Frontend (`/frontend/.env`)
* `VITE_API_URL`: URL вашего бэкенда (например, `http://localhost:3000`).

---

## 🏗 Ключевые решения
* **Cache-Aside:** Агрегированные данные за прошлые дни хранятся в `daily_usage_cache`. Данные за "сегодня" всегда считаются в real-time.
* **Фильтрация:** Реализован автоматический отсев резерваций (status: `reserved`) старше 15 минут.
* **UI:** Тёмная тема, адаптивный график (Recharts) и круговой прогресс-бар лимитов.

**Автор:** Кирилл Мякотин