# Cơ sở dữ liệu Thích Du Lịch

## Tạo database

```bash
mysql -u root -p < database/thichdulich.sql
```

Hoặc trong MySQL Workbench: mở file `thichdulich.sql` và chạy toàn bộ script.

## Cấu hình Backend

File `Backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/thichdulich?...
spring.datasource.username=root
spring.datasource.password=123456
spring.jpa.hibernate.ddl-auto=none
```

**Quan trọng:** `ddl-auto=none` — Hibernate không tự sửa bảng; schema lấy từ file SQL.

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | admin@demo.com | admin123 |
| Nhà cung cấp | provider@demo.com | demo123 |
| Khách hàng | user@demo.com | demo123 |

Nếu chạy SQL trước khi start Backend, mật khẩu trong SQL có thể không khớp — xóa dữ liệu `users` và để `DataInitializer` tạo lại, hoặc đăng ký tài khoản mới qua API.

## 14 bảng

`users`, `providers`, `destinations`, `tours`, `tour_itineraries`, `tour_includes`, `tour_images`, `departure_schedules`, `bookings`, `payments`, `tour_reviews`, `tour_reports`, `tour_messages`, `contact_messages`, `favorites`
