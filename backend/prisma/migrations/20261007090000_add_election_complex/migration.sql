ALTER TABLE "Election"
ADD COLUMN "complexId" TEXT;

CREATE INDEX "Election_complexId_idx"
ON "Election"("complexId");

ALTER TABLE "Election"
ADD CONSTRAINT "Election_complexId_fkey"
FOREIGN KEY ("complexId")
REFERENCES "Complex"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
