ALTER TABLE tours
  ADD COLUMN original_price BIGINT NULL AFTER child_price,
  ADD COLUMN promotion_title VARCHAR(200) NULL AFTER original_price,
  ADD COLUMN promotion_badge VARCHAR(80) NULL AFTER promotion_title,
  ADD COLUMN discount_percent TINYINT NULL AFTER promotion_badge,
  ADD COLUMN promotion_active BOOLEAN NOT NULL DEFAULT FALSE AFTER discount_percent,
  ADD COLUMN promotion_status VARCHAR(20) NOT NULL DEFAULT 'none' AFTER promotion_active,
  ADD COLUMN promotion_source VARCHAR(20) NOT NULL DEFAULT 'none' AFTER promotion_status;

UPDATE tours
SET
  original_price = price,
  price = ROUND(price * 0.72),
  child_price = CASE WHEN child_price IS NULL THEN NULL ELSE ROUND(child_price * 0.72) END,
  promotion_title = 'Siêu ưu đãi hè',
  promotion_badge = 'SALE 28%',
  discount_percent = 28,
  promotion_active = TRUE,
  promotion_status = 'approved',
  promotion_source = 'admin'
WHERE id IN ('tour-da-nang-ba-na-3d', 'tour-sapa-fansipan-3d', 'tour-phu-quoc-snorkeling-3d');
