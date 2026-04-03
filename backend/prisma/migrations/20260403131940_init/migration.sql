-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "plan_tier" VARCHAR(16) NOT NULL DEFAULT 'starter',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_usage_events" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date_key" VARCHAR(10) NOT NULL,
    "request_id" VARCHAR(64) NOT NULL,
    "status" VARCHAR(16) NOT NULL,
    "reserved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_usage_cache" (
    "user_id" INTEGER NOT NULL,
    "date_key" VARCHAR(10) NOT NULL,
    "committed_count" INTEGER NOT NULL DEFAULT 0,
    "reserved_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_usage_cache_pkey" PRIMARY KEY ("user_id","date_key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "daily_usage_events_user_id_date_key_idx" ON "daily_usage_events"("user_id", "date_key");
