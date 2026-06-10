# Tài liệu cơ sở dữ liệu ThichDuLich

Nguồn đối chiếu chính: `Backend/src/main/resources/db/thichdulich.sql` và các entity trong `Backend/src/main/java/com/example/thichdulich/entity`.

Hệ quản trị: MySQL 8.0+  
Database: `thichdulich`  
Charset/Collation: `utf8mb4` / `utf8mb4_unicode_ci`

Ghi chú:
- `PK`: khóa chính.
- `FK`: khóa ngoại.
- `UK`: khóa duy nhất.
- `NULL`: được để trống.
- `NOT NULL`: bắt buộc có dữ liệu.
- Các bảng `payments`, `tour_blocked_dates`, `tour_includes`, `tour_images`, `tour_itineraries` có xuất hiện ở lệnh `DROP TABLE` nhưng trong schema hiện tại không có `CREATE TABLE` tương ứng và không thấy entity Java tương ứng. Hiện tại thông tin thanh toán đang được lưu trực tiếp trong bảng `bookings`.

## 1. Bảng `users`

Lưu tài khoản người dùng, nhà cung cấp và quản trị viên.

| Trường | Kiểu dữ liệu | Ràng buộc / mặc định | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK, NOT NULL | Mã người dùng, thường là UUID hoặc mã cố định demo. |
| `name` | `VARCHAR(100)` | NOT NULL | Họ tên hoặc tên hiển thị. |
| `email` | `VARCHAR(150)` | NOT NULL, UK `uq_users_email` | Email đăng nhập, không được trùng. |
| `password_hash` | `VARCHAR(255)` | NULL | Mật khẩu đã mã hóa bằng bcrypt hoặc thuật toán tương ứng. |
| `role` | `ENUM('user','provider','admin')` | NOT NULL, default `'user'` | Vai trò: khách hàng, nhà cung cấp, admin. |
| `avatar_url` | `LONGTEXT` | NULL | Ảnh đại diện, có thể là URL hoặc data base64. |
| `provider` | `ENUM('LOCAL','GOOGLE')` | NOT NULL, default `'LOCAL'` | Nguồn đăng nhập: tài khoản nội bộ hoặc Google. |
| `enabled` | `BOOLEAN` | NOT NULL, default `FALSE` | Tài khoản đã kích hoạt email hay chưa. |
| `phone` | `VARCHAR(15)` | NULL | Số điện thoại. |
| `is_active` | `BOOLEAN` | NOT NULL, default `TRUE` | Tài khoản còn hoạt động hay không. |
| `is_banned` | `BOOLEAN` | NOT NULL, default `FALSE` | Tài khoản có bị khóa/cấm hay không. |
| `last_login` | `DATETIME` | NULL | Thời điểm đăng nhập gần nhất. |
| `created_at` | `DATETIME` | NOT NULL, default `CURRENT_TIMESTAMP` | Thời điểm tạo tài khoản. |
| `updated_at` | `DATETIME` | NOT NULL, tự cập nhật | Thời điểm cập nhật gần nhất. |

Index:
- `idx_users_role(role)`
- `idx_users_role_active(role, is_active, is_banned)`

## 2. Bảng `providers`

Lưu hồ sơ nhà cung cấp tour, liên kết 1-1 với tài khoản `users`.

| Trường | Kiểu dữ liệu | Ràng buộc / mặc định | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK, NOT NULL | Mã hồ sơ nhà cung cấp. |
| `user_id` | `VARCHAR(36)` | NOT NULL, UK, FK -> `users(id)` ON DELETE CASCADE | Tài khoản user sở hữu hồ sơ provider. |
| `company_name` | `VARCHAR(200)` | NOT NULL | Tên công ty/đơn vị du lịch. |
| `tax_code` | `VARCHAR(20)` | NULL | Mã số thuế. |
| `phone` | `VARCHAR(15)` | NULL | Số điện thoại công ty. |
| `address` | `TEXT` | NULL | Địa chỉ công ty. |
| `license_number` | `VARCHAR(100)` | NULL | Số giấy phép kinh doanh/lữ hành. |
| `description` | `TEXT` | NULL | Mô tả nhà cung cấp. |
| `logo` | `VARCHAR(500)` | NULL | URL logo. |
| `status` | `ENUM('pending','approved','rejected')` | NOT NULL, default `'pending'` | Trạng thái duyệt nhà cung cấp. |
| `is_verified` | `BOOLEAN` | NOT NULL, default `FALSE` | Đã xác minh hay chưa. |
| `joined_date` | `DATE` | NOT NULL | Ngày tham gia hệ thống. |

