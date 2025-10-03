-- AddForeignKey
ALTER TABLE "public"."available_date" ADD CONSTRAINT "available_date_cinemaCode_fkey" FOREIGN KEY ("cinemaCode") REFERENCES "public"."cinema"("code") ON DELETE CASCADE ON UPDATE CASCADE;
