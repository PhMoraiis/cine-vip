-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."cinema" (
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
CREATE TABLE "public"."movie" (
    "_id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "genre" TEXT,
    "duration" TEXT,
    "rating" TEXT,
    "synopsis" TEXT,
    "posterUrl" TEXT,
    "trailerUrl" TEXT,
    "cinemaId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movie_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."movie_session" (
    "_id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "sessionType" TEXT,
    "audioType" TEXT,
    "roomNumber" TEXT,
    "availableSeats" INTEGER,
    "occupancyPercent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movie_session_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."available_date" (
    "_id" TEXT NOT NULL,
    "cinemaCode" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "displayText" TEXT NOT NULL,
    "dayOfWeek" TEXT,
    "dayNumber" TEXT,
    "monthName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "available_date_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "public"."scraping_job" (
    "_id" TEXT NOT NULL,
    "cinemaCode" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "moviesFound" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scraping_job_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cinema_code_key" ON "public"."cinema"("code");

-- CreateIndex
CREATE UNIQUE INDEX "movie_externalId_cinemaId_date_key" ON "public"."movie"("externalId", "cinemaId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "available_date_cinemaCode_value_key" ON "public"."available_date"("cinemaCode", "value");

-- CreateIndex
CREATE UNIQUE INDEX "scraping_job_cinemaCode_date_key" ON "public"."scraping_job"("cinemaCode", "date");

-- AddForeignKey
ALTER TABLE "public"."movie" ADD CONSTRAINT "movie_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "public"."cinema"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movie_session" ADD CONSTRAINT "movie_session_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "public"."movie"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