Index:
- `idx_providers_status_verified(status, is_verified)`

## 3. Bảng `destinations`

Lưu điểm đến du lịch.

| Trường | Kiểu dữ liệu | Ràng buộc / mặc định | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK, NOT NULL | Mã điểm đến. |
| `name_vi` | `VARCHAR(200)` | NOT NULL | Tên điểm đến tiếng Việt. |
| `description_vi` | `TEXT` | NULL | Mô tả điểm đến tiếng Việt. |
| `image` | `VARCHAR(500)` | NULL | URL ảnh đại diện điểm đến. |
| `region` | `ENUM('Bắc','Trung','Nam','Quốc tế')` | NOT NULL | Khu vực địa lý. |
| `created_at` | `DATETIME` | NOT NULL, default `CURRENT_TIMESTAMP` | Thời điểm tạo điểm đến. |

Index:
- `idx_destinations_region(region)`

## 4. Bảng `tour_categories`

Danh mục loại tour dùng để phân loại và lọc tour.

| Trường | Kiểu dữ liệu | Ràng buộc / mặc định | Ý nghĩa |
|---|---|---|---|
| `code` | `VARCHAR(30)` | PK, NOT NULL | Mã danh mục, ví dụ `beach`, `nature`. |
| `name` | `VARCHAR(100)` | NOT NULL | Tên danh mục hiển thị. |
| `description` | `TEXT` | NULL | Mô tả danh mục. |
| `active` | `BOOLEAN` | NOT NULL, default `TRUE` | Danh mục còn được sử dụng hay không. |
| `sort_order` | `INT` | NOT NULL, default `0` | Thứ tự sắp xếp. |
| `created_at` | `DATETIME` | NOT NULL, default `CURRENT_TIMESTAMP` | Thời điểm tạo. |
| `updated_at` | `DATETIME` | NOT NULL, tự cập nhật | Thời điểm cập nhật gần nhất. |

Index:
- `idx_tour_categories_active(active)`
- `idx_tour_categories_sort(sort_order)`

Giá trị mẫu đang có:
- `beach`: Biển đảo
- `nature`: Thiên nhiên
- `mountain`: Núi
- `cultural`: Văn hóa
- `adventure`: Mạo hiểm
- `food`: Ẩm thực
- `city`: Thành phố

## 5. Bảng `tours`

Lưu thông tin tour du lịch do provider tạo và admin duyệt.

