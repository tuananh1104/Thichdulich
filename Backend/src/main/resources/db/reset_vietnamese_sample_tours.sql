-- Reset toÃ n bá»™ dá»¯ liá»‡u tour máº«u vÃ  náº¡p láº¡i bá»™ tour tiáº¿ng Viá»‡t chuáº©n.
-- Chạy sau khi database/schema đã được tạo.

USE thichdulich;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM favorites;
SET @has_user_interactions = (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_interactions'
);
SET @delete_user_interactions = IF(@has_user_interactions > 0, 'DELETE FROM user_interactions', 'SELECT 1');
PREPARE delete_user_interactions_stmt FROM @delete_user_interactions;
EXECUTE delete_user_interactions_stmt;
DEALLOCATE PREPARE delete_user_interactions_stmt;
DELETE FROM tour_messages;
DELETE FROM tour_reports;
DELETE FROM tour_reviews;
DELETE FROM payments;
DELETE FROM bookings;
DELETE FROM departure_schedules;
DELETE FROM tour_includes;
DELETE FROM tour_images;
DELETE FROM tour_itineraries;
DELETE FROM tours;
DELETE FROM destinations;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users (id, name, email, password_hash, role, phone, is_active, is_banned)
VALUES
('admin-0001-0000-0000-000000000001', 'Admin Thích Du Lịch', 'admin@demo.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', '0900000000', TRUE, FALSE),
('prov-user-001-0000-000000000001', 'Công ty Du lịch Bắc Việt', 'provider@demo.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'provider', '02438257000', TRUE, FALSE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  phone = VALUES(phone),
  is_active = TRUE,
  is_banned = FALSE;

INSERT INTO providers (id, user_id, company_name, tax_code, phone, address, license_number, description, status, is_verified, joined_date)
VALUES
('prov-0001-0000-0000-000000000001', 'prov-user-001-0000-000000000001',
 'Công ty Du lịch Bắc Việt', '0123456789', '02438257000',
 '25 Tràng Thi, Hoàn Kiếm, Hà Nội', '01-001/LHNĐ-TCDL',
 'Đơn vị tổ chức tour nội địa với lịch trình rõ ràng, dịch vụ trọn gói và hỗ trợ khách hàng trong suốt chuyến đi.',
 'approved', TRUE, '2024-01-10')
ON DUPLICATE KEY UPDATE
  company_name = VALUES(company_name),
  address = VALUES(address),
  description = VALUES(description),
  status = 'approved',
  is_verified = TRUE;

INSERT INTO destinations (id, name_vi, description_vi, image, region) VALUES
('dest-ha-long', 'Vịnh Hạ Long', 'Di sản thiên nhiên thế giới với đảo đá vôi, hang động và du thuyền nghỉ đêm.', 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&h=700&fit=crop', 'Bắc'),
('dest-hoi-an', 'Phố cổ Hội An', 'Phố cổ ven sông với đèn lồng, nhà cổ, làng nghề và ẩm thực miền Trung.', 'https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop', 'Trung'),
('dest-da-nang', 'Đà Nẵng', 'Thành phố biển với Bà Nà Hills, Cầu Vàng, bán đảo Sơn Trà và biển Mỹ Khê.', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000&h=700&fit=crop', 'Trung'),
('dest-da-lat', 'Đà Lạt', 'Thành phố ngàn hoa với hồ, thác, đồi thông, nông trại và khí hậu mát mẻ.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&h=700&fit=crop', 'Trung'),
('dest-sapa', 'Sapa', 'Thị trấn vùng cao với Fansipan, ruộng bậc thang và bản làng dân tộc.', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&h=700&fit=crop', 'Bắc'),
('dest-phu-quoc', 'Phú Quốc', 'Đảo ngọc với bãi biển trong xanh, tour đảo, lặn ngắm san hô và hải sản.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&h=700&fit=crop', 'Nam'),
('dest-nha-trang', 'Nha Trang', 'Thành phố biển với vịnh đẹp, đảo, cáp treo biển, tắm bùn khoáng và hải sản.', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&h=700&fit=crop', 'Trung'),
('dest-mekong', 'Miền Tây sông nước', 'Chợ nổi, miệt vườn, thuyền sông và đời sống sông nước Nam Bộ.', 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000&h=700&fit=crop', 'Nam');

INSERT INTO tours (id, provider_id, destination_id, name_vi, description_vi, location, type, duration, price, child_price, image, rating, review_count, availability, status, submitted_at, reviewed_at, reviewed_by) VALUES
('tour-ha-long-3d', 'prov-0001-0000-0000-000000000001', 'dest-ha-long',
 'Tour Vịnh Hạ Long 3 ngày 2 đêm',
 'Du thuyền trên Vịnh Hạ Long, tham quan hang Sửng Sốt, đảo Titop, chèo kayak và ngắm hoàng hôn trên vịnh. Lịch trình phù hợp cho gia đình, nhóm bạn và khách muốn nghỉ dưỡng nhẹ nhàng.',
 'Quảng Ninh', 'nature', 3, 5999000, 4499000, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&h=700&fit=crop', 4.8, 150, TRUE, 'approved', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 8 DAY, 'admin-0001-0000-0000-000000000001'),
('tour-yen-tu-ha-long-3d', 'prov-0001-0000-0000-000000000001', 'dest-ha-long',
 'Yên Tử - Hạ Long 3 ngày',
 'Kết hợp hành hương Yên Tử, khám phá phố cổ Hạ Long và trải nghiệm vịnh bằng du thuyền. Tour cân bằng giữa văn hóa, cảnh quan và thời gian nghỉ ngơi.',
 'Quảng Ninh', 'cultural', 3, 4899000, 3699000, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&h=700&fit=crop', 4.5, 88, TRUE, 'approved', NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 7 DAY, 'admin-0001-0000-0000-000000000001'),
('tour-hoi-an-2d', 'prov-0001-0000-0000-000000000001', 'dest-hoi-an',
 'Tour Hội An - Đà Nẵng 2 ngày',
 'Dạo phố cổ Hội An, tham quan làng gốm Thanh Hà, tắm biển An Bàng và thưởng thức ẩm thực địa phương. Lịch trình ngắn gọn, dễ đi, nhiều thời gian chụp ảnh.',
 'Quảng Nam', 'cultural', 2, 3799000, 2899000, 'https://images.unsplash.com/photo-1562005094-c724030f99bd?w=1000&h=700&fit=crop', 4.7, 96, TRUE, 'approved', NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 13 DAY, 'admin-0001-0000-0000-000000000001'),
('tour-da-nang-ba-na-3d', 'prov-0001-0000-0000-000000000001', 'dest-da-nang',
 'Đà Nẵng - Bà Nà Hills 3 ngày',
 'Tham quan Cầu Vàng, Bà Nà Hills, biển Mỹ Khê, bán đảo Sơn Trà và chợ đêm Đà Nẵng. Tour phù hợp với khách lần đầu đến Đà Nẵng.',
 'Đà Nẵng', 'city', 3, 4899000, 3699000, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000&h=700&fit=crop', 4.6, 118, TRUE, 'approved', NOW() - INTERVAL 12 DAY, NOW() - INTERVAL 10 DAY, 'admin-0001-0000-0000-000000000001'),
('tour-da-lat-farm-3d', 'prov-0001-0000-0000-000000000001', 'dest-da-lat',
 'Đà Lạt nông trại và săn mây 3 ngày',
 'Săn mây Cầu Đất, tham quan nông trại rau hoa, hồ Tuyền Lâm, đồi thông và thưởng thức cà phê đặc sản. Lịch trình nhẹ nhàng, phù hợp nghỉ dưỡng.',
 'Lâm Đồng', 'mountain', 3, 3899000, 2899000, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&h=700&fit=crop', 4.7, 126, TRUE, 'approved', NOW() - INTERVAL 11 DAY, NOW() - INTERVAL 9 DAY, 'admin-0001-0000-0000-000000000001'),
('tour-sapa-fansipan-3d', 'prov-0001-0000-0000-000000000001', 'dest-sapa',
 'Sapa - Fansipan 3 ngÃ y',
 'Chinh phục Fansipan bằng cáp treo, tham quan bản Cát Cát, ruộng bậc thang và chợ đêm Sapa. Tour có nhịp di chuyển vừa phải, phù hợp nhóm bạn và gia đình.',
 'LÃ o Cai', 'mountain', 3, 4299000, 3199000, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&h=700&fit=crop', 4.8, 142, TRUE, 'approved', NOW() - INTERVAL 14 DAY, NOW() - INTERVAL 12 DAY, 'admin-0001-0000-0000-000000000001'),
('tour-phu-quoc-4d', 'prov-0001-0000-0000-000000000001', 'dest-phu-quoc',
 'Phú Quốc nghỉ dưỡng 4 ngày',
 'Nghỉ dưỡng tại Phú Quốc, tham quan Bãi Sao, Hòn Thơm, lặn ngắm san hô, chợ đêm và Sunset Town. Tour ưu tiên trải nghiệm biển đảo và thời gian thư giãn.',
 'Kiên Giang', 'beach', 4, 6499000, 4999000, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&h=700&fit=crop', 4.9, 210, TRUE, 'approved', NOW() - INTERVAL 13 DAY, NOW() - INTERVAL 11 DAY, 'admin-0001-0000-0000-000000000001'),
('tour-nha-trang-island-3d', 'prov-0001-0000-0000-000000000001', 'dest-nha-trang',
 'Nha Trang tour đảo 3 ngày',
 'Khám phá vịnh Nha Trang, Hòn Mun, lặn biển, tắm bùn khoáng và thưởng thức hải sản. Tour phù hợp khách thích biển, đảo và hoạt động ngoài trời.',
 'Khánh Hòa', 'beach', 3, 4599000, 3499000, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&h=700&fit=crop', 4.6, 132, TRUE, 'approved', NOW() - INTERVAL 16 DAY, NOW() - INTERVAL 14 DAY, 'admin-0001-0000-0000-000000000001'),
('tour-mekong-can-tho-2d', 'prov-0001-0000-0000-000000000001', 'dest-mekong',
 'Miền Tây - Cần Thơ 2 ngày',
 'Tham quan chợ nổi Cái Răng, vườn trái cây, đi thuyền sông và thưởng thức ẩm thực miền Tây. Tour ngắn ngày, dễ đi, phù hợp cuối tuần.',
 'Cần Thơ', 'nature', 2, 2499000, 1899000, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000&h=700&fit=crop', 4.5, 86, TRUE, 'approved', NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 6 DAY, 'admin-0001-0000-0000-000000000001'),
('tour-mekong-food-2d', 'prov-0001-0000-0000-000000000001', 'dest-mekong',
 'Miền Tây ẩm thực miệt vườn 2 ngày',
 'Trải nghiệm bánh xèo, cá tai tượng, trái cây nhà vườn, lớp nấu món miền Tây và không gian homestay ven sông. Tour dành cho khách yêu ẩm thực địa phương.',
 'Cần Thơ', 'food', 2, 2199000, 1699000, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&h=700&fit=crop', 4.6, 93, TRUE, 'approved', NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 5 DAY, 'admin-0001-0000-0000-000000000001');

INSERT INTO tour_includes (tour_id, type)
SELECT id, 'transportation' FROM tours UNION ALL
SELECT id, 'tourGuide' FROM tours UNION ALL
SELECT id, 'entrance' FROM tours UNION ALL
SELECT id, 'meals' FROM tours;

INSERT INTO tour_images (tour_id, url, sort_order)
SELECT id, image, 0 FROM tours WHERE image IS NOT NULL;

INSERT INTO tour_itineraries (tour_id, day, title_vi, activities_vi) VALUES
('tour-ha-long-3d', 1, 'Hà Nội - Vịnh Hạ Long', JSON_ARRAY('Đón khách tại điểm hẹn', 'Di chuyển đến Hạ Long', 'Lên du thuyền và dùng bữa trưa', 'Tham quan hang Sửng Sốt')),
('tour-ha-long-3d', 2, 'Khám phá vịnh Hạ Long', JSON_ARRAY('Chèo kayak', 'Tham quan đảo Titop', 'Ngắm hoàng hôn trên boong tàu', 'Dùng bữa tối trên vịnh')),
('tour-ha-long-3d', 3, 'Hạ Long - Hà Nội', JSON_ARRAY('Ngắm bình minh', 'Ăn sáng trên du thuyền', 'Trả phòng', 'Về lại Hà Nội')),
('tour-yen-tu-ha-long-3d', 1, 'Hành hương Yên Tử', JSON_ARRAY('Khởi hành đi Yên Tử', 'Đi cáp treo', 'Tham quan chùa Hoa Yên', 'Nghỉ đêm tại Hạ Long')),
('tour-yen-tu-ha-long-3d', 2, 'Trải nghiệm vịnh Hạ Long', JSON_ARRAY('Lên du thuyền', 'Tham quan hang động', 'Chụp ảnh trên vịnh', 'Tự do khám phá phố đêm')),
('tour-yen-tu-ha-long-3d', 3, 'Mua đặc sản - Trở về', JSON_ARRAY('Tự do mua đặc sản', 'Trả phòng khách sạn', 'Về điểm hẹn ban đầu')),
('tour-hoi-an-2d', 1, 'Đà Nẵng - Hội An', JSON_ARRAY('Đón khách tại Đà Nẵng', 'Tham quan làng gốm Thanh Hà', 'Dạo phố cổ Hội An', 'Thả đèn hoa đăng')),
('tour-hoi-an-2d', 2, 'Biển An Bàng - Đà Nẵng', JSON_ARRAY('Tắm biển An Bàng', 'Thưởng thức đặc sản Hội An', 'Mua quà lưu niệm', 'Về Đà Nẵng')),
('tour-da-nang-ba-na-3d', 1, 'Khám phá thành phố Đà Nẵng', JSON_ARRAY('Đón khách', 'Tham quan bán đảo Sơn Trà', 'Tắm biển Mỹ Khê', 'Dạo chợ đêm')),
('tour-da-nang-ba-na-3d', 2, 'Bà Nà Hills - Cầu Vàng', JSON_ARRAY('Đi cáp treo Bà Nà', 'Check-in Cầu Vàng', 'Tham quan làng Pháp', 'Tự do vui chơi')),
('tour-da-nang-ba-na-3d', 3, 'Mua sắm - Trở về', JSON_ARRAY('Tham quan chợ Hàn', 'Mua đặc sản', 'Trả phòng', 'Tiễn khách')),
('tour-da-lat-farm-3d', 1, 'Đến Đà Lạt', JSON_ARRAY('Đón khách', 'Tham quan hồ Tuyền Lâm', 'Dạo chợ đêm Đà Lạt')),
('tour-da-lat-farm-3d', 2, 'Săn mây Cầu Đất', JSON_ARRAY('Săn mây sáng sớm', 'Tham quan đồi chè', 'Ghé nông trại rau hoa', 'Thưởng thức cà phê đặc sản')),
('tour-da-lat-farm-3d', 3, 'Thác Datanla - Trở về', JSON_ARRAY('Tham quan thác Datanla', 'Mua đặc sản', 'Về điểm hẹn')),
('tour-sapa-fansipan-3d', 1, 'Hà Nội - Sapa', JSON_ARRAY('Khởi hành đi Sapa', 'Nhận phòng', 'Dạo chợ đêm Sapa')),
('tour-sapa-fansipan-3d', 2, 'Fansipan - Bản Cát Cát', JSON_ARRAY('Đi cáp treo Fansipan', 'Tham quan bản Cát Cát', 'Tìm hiểu văn hóa địa phương')),
('tour-sapa-fansipan-3d', 3, 'Ruộng bậc thang - Trở về', JSON_ARRAY('Ngắm ruộng bậc thang', 'Mua đặc sản vùng cao', 'Về Hà Nội')),
('tour-phu-quoc-4d', 1, 'Đến Phú Quốc', JSON_ARRAY('Đón sân bay', 'Nhận phòng resort', 'Tắm biển tự do')),
('tour-phu-quoc-4d', 2, 'Tour Nam đảo', JSON_ARRAY('Đi cáp treo Hòn Thơm', 'Lặn ngắm san hô', 'Check-in Sunset Town')),
('tour-phu-quoc-4d', 3, 'Bãi Sao - Chợ đêm', JSON_ARRAY('Tắm biển Bãi Sao', 'Thưởng thức hải sản', 'Dạo chợ đêm Phú Quốc')),
('tour-phu-quoc-4d', 4, 'Mua đặc sản - Trở về', JSON_ARRAY('Mua nước mắm, hồ tiêu', 'Trả phòng', 'Tiễn sân bay')),
('tour-nha-trang-island-3d', 1, 'Đến Nha Trang', JSON_ARRAY('Đón khách', 'Nhận phòng', 'Dạo biển Trần Phú')),
('tour-nha-trang-island-3d', 2, 'Tour đảo Nha Trang', JSON_ARRAY('Tham quan Hòn Mun', 'Lặn ngắm san hô', 'Tắm biển', 'Ăn trưa hải sản')),
('tour-nha-trang-island-3d', 3, 'Tắm bùn khoáng - Trở về', JSON_ARRAY('Tắm bùn khoáng', 'Mua đặc sản', 'Tiễn khách')),
('tour-mekong-can-tho-2d', 1, 'TP.HCM - Cần Thơ', JSON_ARRAY('Khởi hành đi Cần Thơ', 'Tham quan vườn trái cây', 'Đi thuyền sông', 'Nghỉ đêm tại Cần Thơ')),
('tour-mekong-can-tho-2d', 2, 'Chợ nổi Cái Răng - Trở về', JSON_ARRAY('Tham quan chợ nổi Cái Răng', 'Ăn sáng trên sông', 'Mua đặc sản miền Tây', 'Về TP.HCM')),
('tour-mekong-food-2d', 1, 'Ẩm thực miệt vườn', JSON_ARRAY('Tham quan nhà vườn', 'Thưởng thức trái cây', 'Học làm bánh xèo', 'Nghỉ homestay ven sông')),
('tour-mekong-food-2d', 2, 'Chợ nổi - Lớp nấu ăn', JSON_ARRAY('Đi chợ nổi buổi sáng', 'Tham gia lớp nấu món miền Tây', 'Dùng bữa trưa địa phương', 'Trở về'));

INSERT INTO departure_schedules (id, tour_id, departure_date, total_slots, booked_slots, status)
SELECT CONCAT('sched-', id, '-1'), id, DATE_ADD(CURDATE(), INTERVAL 14 DAY), 24, 2, 'open' FROM tours
UNION ALL
SELECT CONCAT('sched-', id, '-2'), id, DATE_ADD(CURDATE(), INTERVAL 28 DAY), 24, 0, 'open' FROM tours;

