/*
  Warnings:

  - A unique constraint covering the columns `[createdAt,id]` on the table `SavedProduct` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SavedProduct_createdAt_id_key" ON "SavedProduct"("createdAt", "id");