| Trường | Kiểu dữ liệu | Ràng buộc / mặc định | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK, NOT NULL | Mã tour. |
| `provider_id` | `VARCHAR(36)` | NOT NULL, FK -> `providers(id)` ON DELETE CASCADE | Nhà cung cấp sở hữu tour. |
| `destination_id` | `VARCHAR(36)` | NULL, FK -> `destinations(id)` ON DELETE SET NULL | Điểm đến chính của tour. |
| `name_vi` | `VARCHAR(300)` | NOT NULL | Tên tour tiếng Việt. |
| `description_vi` | `TEXT` | NULL | Mô tả tour tiếng Việt. |
| `location` | `VARCHAR(200)` | NOT NULL | Địa điểm/khu vực tổ chức tour. |
| `type` | `ENUM('adventure','beach','cultural','food','nature','mountain','city')` | NOT NULL | Loại tour. |
| `duration` | `TINYINT` | NOT NULL | Số ngày của tour. |
| `max_people_per_day` | `INT` | NOT NULL, default `20` | Sức chứa tối đa mỗi ngày. |
| `advance_booking_days` | `INT` | NOT NULL, default `3` | Số ngày tối thiểu cần đặt trước. |
| `price` | `BIGINT` | NOT NULL | Giá người lớn, đơn vị VND. |
| `child_price` | `BIGINT` | NULL | Giá trẻ em, đơn vị VND. |
| `original_price` | `BIGINT` | NULL | Giá gốc trước khuyến mãi. |
| `promotion_title` | `VARCHAR(200)` | NULL | Tiêu đề khuyến mãi. |
| `promotion_badge` | `VARCHAR(80)` | NULL | Nhãn ngắn của khuyến mãi. |
| `discount_percent` | `TINYINT` | NULL | Phần trăm giảm giá. |
| `promotion_active` | `BOOLEAN` | NOT NULL, default `FALSE` | Khuyến mãi đang bật hay không. |
| `promotion_status` | `VARCHAR(20)` | NOT NULL, default `'none'` | Trạng thái khuyến mãi. |
| `promotion_source` | `VARCHAR(20)` | NOT NULL, default `'none'` | Nguồn khuyến mãi. |
| `excluded_services` | `TEXT` | NULL | Dịch vụ không bao gồm. |
| `included_services` | `TEXT` | NULL | Dịch vụ bao gồm. |
| `itinerary_json` | `LONGTEXT` | NULL | Lịch trình dạng JSON. |
| `images_json` | `LONGTEXT` | NULL | Danh sách ảnh dạng JSON. |
| `image` | `VARCHAR(500)` | NULL | Ảnh đại diện tour. |
| `rating` | `DECIMAL(2,1)` | NOT NULL, default `0.0` | Điểm đánh giá trung bình. |
| `review_count` | `INT` | NOT NULL, default `0` | Số lượt đánh giá. |
| `availability` | `BOOLEAN` | NOT NULL, default `TRUE` | Tour còn khả dụng hay không. |
| `status` | `ENUM('pending','approved','rejected','need_edit','updated')` | NOT NULL, default `'pending'` | Trạng thái duyệt tour. |
| `rejection_reason` | `TEXT` | NULL | Lý do từ chối. |
| `admin_notes` | `TEXT` | NULL | Ghi chú/yêu cầu chỉnh sửa từ admin. |
| `submitted_at` | `DATETIME` | NULL | Thời điểm provider gửi duyệt. |
| `reviewed_at` | `DATETIME` | NULL | Thời điểm admin duyệt/từ chối/yêu cầu sửa. |
| `reviewed_by` | `VARCHAR(36)` | NULL, FK -> `users(id)` ON DELETE SET NULL | Admin xử lý duyệt tour. |
| `created_at` | `DATETIME` | NOT NULL, default `CURRENT_TIMESTAMP` | Thời điểm tạo tour. |
| `updated_at` | `DATETIME` | NOT NULL, tự cập nhật | Thời điểm cập nhật tour gần nhất. |

Index:
- `idx_tours_provider(provider_id)`
- `idx_tours_destination(destination_id)`
- `idx_tours_status(status)`
- `idx_tours_type(type)`
- `idx_tours_status_availability_rating(status, availability, rating)`
- `idx_tours_provider_status_updated(provider_id, status, updated_at)`
- `idx_tours_status_type_price(status, type, price)`
- `idx_tours_destination_status(destination_id, status)`

## 6. Bảng `departure_schedules`

Lưu lịch khởi hành và số chỗ của từng tour theo ngày.

| Trường | Kiểu dữ liệu | Ràng buộc / mặc định | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK, NOT NULL | Mã lịch khởi hành. |
| `tour_id` | `VARCHAR(36)` | NOT NULL, FK -> `tours(id)` ON DELETE CASCADE | Tour của lịch khởi hành. |
| `departure_date` | `DATE` | NOT NULL | Ngày khởi hành. |
| `total_slots` | `SMALLINT` | NOT NULL, default `20` | Tổng số chỗ. |
| `booked_slots` | `SMALLINT` | NOT NULL, default `0` | Số chỗ đã đặt. |
| `status` | `ENUM('open','closed','full')` | NOT NULL, default `'open'` | Trạng thái lịch: mở, đóng, đầy. |

