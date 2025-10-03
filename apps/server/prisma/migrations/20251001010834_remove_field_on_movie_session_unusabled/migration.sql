/*
  Warnings:

  - You are about to drop the column `audioType` on the `movie_session` table. All the data in the column will be lost.
  - You are about to drop the column `roomNumber` on the `movie_session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "movie_session" DROP COLUMN "audioType",
DROP COLUMN "roomNumber";
