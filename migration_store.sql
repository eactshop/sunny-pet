-- ============================================================
-- SUNNY PET STORE - DATABASE MIGRATION
-- Run this once before starting the store website
-- Compatible with MySQL 8.0
-- ============================================================

-- Add passwordHash to Customer
SET @dbname = DATABASE();
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'Customer' AND COLUMN_NAME = 'passwordHash') = 0,
  'ALTER TABLE Customer ADD COLUMN passwordHash VARCHAR(255) NULL',
  'SELECT 1 -- passwordHash already exists'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add source to Customer
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'Customer' AND COLUMN_NAME = 'source') = 0,
  "ALTER TABLE Customer ADD COLUMN source VARCHAR(50) DEFAULT 'CRM'",
  'SELECT 1 -- source already exists'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add deliveryName to Order
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'deliveryName') = 0,
  'ALTER TABLE `Order` ADD COLUMN deliveryName VARCHAR(255) NULL',
  'SELECT 1 -- deliveryName already exists'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add deliveryPhone to Order
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'deliveryPhone') = 0,
  'ALTER TABLE `Order` ADD COLUMN deliveryPhone VARCHAR(50) NULL',
  'SELECT 1 -- deliveryPhone already exists'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add deliveryAddress to Order
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'deliveryAddress') = 0,
  'ALTER TABLE `Order` ADD COLUMN deliveryAddress TEXT NULL',
  'SELECT 1 -- deliveryAddress already exists'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add orderSource to Order
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'orderSource') = 0,
  "ALTER TABLE `Order` ADD COLUMN orderSource VARCHAR(50) DEFAULT 'CRM'",
  'SELECT 1 -- orderSource already exists'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add paymentMethod to Order
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'paymentMethod') = 0,
  "ALTER TABLE `Order` ADD COLUMN paymentMethod VARCHAR(50) DEFAULT 'CASH'",
  'SELECT 1 -- paymentMethod already exists'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add salePrice to Product
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'Product' AND COLUMN_NAME = 'salePrice') = 0,
  'ALTER TABLE Product ADD COLUMN salePrice DECIMAL(15,2) NULL',
  'SELECT 1 -- salePrice already exists'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add promotionId to Order
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'promotionId') = 0,
  'ALTER TABLE `Order` ADD COLUMN promotionId VARCHAR(64) NULL',
  'SELECT 1 -- promotionId already exists'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Create Promotion table if not exists
CREATE TABLE IF NOT EXISTS Promotion (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  type ENUM('PERCENT','FIXED') NOT NULL DEFAULT 'PERCENT',
  value DECIMAL(15,2) NOT NULL,
  minOrder DECIMAL(15,2) NULL,
  maxDiscount DECIMAL(15,2) NULL,
  maxUses INT NULL,
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

-- Update existing data defaults
UPDATE `Order` SET orderSource = 'CRM' WHERE orderSource IS NULL;
UPDATE Customer SET source = 'CRM' WHERE source IS NULL;

SELECT 'Migration completed successfully!' as result;