Ràng buộc:
- UK `uq_schedule_tour_date(tour_id, departure_date)`: một tour không được trùng lịch trong cùng một ngày.
- CHECK `booked_slots >= 0 AND booked_slots <= total_slots`.

Index:
- `idx_schedules_tour(tour_id)`
- `idx_schedules_date(departure_date)`
- `idx_schedules_status_date(status, departure_date)`

## 7. Bảng `bookings`

Lưu đơn đặt tour, thanh toán, hủy, hoàn tiền và chi trả cho provider.

| Trường | Kiểu dữ liệu | Ràng buộc / mặc định | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK, NOT NULL | Mã đặt tour. |
| `tour_id` | `VARCHAR(36)` | NOT NULL, FK -> `tours(id)` ON DELETE RESTRICT | Tour được đặt. |
| `user_id` | `VARCHAR(36)` | NOT NULL, FK -> `users(id)` ON DELETE RESTRICT | Người đặt tour. |
| `departure_schedule_id` | `VARCHAR(36)` | NULL, FK -> `departure_schedules(id)` ON DELETE SET NULL | Lịch khởi hành được chọn. |
| `start_date` | `DATE` | NULL | Ngày bắt đầu/khởi hành. |
| `adults` | `TINYINT` | NOT NULL, default `1` | Số người lớn. |
| `children` | `TINYINT` | NOT NULL, default `0` | Số trẻ em. |
| `total_amount` | `BIGINT` | NOT NULL | Tổng tiền đơn hàng. |
| `deposit_amount` | `BIGINT` | NOT NULL, default `0` | Tiền cọc. |
| `remaining_amount` | `BIGINT` | NOT NULL, default `0` | Số tiền còn lại. |
| `commission_rate` | `INT` | NOT NULL, default `10` | Tỷ lệ hoa hồng phần trăm của hệ thống. |
| `commission_amount` | `BIGINT` | NOT NULL, default `0` | Số tiền hoa hồng. |
| `provider_payout_amount` | `BIGINT` | NOT NULL, default `0` | Số tiền provider được nhận. |
| `cancelled_by` | `VARCHAR(20)` | NULL | Bên hủy đơn, ví dụ user/provider/admin/system. |
| `cancelled_at` | `DATETIME` | NULL | Thời điểm hủy. |
| `cancel_reason` | `TEXT` | NULL | Lý do hủy. |
| `refund_status` | `ENUM('none','refund_pending','refunded','no_refund','refund_rejected')` | NOT NULL, default `'none'` | Trạng thái hoàn tiền. |
| `refund_amount` | `BIGINT` | NOT NULL, default `0` | Số tiền hoàn. |
| `refund_bank_name` | `VARCHAR(100)` | NULL | Tên ngân hàng nhận hoàn tiền. |
| `refund_account_number` | `VARCHAR(50)` | NULL | Số tài khoản nhận hoàn tiền. |
| `refund_account_name` | `VARCHAR(100)` | NULL | Tên chủ tài khoản nhận hoàn tiền. |
| `refund_requested_at` | `DATETIME` | NULL | Thời điểm yêu cầu hoàn tiền. |
| `refund_processed_at` | `DATETIME` | NULL | Thời điểm admin xử lý hoàn tiền. |
| `refund_processed_by` | `VARCHAR(36)` | NULL | Admin xử lý hoàn tiền. |
| `refund_reject_reason` | `TEXT` | NULL | Lý do từ chối hoàn tiền. |
| `payout_status` | `ENUM('none','payout_pending','paid_out')` | NOT NULL, default `'none'` | Trạng thái chi trả cho provider. |
| `payout_amount` | `BIGINT` | NOT NULL, default `0` | Số tiền chi trả provider. |
| `payout_processed_at` | `DATETIME` | NULL | Thời điểm xử lý chi trả. |
| `payout_processed_by` | `VARCHAR(36)` | NULL | Admin xử lý chi trả. |
| `payment_method` | `VARCHAR(30)` | NULL | Phương thức thanh toán, ví dụ `cod`, `bank_qr`, `vnpay`. |
| `payment_status` | `VARCHAR(30)` | NULL | Trạng thái thanh toán. |
| `payment_amount` | `BIGINT` | NULL | Số tiền thanh toán thực tế. |
| `payment_transaction_code` | `VARCHAR(200)` | NULL | Mã giao dịch/mã tham chiếu thanh toán. |
| `payment_url` | `VARCHAR(1000)` | NULL | URL thanh toán nếu có. |
| `payment_qr_code` | `TEXT` | NULL | Mã QR thanh toán hoặc nội dung QR. |
| `paid_at` | `DATETIME` | NULL | Thời điểm thanh toán thành công. |
| `status` | `ENUM('pending','deposited','paid','confirmed','completed','cancelled','refunded')` | NOT NULL, default `'pending'` | Trạng thái đơn đặt tour. |
| `contact_name` | `VARCHAR(100)` | NOT NULL | Tên người liên hệ. |
| `contact_email` | `VARCHAR(150)` | NOT NULL | Email người liên hệ. |
| `contact_phone` | `VARCHAR(15)` | NOT NULL | Số điện thoại người liên hệ. |
| `special_requests` | `TEXT` | NULL | Yêu cầu đặc biệt của khách. |
| `created_at` | `DATETIME` | NOT NULL, default `CURRENT_TIMESTAMP` | Thời điểm tạo đơn. |
| `reviewed_at` | `DATETIME` | NULL | Thời điểm đơn được đánh giá/xử lý đánh giá. |

