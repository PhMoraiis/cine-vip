-- AddForeignKey
ALTER TABLE "generated_schedule" ADD CONSTRAINT "generated_schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
