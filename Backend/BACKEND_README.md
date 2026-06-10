# ThichDulich Backend API

Backend API cho ứng dụng đặt tour du lịch ThichDulich, được xây dựng bằng **Spring Boot 4.0.6** và **Java 17**.

## Features

- 🔐 **Authentication & Authorization** - JWT-based authentication với roles (USER, ADMIN, PROVIDER)
- 🏨 **Tour Management** - Tạo, cập nhật, xóa và quản lý tour
- 📅 **Booking System** - Đặt tour, hủy booking, quản lý trạng thái
- ⭐ **Reviews & Ratings** - Đánh giá tour, xem review của người khác
- 📝 **Admin Dashboard** - Phê duyệt tour, quản lý báo cáo
- 👤 **User Management** - Hồ sơ người dùng, lịch sử đặt tour
- 📧 **Contact Messages** - Hệ thống liên hệ, phản hồi

## Technologies

- **Framework**: Spring Boot 4.0.6
- **Language**: Java 17
- **Database**: MySQL 8.0
- **Security**: JWT (JSON Web Token)
- **Mapping**: ModelMapper
- **Validation**: Jakarta Validation

## Prerequisites

- Java 17 or higher
- MySQL 8.0 or higher
- Maven 3.6+
- Git

## Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd Backend
```

### 2. Database Setup
```sql
CREATE DATABASE thichdulich;
```

### 3. Update Configuration
Chỉnh sửa `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/thichdulich?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=<your-password>
```

### 4. Build Project
```bash
mvn clean install
```

### 5. Run Application
```bash
mvn spring-boot:run
```

Server sẽ chạy tại: `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký

### Tours
- `GET /api/tours` - Lấy danh sách tour
- `GET /api/tours/{id}` - Chi tiết tour
- `GET /api/tours/type/{type}` - Tour theo loại
- `GET /api/tours/location/{location}` - Tour theo địa điểm
- `GET /api/tours/trending` - Tour trending
- `POST /api/tours` - Tạo tour (Provider)
- `PUT /api/tours/{id}` - Cập nhật tour (Provider)
- `DELETE /api/tours/{id}` - Xóa tour (Provider)

### Bookings
- `POST /api/bookings` - Tạo booking
- `GET /api/bookings/{id}` - Chi tiết booking
- `GET /api/bookings/my-bookings` - Booking của tôi
- `GET /api/bookings/tour/{tourId}` - Booking của tour
- `PUT /api/bookings/{id}/status/{status}` - Cập nhật trạng thái
- `POST /api/bookings/{id}/cancel` - Hủy booking

### Reviews
- `POST /api/reviews` - Tạo review
- `GET /api/reviews/tour/{tourId}` - Review của tour
- `PUT /api/reviews/{id}` - Cập nhật review
- `DELETE /api/reviews/{id}` - Xóa review
- `POST /api/reviews/{id}/response` - Trả lời review

### Users
- `GET /api/users/profile` - Hồ sơ của tôi
- `PUT /api/users/profile` - Cập nhật hồ sơ
- `POST /api/users/change-password` - Đổi mật khẩu

### Destinations
- `GET /api/destinations` - Danh sách địa điểm
- `GET /api/destinations/{id}` - Chi tiết địa điểm
- `GET /api/destinations/search` - Tìm kiếm địa điểm
- `GET /api/destinations/region/{region}` - Địa điểm theo vùng

### Contact
- `POST /api/contact` - Gửi message
- `GET /api/contact` - Danh sách message (Admin)
- `GET /api/contact/new` - Message mới (Admin)
- `POST /api/contact/{id}/reply` - Trả lời message
- `POST /api/contact/{id}/resolve` - Đánh dấu đã xử lý

### Admin
- `GET /api/admin/tours/pending` - Tour chờ phê duyệt
- `POST /api/admin/tours/{id}/approve` - Phê duyệt tour
- `POST /api/admin/tours/{id}/reject` - Từ chối tour
- `POST /api/admin/tours/{id}/request-edit` - Yêu cầu chỉnh sửa
- `GET /api/admin/reports/pending` - Báo cáo chờ xử lý
- `POST /api/admin/reports/{id}/resolve` - Xử lý báo cáo
- `POST /api/admin/reports/{id}/dismiss` - Bỏ qua báo cáo

### Reports
- `POST /api/reports` - Tạo báo cáo
- `GET /api/reports/tour/{tourId}` - Báo cáo của tour
- `GET /api/reports/pending` - Báo cáo chờ xử lý

## Authentication

Sử dụng JWT Token trong header:
```
Authorization: Bearer <token>
```

## Default Users

Hệ thống đã có sẵn một số tài khoản mặc định (nếu tạo data seed):
- Admin: `admin@demo.com` / `admin123`
- Provider: `provider@demo.com` / `demo123`
- User: `user@demo.com` / `demo123`

## Project Structure

```
Backend/
├── src/main/java/com/example/thichdulich/
│   ├── entity/              # JPA Entities
│   ├── dto/                 # Data Transfer Objects
│   ├── repository/          # Spring Data JPA Repositories
│   ├── service/             # Business Logic
│   ├── controller/          # REST API Controllers
│   ├── security/            # Security & JWT
│   ├── config/              # Configuration Classes
│   └── ThichdulichApplication.java
├── src/main/resources/
│   ├── application.properties
│   ├── static/
│   └── templates/
└── pom.xml
```

## Error Handling

Tất cả endpoints trả về response format chung:
```json
{
  "success": true/false,
  "message": "success message or error description",
  "data": {},
  "statusCode": 200
}
```

## Database Schema

### Key Tables
- `users` - Người dùng (roles: USER, ADMIN, PROVIDER)
- `tours` - Tour du lịch
- `bookings` - Đặt tour
- `tour_reviews` - Đánh giá tour
- `tour_reports` - Báo cáo vi phạm
- `destinations` - Địa điểm du lịch
- `contact_messages` - Tin nhắn liên hệ
- `tour_feedbacks` - Phản hồi từ admin
- `tour_itineraries` - Chi tiết lịch trình tour

## Development

### Running Tests
```bash
mvn test
```

### Building JAR
```bash
mvn clean package
```

### Docker Deployment
```bash
docker build -t thichdulich-api .
docker run -p 8080:8080 thichdulich-api
```

## Future Enhancements

- [ ] Payment Gateway Integration
- [ ] Email Notification System
- [ ] Advanced Search & Filtering
- [ ] AI Recommendation Engine
- [ ] Mobile App API
- [ ] Real-time Chat
- [ ] Analytics Dashboard

## Support

Liên hệ: support@thichdulich.com

## License

MIT License
