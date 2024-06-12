-- CreateTable
CREATE TABLE "AllDealsLenders" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "interestGained" DOUBLE PRECISION,
    "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllDealsLenders_pkey" PRIMARY KEY ("id")
);
