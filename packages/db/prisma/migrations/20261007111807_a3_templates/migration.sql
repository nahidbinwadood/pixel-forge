-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "searchVector" tsvector;

-- CreateIndex
CREATE INDEX "Template_searchVector_idx" ON "Template" USING GIN ("searchVector");
