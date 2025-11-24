-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "user" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "session" (
    "_id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "account" (
    "_id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "verification" (
    "_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "cinema" (
    "_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "optgroupLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cinema_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "movie" (
    "_id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "genre" TEXT,
    "duration" TEXT,
    "rating" TEXT,
    "synopsis" TEXT,
    "posterUrl" TEXT,
    "cinemaId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movie_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "movie_session" (
    "_id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "sessionType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movie_session_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "available_date" (
    "_id" TEXT NOT NULL,
    "cinemaCode" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "displayText" TEXT NOT NULL,
    "dayOfWeek" TEXT,
    "dayNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "available_date_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "scraping_job" (
    "_id" TEXT NOT NULL,
    "cinemaCode" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "moviesFound" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scraping_job_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "schedule" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cinemaCode" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalDuration" INTEGER NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "schedule_item" (
    "_id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "travelTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_item_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "generated_schedule" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cinemaCode" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalDuration" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "feasible" BOOLEAN NOT NULL DEFAULT false,
    "conflicts" TEXT[],
    "flexibilityOptions" JSONB NOT NULL DEFAULT '{}',
    "items" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_schedule_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "cinema_code_key" ON "cinema"("code");

-- CreateIndex
CREATE UNIQUE INDEX "movie_externalId_cinemaId_date_key" ON "movie"("externalId", "cinemaId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "available_date_cinemaCode_value_key" ON "available_date"("cinemaCode", "value");

-- CreateIndex
CREATE UNIQUE INDEX "scraping_job_cinemaCode_date_key" ON "scraping_job"("cinemaCode", "date");

-- CreateIndex
CREATE INDEX "schedule_userId_idx" ON "schedule"("userId");

-- CreateIndex
CREATE INDEX "schedule_item_scheduleId_idx" ON "schedule_item"("scheduleId");

-- CreateIndex
CREATE INDEX "generated_schedule_userId_idx" ON "generated_schedule"("userId");

-- CreateIndex
CREATE INDEX "generated_schedule_cinemaCode_date_idx" ON "generated_schedule"("cinemaCode", "date");

-- CreateIndex
CREATE INDEX "generated_schedule_expiresAt_idx" ON "generated_schedule"("expiresAt");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie" ADD CONSTRAINT "movie_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "cinema"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_session" ADD CONSTRAINT "movie_session_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movie"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "available_date" ADD CONSTRAINT "available_date_cinemaCode_fkey" FOREIGN KEY ("cinemaCode") REFERENCES "cinema"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_item" ADD CONSTRAINT "schedule_item_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_item" ADD CONSTRAINT "schedule_item_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movie"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_item" ADD CONSTRAINT "schedule_item_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "movie_session"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_schedule" ADD CONSTRAINT "generated_schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
