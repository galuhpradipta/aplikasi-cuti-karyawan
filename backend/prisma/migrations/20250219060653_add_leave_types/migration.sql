/*
  Warnings:

  - Added the required column `leaveTypeId` to the `LeaveRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE `LeaveType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `maxDays` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LeaveType_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert default leave types
INSERT INTO `LeaveType` (`name`, `description`, `maxDays`, `updatedAt`) VALUES
('Cuti Tahunan', 'Cuti reguler tahunan untuk karyawan', 12, NOW()),
('Cuti Sakit', 'Cuti untuk pemulihan kesehatan karyawan', NULL, NOW()),
('Cuti Melahirkan', 'Cuti untuk karyawan yang akan melahirkan', 90, NOW()),
('Cuti Hari Raya', 'Cuti untuk merayakan hari raya keagamaan', 2, NOW()),
('Cuti Penting', 'Cuti untuk keperluan penting/darurat', NULL, NOW()),
('Cuti Bersama', 'Cuti bersama yang ditetapkan pemerintah', NULL, NOW());

-- AlterTable: Add leaveTypeId column with a default value pointing to Cuti Tahunan
ALTER TABLE `LeaveRequest` ADD COLUMN `leaveTypeId` INTEGER NULL;

-- Update existing leave requests to use Cuti Tahunan as default
UPDATE `LeaveRequest` SET `leaveTypeId` = (SELECT id FROM `LeaveType` WHERE name = 'Cuti Tahunan');

-- Make leaveTypeId required after setting default values
ALTER TABLE `LeaveRequest` MODIFY `leaveTypeId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_leaveTypeId_fkey` FOREIGN KEY (`leaveTypeId`) REFERENCES `LeaveType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