Index:
- `idx_bookings_tour(tour_id)`
- `idx_bookings_user(user_id)`
- `idx_bookings_schedule(departure_schedule_id)`
- `idx_bookings_status(status)`
- `idx_bookings_created(created_at)`
- `idx_bookings_user_created(user_id, created_at)`
- `idx_bookings_tour_start_status(tour_id, start_date, status)`
- `idx_bookings_status_created(status, created_at)`
- `idx_bookings_status_start(status, start_date)`
- `idx_bookings_refund_status_created(refund_status, created_at)`
- `idx_bookings_payout_status_created(payout_status, created_at)`
- `idx_bookings_payment_status_created(payment_status, created_at)`
- `idx_bookings_payment_transaction(payment_transaction_code)`

## 8. Bảng `tour_reviews`

Lưu đánh giá tour của khách sau khi đặt tour.

| Trường | Kiểu dữ liệu | Ràng buộc / mặc định | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK, NOT NULL | Mã đánh giá. |
| `tour_id` | `VARCHAR(36)` | NOT NULL, FK -> `tours(id)` ON DELETE CASCADE | Tour được đánh giá. |
| `user_id` | `VARCHAR(36)` | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | Người đánh giá. |
| `booking_id` | `VARCHAR(36)` | NOT NULL, UK, FK -> `bookings(id)` ON DELETE CASCADE | Đơn đặt tour gắn với đánh giá. |
| `rating` | `TINYINT` | NOT NULL, CHECK 1-5 | Số sao đánh giá. |
| `comment` | `TEXT` | NOT NULL | Nội dung nhận xét. |
| `images` | `LONGTEXT` | NULL | Ảnh đánh giá, có thể là JSON hoặc data base64. |
| `helpful_count` | `INT` | NOT NULL, default `0` | Số lượt đánh dấu hữu ích. |
| `response_from` | `VARCHAR(100)` | NULL | Tên người/đơn vị phản hồi. |
| `response_message` | `TEXT` | NULL | Nội dung phản hồi từ provider. |
| `response_at` | `DATETIME` | NULL | Thời điểm phản hồi. |
| `response_requested` | `BOOLEAN` | NOT NULL, default `FALSE` | Admin có yêu cầu provider phản hồi hay không. |
| `response_requested_at` | `DATETIME` | NULL | Thời điểm admin yêu cầu phản hồi. |
| `response_requested_by` | `VARCHAR(36)` | NULL, FK -> `users(id)` ON DELETE SET NULL | Admin yêu cầu phản hồi. |
| `created_at` | `DATETIME` | NOT NULL, default `CURRENT_TIMESTAMP` | Thời điểm tạo đánh giá. |

