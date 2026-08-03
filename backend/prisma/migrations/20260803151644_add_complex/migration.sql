-- AlterTable
ALTER TABLE "Building" ADD COLUMN     "complexId" INTEGER;

-- CreateTable
CREATE TABLE "Complex" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Complex_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "Complex"("id") ON DELETE SET NULL ON UPDATE CASCADE;
