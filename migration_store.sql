-- ============================================================
-- SUNNY PET STORE - DATABASE MIGRATION
-- Run this once before starting the store website
-- ============================================================

-- Add customer authentication fields
ALTER TABLE Customer
  ADD COLUMN IF NOT EXISTS passwordHash VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'CRM';

-- Add delivery fields to Order table
ALTER TABLE `Order`
  ADD COLUMN IF NOT EXISTS deliveryName VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS deliveryPhone VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS deliveryAddress TEXT NULL,
  ADD COLUMN IF NOT EXISTS orderSource VARCHAR(50) DEFAULT 'CRM',
  ADD COLUMN IF NOT EXISTS paymentMethod VARCHAR(50) DEFAULT 'CASH';

-- Update existing orders source
UPDATE `Order` SET orderSource = 'CRM' WHERE orderSource IS NULL;
UPDATE Customer SET source = 'CRM' WHERE source IS NULL;