Index:
- `idx_reviews_tour(tour_id)`
- `idx_reviews_user(user_id)`
- `idx_reviews_tour_created(tour_id, created_at)`
- `idx_reviews_user_created(user_id, created_at)`
- `idx_reviews_response_requested(response_requested, created_at)`

## 9. Bảng `tour_reports`

Lưu báo cáo/khiếu nại về tour.

| Trường | Kiểu dữ liệu | Ràng buộc / mặc định | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK, NOT NULL | Mã báo cáo. |
| `tour_id` | `VARCHAR(36)` | NOT NULL, FK -> `tours(id)` ON DELETE CASCADE | Tour bị báo cáo. |
| `reported_by` | `VARCHAR(36)` | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | Người gửi báo cáo. |
| `booking_id` | `VARCHAR(36)` | NULL, UK, FK -> `bookings(id)` ON DELETE CASCADE | Đơn đặt tour liên quan nếu có. |
| `reason` | `VARCHAR(200)` | NOT NULL | Lý do báo cáo. |
| `description` | `TEXT` | NOT NULL | Mô tả chi tiết. |
| `images` | `LONGTEXT` | NULL | Ảnh minh chứng. |
| `status` | `ENUM('pending','reviewed','resolved','dismissed')` | NOT NULL, default `'pending'` | Trạng thái xử lý báo cáo. |
| `admin_note` | `TEXT` | NULL | Ghi chú xử lý của admin. |
| `reviewed_by` | `VARCHAR(36)` | NULL, FK -> `users(id)` ON DELETE SET NULL | Admin xử lý báo cáo. |
| `reviewed_at` | `DATETIME` | NULL | Thời điểm xử lý báo cáo. |
| `created_at` | `DATETIME` | NOT NULL, default `CURRENT_TIMESTAMP` | Thời điểm tạo báo cáo. |

Index:
- `idx_reports_tour(tour_id)`
- `idx_reports_status(status)`
- `idx_reports_status_created(status, created_at)`
- `idx_reports_tour_status(tour_id, status)`
- `idx_reports_reporter_created(reported_by, created_at)`

## 10. Bảng `tour_messages`

Lưu tin nhắn trao đổi giữa admin và provider liên quan đến tour.

| Trường | Kiểu dữ liệu | Ràng buộc / mặc định | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK, NOT NULL | Mã tin nhắn. |
| `tour_id` | `VARCHAR(36)` | NOT NULL, FK -> `tours(id)` ON DELETE CASCADE | Tour liên quan. |
| `sender_id` | `VARCHAR(36)` | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | Người gửi. |
| `sender_role` | `ENUM('admin','provider')` | NOT NULL | Vai trò người gửi. |
| `sender_name` | `VARCHAR(100)` | NOT NULL | Tên người gửi tại thời điểm gửi. |
| `message` | `TEXT` | NOT NULL | Nội dung tin nhắn. |
| `sent_at` | `DATETIME` | NOT NULL, default `CURRENT_TIMESTAMP` | Thời điểm gửi. |

Index:
- `idx_messages_tour(tour_id)`
- `idx_messages_sender(sender_id)`
- `idx_messages_tour_sent(tour_id, sent_at)`

## 11. Bảng `contact_messages`

Lưu tin nhắn liên hệ từ khách hàng/người dùng gửi tới hệ thống.

