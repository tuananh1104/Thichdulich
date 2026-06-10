ALTER TABLE payments
  MODIFY method ENUM('cod','bank_qr','vnpay','transfer','card') NOT NULL,
  MODIFY status ENUM('pending','paid','failed','success') NOT NULL DEFAULT 'pending';

ALTER TABLE payments ADD COLUMN transaction_code VARCHAR(200) NULL;
ALTER TABLE payments ADD COLUMN payment_url VARCHAR(1000) NULL;
ALTER TABLE payments ADD COLUMN qr_code TEXT NULL;

UPDATE payments
SET transaction_code = transaction_id
WHERE transaction_code IS NULL AND transaction_id IS NOT NULL;
