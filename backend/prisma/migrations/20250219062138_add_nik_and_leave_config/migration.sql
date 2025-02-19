/*
  Warnings:

  - A unique constraint covering the columns `[nik]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nik` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `nik` VARCHAR(191) NULL;

-- Update existing users with temporary NIK values
UPDATE `User` SET `nik` = CONCAT('TEMP', LPAD(id, 6, '0')) WHERE `nik` IS NULL;

-- Make nik column NOT NULL
ALTER TABLE `User` MODIFY `nik` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `LeaveConfiguration` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `year` INTEGER NOT NULL,
    `maxLeaveDaysPerYear` INTEGER NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LeaveConfiguration_year_key`(`year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_nik_key` ON `User`(`nik`);

-- Insert default leave configuration for current year
INSERT INTO `LeaveConfiguration` (`year`, `maxLeaveDaysPerYear`, `description`, `createdAt`, `updatedAt`)
VALUES (YEAR(CURRENT_DATE()), 12, 'Default annual leave configuration', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
