-- CreateTable
CREATE TABLE "ComplexManager" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "complexId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplexManager_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComplexManager_userId_idx" ON "ComplexManager"("userId");

-- CreateIndex
CREATE INDEX "ComplexManager_complexId_idx" ON "ComplexManager"("complexId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplexManager_userId_complexId_key" ON "ComplexManager"("userId", "complexId");

-- AddForeignKey
ALTER TABLE "ComplexManager" ADD CONSTRAINT "ComplexManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplexManager" ADD CONSTRAINT "ComplexManager_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;