| Trường | Kiểu dữ liệu | Ràng buộc / mặc định | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK, NOT NULL | Mã tin nhắn liên hệ. |
| `user_id` | `VARCHAR(36)` | NULL, FK -> `users(id)` ON DELETE SET NULL | Người dùng gửi liên hệ nếu đã đăng nhập. |
| `name` | `VARCHAR(100)` | NOT NULL | Tên người gửi. |
| `email` | `VARCHAR(150)` | NOT NULL | Email người gửi. |
| `phone` | `VARCHAR(15)` | NULL | Số điện thoại người gửi. |
| `subject` | `VARCHAR(300)` | NOT NULL | Chủ đề liên hệ. |
| `message` | `TEXT` | NOT NULL | Nội dung liên hệ. |
| `status` | `ENUM('new','replied','resolved')` | NOT NULL, default `'new'` | Trạng thái xử lý liên hệ. |
| `replied_by` | `VARCHAR(36)` | NULL, FK -> `users(id)` ON DELETE SET NULL | Admin/người phản hồi. |
| `replied_at` | `DATETIME` | NULL | Thời điểm phản hồi. |
| `reply_message` | `TEXT` | NULL | Nội dung phản hồi. |
| `created_at` | `DATETIME` | NOT NULL, default `CURRENT_TIMESTAMP` | Thời điểm gửi liên hệ. |

Index:
- `idx_contacts_status(status)`
- `idx_contacts_status_created(status, created_at)`
- `idx_contacts_created(created_at)`

## 12. Bảng `favorites`

Lưu danh sách tour yêu thích của người dùng.

| Trường | Kiểu dữ liệu | Ràng buộc / mặc định | Ý nghĩa |
|---|---|---|---|
| `id` | `INT` | PK, NOT NULL, AUTO_INCREMENT | Mã tự tăng của bản ghi yêu thích. |
| `user_id` | `VARCHAR(36)` | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | Người dùng yêu thích tour. |
| `tour_id` | `VARCHAR(36)` | NOT NULL, FK -> `tours(id)` ON DELETE CASCADE | Tour được yêu thích. |
| `created_at` | `DATETIME` | NOT NULL, default `CURRENT_TIMESTAMP` | Thời điểm thêm vào yêu thích. |

Ràng buộc:
- UK `uq_favorites(user_id, tour_id)`: một user chỉ được yêu thích một tour một lần.

Index:
- `idx_favorites_tour(tour_id)`

## 13. Bảng `user_interactions`

Lưu hành vi người dùng để phục vụ gợi ý/AI/recommendation.

| Trường | Kiểu dữ liệu | Ràng buộc / mặc định | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK, NOT NULL | Mã tương tác. |
| `user_id` | `VARCHAR(36)` | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | Người dùng thực hiện hành động. |
| `tour_id` | `VARCHAR(36)` | NULL, FK -> `tours(id)` ON DELETE SET NULL | Tour liên quan nếu có. |
| `action` | `ENUM('view','search','click','bookmark')` | NOT NULL | Loại hành động: xem, tìm kiếm, click, lưu. |
| `search_query` | `VARCHAR(255)` | NULL | Từ khóa tìm kiếm nếu action là `search`. |
| `created_at` | `DATETIME` | NOT NULL, default `CURRENT_TIMESTAMP` | Thời điểm ghi nhận tương tác. |

Index:
- `idx_interactions_user_created(user_id, created_at)`
- `idx_interactions_user_action_created(user_id, action, created_at)`
- `idx_interactions_tour_created(tour_id, created_at)`

## 14. Bảng `email_verification_codes`

Lưu mã xác thực email và mã phục vụ các mục đích xác thực qua email.

| Trường | Kiểu dữ liệu | Ràng buộc / mặc định | Ý nghĩa |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PK, NOT NULL | Mã bản ghi xác thực. |
| `email` | `VARCHAR(150)` | NOT NULL | Email cần xác thực. |
| `code_hash` | `VARCHAR(255)` | NOT NULL | Mã xác thực đã hash, không lưu mã thô. |
| `purpose` | `VARCHAR(30)` | NOT NULL, default `'EMAIL_VERIFICATION'` | Mục đích mã: xác thực email, quên mật khẩu, v.v. |
| `expires_at` | `DATETIME` | NOT NULL | Thời điểm mã hết hạn. |
| `used` | `BOOLEAN` | NOT NULL, default `FALSE` | Mã đã được sử dụng hay chưa. |
| `created_at` | `DATETIME` | NOT NULL, default `CURRENT_TIMESTAMP` | Thời điểm tạo mã. |

