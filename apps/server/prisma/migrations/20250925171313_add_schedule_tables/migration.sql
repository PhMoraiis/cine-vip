-- AlterTable
ALTER TABLE "public"."movie_session" ADD COLUMN     "audioType" TEXT,
ADD COLUMN     "roomNumber" TEXT;

-- CreateTable
CREATE TABLE "public"."schedule" (
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
CREATE TABLE "public"."schedule_item" (
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

-- CreateIndex
CREATE INDEX "schedule_userId_idx" ON "public"."schedule"("userId");

-- CreateIndex
CREATE INDEX "schedule_item_scheduleId_idx" ON "public"."schedule_item"("scheduleId");

-- AddForeignKey
ALTER TABLE "public"."schedule" ADD CONSTRAINT "schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_item" ADD CONSTRAINT "schedule_item_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."schedule"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_item" ADD CONSTRAINT "schedule_item_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "public"."movie"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedule_item" ADD CONSTRAINT "schedule_item_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."movie_session"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
