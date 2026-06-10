-- ============================================================
--  THICHDULICH — HỆ THỐNG ĐẶT TOUR DU LỊCH
--  MySQL 8.0+ | UTF8MB4
--  Chạy: mysql -u root -p < database/thichdulich.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS thichdulich
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE thichdulich;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS tour_blocked_dates;
DROP TABLE IF EXISTS tour_includes;
DROP TABLE IF EXISTS tour_images;
DROP TABLE IF EXISTS tour_itineraries;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS user_interactions;
DROP TABLE IF EXISTS email_verification_codes;
DROP TABLE IF EXISTS tour_messages;
DROP TABLE IF EXISTS tour_reports;
DROP TABLE IF EXISTS tour_reviews;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS departure_schedules;
DROP TABLE IF EXISTS tours;
DROP TABLE IF EXISTS destinations;
DROP TABLE IF EXISTS providers;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE users (
  id            VARCHAR(36)   NOT NULL,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL,
  password_hash VARCHAR(255)  NULL,
  role          ENUM('user','provider','admin') NOT NULL DEFAULT 'user',
  avatar_url    LONGTEXT      NULL,
  provider      ENUM('LOCAL','GOOGLE') NOT NULL DEFAULT 'LOCAL',
  enabled       BOOLEAN       NOT NULL DEFAULT FALSE,
  phone         VARCHAR(15)   NULL,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  is_banned     BOOLEAN       NOT NULL DEFAULT FALSE,
  last_login    DATETIME      NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_role_active (role, is_active, is_banned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- providers
-- ------------------------------------------------------------
CREATE TABLE providers (
  id              VARCHAR(36)  NOT NULL,
  user_id         VARCHAR(36)  NOT NULL,
  company_name    VARCHAR(200) NOT NULL,
  tax_code        VARCHAR(20)  NULL,
  phone           VARCHAR(15)  NULL,
  address         TEXT         NULL,
  license_number  VARCHAR(100) NULL,
  description     TEXT         NULL,
  logo            VARCHAR(500) NULL,
  status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  is_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
  joined_date     DATE         NOT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_providers_user (user_id),
  INDEX idx_providers_status_verified (status, is_verified),
  CONSTRAINT fk_providers_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- destinations
-- ------------------------------------------------------------
CREATE TABLE destinations (
  id              VARCHAR(36)  NOT NULL,
  name_vi         VARCHAR(200) NOT NULL,
  description_vi  TEXT         NULL,
  image           VARCHAR(500) NULL,
  region          ENUM('Bắc','Trung','Nam','Quốc tế') NOT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_destinations_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- tour_categories
-- ------------------------------------------------------------
CREATE TABLE tour_categories (
  code        VARCHAR(30)  NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT         NULL,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (code),
  INDEX idx_tour_categories_active (active),
  INDEX idx_tour_categories_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tour_categories (code, name, description, active, sort_order) VALUES
('beach', 'Biển đảo', 'Tour nghỉ dưỡng biển, đảo, vịnh và các hoạt động dưới nước.', TRUE, 10),
('nature', 'Thiên nhiên', 'Tour sinh thái, cảnh quan tự nhiên, nghỉ dưỡng xanh.', TRUE, 20),
('mountain', 'Núi', 'Tour vùng cao, săn mây, trekking nhẹ và cảnh quan núi.', TRUE, 30),
('cultural', 'Văn hóa', 'Tour di sản, lịch sử, làng nghề và trải nghiệm bản địa.', TRUE, 40),
('adventure', 'Mạo hiểm', 'Tour vận động, khám phá, trekking và hoạt động trải nghiệm mạnh.', TRUE, 50),
('food', 'Ẩm thực', 'Tour khám phá món ăn địa phương và trải nghiệm ẩm thực.', TRUE, 60),
('city', 'Thành phố', 'Tour city tour, check-in, mua sắm và đời sống đô thị.', TRUE, 70);

-- ------------------------------------------------------------
-- tours
-- ------------------------------------------------------------
CREATE TABLE tours (
  id                VARCHAR(36)    NOT NULL,
  provider_id       VARCHAR(36)    NOT NULL,
  destination_id    VARCHAR(36)    NULL,
  name_vi           VARCHAR(300)   NOT NULL,
  description_vi    TEXT           NULL,
  location          VARCHAR(200)   NOT NULL,
  type              ENUM('adventure','beach','cultural','food','nature','mountain','city') NOT NULL,
  duration          TINYINT        NOT NULL,
  max_people_per_day INT           NOT NULL DEFAULT 20,
  advance_booking_days INT         NOT NULL DEFAULT 3,
  price             BIGINT         NOT NULL,
  child_price       BIGINT         NULL,
  original_price    BIGINT         NULL,
  promotion_title   VARCHAR(200)   NULL,
  promotion_badge   VARCHAR(80)    NULL,
  discount_percent  TINYINT        NULL,
  promotion_active  BOOLEAN        NOT NULL DEFAULT FALSE,
  promotion_status  VARCHAR(20)    NOT NULL DEFAULT 'none',
  promotion_source  VARCHAR(20)    NOT NULL DEFAULT 'none',
  excluded_services TEXT           NULL,
  included_services TEXT           NULL,
  itinerary_json    LONGTEXT       NULL,
  images_json       LONGTEXT       NULL,
  image             VARCHAR(500)   NULL,
  rating            DECIMAL(2,1)   NOT NULL DEFAULT 0.0,
  review_count      INT            NOT NULL DEFAULT 0,
  availability      BOOLEAN        NOT NULL DEFAULT TRUE,
  status            ENUM('pending','approved','rejected','need_edit','updated') NOT NULL DEFAULT 'pending',
  rejection_reason  TEXT           NULL,
  admin_notes       TEXT           NULL,
  submitted_at      DATETIME       NULL,
  reviewed_at       DATETIME       NULL,
  reviewed_by       VARCHAR(36)    NULL,
  created_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_tours_provider (provider_id),
  INDEX idx_tours_destination (destination_id),
  INDEX idx_tours_status (status),
  INDEX idx_tours_type (type),
  INDEX idx_tours_status_availability_rating (status, availability, rating),
  INDEX idx_tours_provider_status_updated (provider_id, status, updated_at),
  INDEX idx_tours_status_type_price (status, type, price),
  INDEX idx_tours_destination_status (destination_id, status),
  CONSTRAINT fk_tours_provider
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  CONSTRAINT fk_tours_destination
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL,
  CONSTRAINT fk_tours_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- departure_schedules
-- ------------------------------------------------------------
CREATE TABLE departure_schedules (
  id              VARCHAR(36) NOT NULL,
  tour_id         VARCHAR(36) NOT NULL,
  departure_date  DATE        NOT NULL,
  total_slots     SMALLINT    NOT NULL DEFAULT 20,
  booked_slots    SMALLINT    NOT NULL DEFAULT 0,
  status          ENUM('open','closed','full') NOT NULL DEFAULT 'open',

  PRIMARY KEY (id),
  UNIQUE KEY uq_schedule_tour_date (tour_id, departure_date),
  INDEX idx_schedules_tour (tour_id),
  INDEX idx_schedules_date (departure_date),
  INDEX idx_schedules_status_date (status, departure_date),
  CONSTRAINT fk_schedules_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
  CONSTRAINT chk_slots CHECK (booked_slots >= 0 AND booked_slots <= total_slots)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- bookings
-- ------------------------------------------------------------
CREATE TABLE bookings (
  id                      VARCHAR(36)  NOT NULL,
  tour_id                 VARCHAR(36)  NOT NULL,
  user_id                 VARCHAR(36)  NOT NULL,
  departure_schedule_id   VARCHAR(36)  NULL,
  start_date              DATE         NULL,
  adults                  TINYINT      NOT NULL DEFAULT 1,
  children                TINYINT      NOT NULL DEFAULT 0,
  total_amount            BIGINT       NOT NULL,
  deposit_amount          BIGINT       NOT NULL DEFAULT 0,
  remaining_amount        BIGINT       NOT NULL DEFAULT 0,
  commission_rate         INT          NOT NULL DEFAULT 10,
  commission_amount       BIGINT       NOT NULL DEFAULT 0,
  provider_payout_amount  BIGINT       NOT NULL DEFAULT 0,
  cancelled_by            VARCHAR(20)  NULL,
  cancelled_at            DATETIME     NULL,
  cancel_reason           TEXT         NULL,
  refund_status           ENUM('none','refund_pending','refunded','no_refund','refund_rejected') NOT NULL DEFAULT 'none',
  refund_amount           BIGINT       NOT NULL DEFAULT 0,
  refund_bank_name        VARCHAR(100) NULL,
  refund_account_number   VARCHAR(50)  NULL,
  refund_account_name     VARCHAR(100) NULL,
  refund_requested_at     DATETIME     NULL,
  refund_processed_at     DATETIME     NULL,
  refund_processed_by     VARCHAR(36)  NULL,
  refund_reject_reason    TEXT         NULL,
  payout_status           ENUM('none','payout_pending','paid_out') NOT NULL DEFAULT 'none',
  payout_amount           BIGINT       NOT NULL DEFAULT 0,
  payout_processed_at     DATETIME     NULL,
  payout_processed_by     VARCHAR(36)  NULL,
  payment_method          VARCHAR(30)  NULL,
  payment_status          VARCHAR(30)  NULL,
  payment_amount          BIGINT       NULL,
  payment_transaction_code VARCHAR(200) NULL,
  payment_url             VARCHAR(1000) NULL,
  payment_qr_code         TEXT         NULL,
  paid_at                 DATETIME     NULL,
  status                  ENUM('pending','deposited','paid','confirmed','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  contact_name            VARCHAR(100) NOT NULL,
  contact_email           VARCHAR(150) NOT NULL,
  contact_phone           VARCHAR(15)  NOT NULL,
  special_requests        TEXT         NULL,
  created_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at             DATETIME     NULL,

  PRIMARY KEY (id),
  INDEX idx_bookings_tour (tour_id),
  INDEX idx_bookings_user (user_id),
  INDEX idx_bookings_schedule (departure_schedule_id),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_created (created_at),
  INDEX idx_bookings_user_created (user_id, created_at),
  INDEX idx_bookings_tour_start_status (tour_id, start_date, status),
  INDEX idx_bookings_status_created (status, created_at),
  INDEX idx_bookings_status_start (status, start_date),
  INDEX idx_bookings_refund_status_created (refund_status, created_at),
  INDEX idx_bookings_payout_status_created (payout_status, created_at),
  INDEX idx_bookings_payment_status_created (payment_status, created_at),
  INDEX idx_bookings_payment_transaction (payment_transaction_code),
  CONSTRAINT fk_bookings_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_schedule
    FOREIGN KEY (departure_schedule_id) REFERENCES departure_schedules(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- tour_reviews
-- ------------------------------------------------------------
CREATE TABLE tour_reviews (
  id                VARCHAR(36)  NOT NULL,
  tour_id           VARCHAR(36)  NOT NULL,
  user_id           VARCHAR(36)  NOT NULL,
  booking_id        VARCHAR(36)  NOT NULL,
  rating            TINYINT      NOT NULL,
  comment           TEXT         NOT NULL,
  images            LONGTEXT     NULL,
  helpful_count     INT          NOT NULL DEFAULT 0,
  response_from     VARCHAR(100) NULL,
  response_message  TEXT         NULL,
  response_at       DATETIME     NULL,
  response_requested BOOLEAN      NOT NULL DEFAULT FALSE,
  response_requested_at DATETIME  NULL,
  response_requested_by VARCHAR(36) NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_booking (booking_id),
  INDEX idx_reviews_tour (tour_id),
  INDEX idx_reviews_user (user_id),
  INDEX idx_reviews_tour_created (tour_id, created_at),
  INDEX idx_reviews_user_created (user_id, created_at),
  INDEX idx_reviews_response_requested (response_requested, created_at),
  CONSTRAINT fk_reviews_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_response_requested_by
    FOREIGN KEY (response_requested_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- tour_reports
-- ------------------------------------------------------------
CREATE TABLE tour_reports (
  id           VARCHAR(36)  NOT NULL,
  tour_id      VARCHAR(36)  NOT NULL,
  reported_by  VARCHAR(36)  NOT NULL,
  booking_id   VARCHAR(36)  NULL,
  reason       VARCHAR(200) NOT NULL,
  description  TEXT         NOT NULL,
  images       LONGTEXT     NULL,
  status       ENUM('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  admin_note   TEXT         NULL,
  reviewed_by  VARCHAR(36)  NULL,
  reviewed_at  DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_reports_booking (booking_id),
  INDEX idx_reports_tour (tour_id),
  INDEX idx_reports_status (status),
  INDEX idx_reports_status_created (status, created_at),
  INDEX idx_reports_tour_status (tour_id, status),
  INDEX idx_reports_reporter_created (reported_by, created_at),
  CONSTRAINT fk_reports_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_reporter
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- tour_messages
-- ------------------------------------------------------------
CREATE TABLE tour_messages (
  id           VARCHAR(36)  NOT NULL,
  tour_id      VARCHAR(36)  NOT NULL,
  sender_id    VARCHAR(36)  NOT NULL,
  sender_role  ENUM('admin','provider') NOT NULL,
  sender_name  VARCHAR(100) NOT NULL,
  message      TEXT         NOT NULL,
  sent_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_messages_tour (tour_id),
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_tour_sent (tour_id, sent_at),
  CONSTRAINT fk_messages_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- contact_messages
-- ------------------------------------------------------------
CREATE TABLE contact_messages (
  id             VARCHAR(36)  NOT NULL,
  user_id        VARCHAR(36)  NULL,
  name           VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL,
  phone          VARCHAR(15)  NULL,
  subject        VARCHAR(300) NOT NULL,
  message        TEXT         NOT NULL,
  status         ENUM('new','replied','resolved') NOT NULL DEFAULT 'new',
  replied_by     VARCHAR(36)  NULL,
  replied_at     DATETIME     NULL,
  reply_message  TEXT         NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_contacts_status (status),
  INDEX idx_contacts_status_created (status, created_at),
  INDEX idx_contacts_created (created_at),
  CONSTRAINT fk_contacts_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_contacts_replier
    FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- favorites
-- ------------------------------------------------------------
CREATE TABLE favorites (
  id          INT         NOT NULL AUTO_INCREMENT,
  user_id     VARCHAR(36) NOT NULL,
  tour_id     VARCHAR(36) NOT NULL,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_favorites (user_id, tour_id),
  INDEX idx_favorites_tour (tour_id),
  CONSTRAINT fk_favorites_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- user_interactions
-- ------------------------------------------------------------
CREATE TABLE user_interactions (
  id            VARCHAR(36) NOT NULL,
  user_id       VARCHAR(36) NOT NULL,
  tour_id       VARCHAR(36) NULL,
  action        ENUM('view','search','click','bookmark') NOT NULL,
  search_query  VARCHAR(255) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_interactions_user_created (user_id, created_at),
  INDEX idx_interactions_user_action_created (user_id, action, created_at),
  INDEX idx_interactions_tour_created (tour_id, created_at),
  CONSTRAINT fk_interactions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_interactions_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- email_verification_codes
-- ------------------------------------------------------------
CREATE TABLE email_verification_codes (
  id          VARCHAR(36)  NOT NULL,
  email       VARCHAR(150) NOT NULL,
  code_hash   VARCHAR(255) NOT NULL,
  purpose     VARCHAR(30)  NOT NULL DEFAULT 'EMAIL_VERIFICATION',
  expires_at  DATETIME     NOT NULL,
  used        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_email_verification_email_created (email, created_at),
  INDEX idx_email_verification_lookup (email, purpose, used, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  DỮ LIỆU MẪU (demo)
-- ============================================================

INSERT INTO users (id, name, email, password_hash, role, provider, enabled, phone, is_active, is_banned) VALUES
('admin-0001-0000-0000-000000000001', 'Admin Thích Du Lịch', 'admin@demo.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', 'LOCAL', TRUE, '0900000000', TRUE, FALSE),
('user-0001-0000-0000-000000000001', 'Nguyễn Văn A', 'user@demo.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user', 'LOCAL', TRUE, '0901234567', TRUE, FALSE),
('prov-user-001-0000-000000000001', 'Công ty Bắc Việt Travel', 'provider@demo.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'provider', 'LOCAL', TRUE, '02438257000', TRUE, FALSE);
-- Mật khẩu demo (bcrypt): demo123 | admin123 — cập nhật qua DataInitializer nếu cần

INSERT INTO providers (id, user_id, company_name, tax_code, phone, license_number, status, is_verified, joined_date) VALUES
('prov-0001-0000-0000-000000000001', 'prov-user-001-0000-000000000001',
 'Công ty Du lịch Bắc Việt', '0123456789', '02438257000', '01-001/LHNĐ-TCDL', 'approved', TRUE, '2024-01-10');

INSERT INTO destinations (id, name_vi, description_vi, image, region) VALUES
('dest-ha-long', 'Vịnh Hạ Long',
 'Di sản thiên nhiên thế giới',
 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800', 'Bắc'),
('dest-hoi-an', 'Phố cổ Hội An',
 'Phố cổ với đèn lồng',
 'https://images.unsplash.com/photo-1562005094-c724030f99bd?w=800', 'Trung'),
('dest-da-lat', 'Đà Lạt',
 'Thành phố ngàn hoa',
 'https://images.unsplash.com/photo-1651637181617-7a0e50c9176e?w=800', 'Nam');

INSERT INTO tours (id, provider_id, destination_id, name_vi, description_vi,
  location, type, duration, price, child_price, image, rating, review_count, availability, status,
  submitted_at, reviewed_at, reviewed_by) VALUES
('tour-ha-long-3d', 'prov-0001-0000-0000-000000000001', 'dest-ha-long',
 'Tour Vịnh Hạ Long 3 Ngày 2 Đêm',
 'Khám phá vịnh Hạ Long trên du thuyền',
 'Quảng Ninh', 'nature', 3, 5999000, 4499000,
 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
 4.8, 150, TRUE, 'approved', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 8 DAY, 'admin-0001-0000-0000-000000000001'),
('tour-ha-long-test-10k', 'prov-0001-0000-0000-000000000001', 'dest-ha-long',
 'Tour test Vịnh Hạ Long 10K',
 'Tour test giá thấp để kiểm tra đặt tour và thanh toán QR',
 'Quảng Ninh', 'nature', 1, 10000, 7000,
 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
 5.0, 1, TRUE, 'approved', NOW() - INTERVAL 1 DAY, NOW(), 'admin-0001-0000-0000-000000000001'),
('tour-hoi-an-2d', 'prov-0001-0000-0000-000000000001', 'dest-hoi-an',
 'Tour Hội An — Đà Nẵng 2 Ngày',
 'Khám phá phố cổ và biển',
 'Quảng Nam', 'cultural', 2, 3799000, 2899000,
 'https://images.unsplash.com/photo-1562005094-c724030f99bd?w=800',
 4.6, 95, TRUE, 'approved', NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 13 DAY, 'admin-0001-0000-0000-000000000001'),
('tour-da-lat-2d', 'prov-0001-0000-0000-000000000001', 'dest-da-lat',
 'Tour Đà Lạt Phiêu Lưu 2 Ngày',
 'Canyoning, thác Datanla, đồi chè',
 'Lâm Đồng', 'adventure', 2, 3199000, 2399000,
 'https://images.unsplash.com/photo-1651637181617-7a0e50c9176e?w=800',
 4.5, 78, TRUE, 'approved', NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 18 DAY, 'admin-0001-0000-0000-000000000001');

INSERT INTO departure_schedules (id, tour_id, departure_date, total_slots, booked_slots, status) VALUES
('sched-hl-1', 'tour-ha-long-3d', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 20, 3, 'open'),
('sched-hl-2', 'tour-ha-long-3d', DATE_ADD(CURDATE(), INTERVAL 28 DAY), 20, 0, 'open'),
('sched-hl-test-10k', 'tour-ha-long-test-10k', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 50, 0, 'open'),
('sched-ha-1', 'tour-hoi-an-2d', DATE_ADD(CURDATE(), INTERVAL 10 DAY), 25, 5, 'open'),
('sched-dl-1', 'tour-da-lat-2d', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 15, 15, 'full');