Index:
- `idx_email_verification_email_created(email, created_at)`
- `idx_email_verification_lookup(email, purpose, used, expires_at)`

## Quan hệ chính giữa các bảng

| Quan hệ | Ý nghĩa |
|---|---|
| `providers.user_id -> users.id` | Mỗi provider gắn với một tài khoản user. |
| `tours.provider_id -> providers.id` | Mỗi tour thuộc một provider. |
| `tours.destination_id -> destinations.id` | Tour có thể thuộc một điểm đến. |
| `tours.reviewed_by -> users.id` | Admin duyệt tour. |
| `departure_schedules.tour_id -> tours.id` | Lịch khởi hành thuộc một tour. |
| `bookings.tour_id -> tours.id` | Đơn đặt thuộc một tour. |
| `bookings.user_id -> users.id` | Đơn đặt thuộc một khách hàng. |
| `bookings.departure_schedule_id -> departure_schedules.id` | Đơn đặt có thể gắn với lịch khởi hành. |
| `tour_reviews.tour_id -> tours.id` | Đánh giá thuộc một tour. |
| `tour_reviews.user_id -> users.id` | Người viết đánh giá. |
| `tour_reviews.booking_id -> bookings.id` | Mỗi booking chỉ có tối đa một đánh giá. |
| `tour_reports.tour_id -> tours.id` | Báo cáo thuộc một tour. |
| `tour_reports.reported_by -> users.id` | Người gửi báo cáo. |
| `tour_reports.booking_id -> bookings.id` | Báo cáo có thể gắn với một booking. |
| `tour_messages.tour_id -> tours.id` | Tin nhắn trao đổi theo tour. |
| `tour_messages.sender_id -> users.id` | Người gửi tin nhắn. |
| `contact_messages.user_id -> users.id` | Liên hệ có thể gắn với user đăng nhập. |
| `favorites.user_id -> users.id` | User lưu tour yêu thích. |
| `favorites.tour_id -> tours.id` | Tour được lưu yêu thích. |
| `user_interactions.user_id -> users.id` | Tương tác của user. |
| `user_interactions.tour_id -> tours.id` | Tương tác có thể gắn với tour. |

## Danh sách ENUM quan trọng

| Cột | Giá trị | Ý nghĩa |
|---|---|---|
| `users.role` | `user`, `provider`, `admin` | Khách hàng, nhà cung cấp, quản trị viên. |
| `users.provider` | `LOCAL`, `GOOGLE` | Đăng nhập nội bộ hoặc Google. |
| `providers.status` | `pending`, `approved`, `rejected` | Chờ duyệt, đã duyệt, bị từ chối. |
| `destinations.region` | `Bắc`, `Trung`, `Nam`, `Quốc tế` | Khu vực điểm đến. |
| `tours.type` | `adventure`, `beach`, `cultural`, `food`, `nature`, `mountain`, `city` | Loại hình tour. |
| `tours.status` | `pending`, `approved`, `rejected`, `need_edit`, `updated` | Trạng thái xét duyệt tour. |
| `departure_schedules.status` | `open`, `closed`, `full` | Mở đặt, đóng đặt, đã đầy. |
| `bookings.status` | `pending`, `deposited`, `paid`, `confirmed`, `completed`, `cancelled`, `refunded` | Trạng thái vòng đời đơn đặt tour. |
| `bookings.refund_status` | `none`, `refund_pending`, `refunded`, `no_refund`, `refund_rejected` | Trạng thái hoàn tiền. |
| `bookings.payout_status` | `none`, `payout_pending`, `paid_out` | Trạng thái chi trả provider. |
| `tour_reports.status` | `pending`, `reviewed`, `resolved`, `dismissed` | Trạng thái xử lý báo cáo. |
| `tour_messages.sender_role` | `admin`, `provider` | Vai trò người gửi tin nhắn. |
| `contact_messages.status` | `new`, `replied`, `resolved` | Mới, đã phản hồi, đã xử lý xong. |
| `user_interactions.action` | `view`, `search`, `click`, `bookmark` | Hành vi người dùng. |

