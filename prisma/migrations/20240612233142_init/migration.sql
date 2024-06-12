/*
  Warnings:

  - Added the required column `userId` to the `AllDealsLenders` table without a default value. This is not possible if the table is not empty.
  - Made the column `interestGained` on table `AllDealsLenders` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AllDealsLenders" ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "interestGained" SET NOT NULL,
ALTER COLUMN "dateTime" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "AllDealsLenders" ADD CONSTRAINT "AllDealsLenders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
