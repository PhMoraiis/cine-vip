/*
  Warnings:

  - You are about to drop the column `monthName` on the `available_date` table. All the data in the column will be lost.
  - You are about to drop the column `trailerUrl` on the `movie` table. All the data in the column will be lost.
  - You are about to drop the column `audioType` on the `movie_session` table. All the data in the column will be lost.
  - You are about to drop the column `availableSeats` on the `movie_session` table. All the data in the column will be lost.
  - You are about to drop the column `occupancyPercent` on the `movie_session` table. All the data in the column will be lost.
  - You are about to drop the column `roomNumber` on the `movie_session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."available_date" DROP COLUMN "monthName";

-- AlterTable
ALTER TABLE "public"."movie" DROP COLUMN "trailerUrl";

-- AlterTable
ALTER TABLE "public"."movie_session" DROP COLUMN "audioType",
DROP COLUMN "availableSeats",
DROP COLUMN "occupancyPercent",
DROP COLUMN "roomNumber";
