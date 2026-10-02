/*
  Warnings:

  - A unique constraint covering the columns `[createdAt,id]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[createdAt,id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Product_createdAt_id_key" ON "Product"("createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "User_createdAt_id_key" ON "User"("createdAt", "id");
