# 🎯 HƯỚNG DẪN SỬ DỤNG WEBSITE VIETNAMTRAVEL

## 📍 BẠN ĐANG Ở ĐÂU TRONG WEBSITE?

### 🏠 **TRANG CHỦ (Chưa Đăng Nhập)**

Khi bạn mở website lần đầu, bạn sẽ thấy:
- HEADER - Thanh menu trên cùng (màu xanh dương)
- Logo | Home | Tours | About | Contact | [Đăng Ký] [Đăng Nhập] [VI]
- HERO SLIDER - Ảnh lớn tự động chuyển
- Advanced Search Box - Tìm tour
- Dịch vụ - 5 cards icon
- Tours được đề xuất - 6 cards
- Ưu đãi hot - Banner
- Tour hot nhất - 8 cards
- Điểm đến phổ biến - 4 cards
- Cẩm nang du lịch - 3 blog posts
- Khách hàng nói gì - 3 reviews
- Thống kê & Trust badges
- Footer

---

## 🔑 CÁCH ĐĂNG KÝ & ĐĂNG NHẬP

### **Bước 1: Nhấn nút "Đăng Ký" ở góc trên phải**

Điền form:
- Họ và tên
- Email
- Mật khẩu
- Xác nhận mật khẩu
- Vai trò: User hoặc Provider
- Đồng ý điều khoản

### **Bước 2: Sau khi đăng ký, nhấn "Đăng Nhập"**

**Tài khoản demo để test:**
```
USER:
Email: user@example.com
Password: password

PROVIDER:
Email: provider@example.com
Password: password

ADMIN:
Email: admin@example.com
Password: password
```

---

## ✅ SAU KHI ĐĂNG NHẬP THÀNH CÔNG

### **Header sẽ thay đổi:**
- Logo | Home | Tours | My Bookings | [👤 Avatar ▼]

### **Menu Avatar:**
- Profile
- My Bookings
- Provider Dashboard
- Logout

### **Trang chủ vẫn giống, NHƯNG:**
- ✅ Có thể đặt tour ngay (không cần đăng nhập lại)
- ✅ Menu "My Bookings" xuất hiện
- ✅ Có avatar ở góc phải
- ✅ Click vào tour → Có nút "Đặt Tour Ngay"

---

## 📍 CÁC TRANG BẠN CÓ THỂ TRUY CẬP

### **1. Trang Chủ - `/`**
- Click logo hoặc "Home" → về trang chủ

### **2. Danh Sách Tour - `/tours`**
- Click "Tours" trên menu
- Xem tất cả tours
- Tìm kiếm, filter, sort

### **3. Chi Tiết Tour - `/tours/:id`**
- Click vào bất kỳ tour card nào
- Xem chi tiết: hình ảnh, mô tả, giá, lịch trình
- Nút "Đặt Tour" (nếu đã đăng nhập)

### **4. Đặt Tour - `/booking/:id`**
- Sau khi nhấn "Đặt Tour"
- Chọn ngày đi, số người
- Điền thông tin liên hệ
- Xác nhận & thanh toán

### **5. My Bookings - `/my-bookings`**
- Click "My Bookings" trên menu
- Xem danh sách tour đã đặt
- Trạng thái: Pending / Confirmed / Cancelled

### **6. Profile - `/profile`**
- Click avatar → chọn "Profile"
- Xem/sửa thông tin cá nhân
- Đổi avatar
- Đổi mật khẩu

---

## 🏢 NẾU BẠN LÀ PROVIDER

### **Provider Dashboard - `/provider`**
- 📊 Stats: Tours, Bookings, Revenue
- 📈 Biểu đồ doanh thu theo tháng
- 📋 Quản lý tours của tôi
- 📋 Quản lý đơn đặt

---

## 👨‍💼 NẾU BẠN LÀ ADMIN

### **Admin Dashboard - `/admin`**
- 📊 Overview: Users, Providers, Tours, Revenue
- 📋 Duyệt tours (Approve/Reject/Request Edit)
- 📋 Quản lý users
- 📋 Quản lý providers
- 📋 Báo cáo vi phạm
- 📧 Hỗ trợ khách hàng
- 📊 Phân tích analytics

---

## 🎯 CÁCH SỬ DỤNG CÁC TÍNH NĂNG

### **1. Tìm kiếm Tour**

**Cách 1: Dùng Search Box ở Hero Slider**
- Chọn tab: Tour / Hotel / Combo
- Nhập điểm đến: "Phú Quốc"
- Chọn ngày đi, số ngày, số người
- Click [🔍] → Trang Tours với kết quả

**Cách 2: Click Quick Filter**
- Nhấn vào "Vịnh Hạ Long" / "Phú Quốc" / etc.
- Tự động search

**Cách 3: Click Destination Card**
- Nhấn vào card "Hạ Long" / "Sapa"
- Xem tất cả tours tại điểm đó

### **2. Xem Chi Tiết Tour**
- Click vào bất kỳ tour card nào
- Xem: Hình ảnh, mô tả, giá, lịch trình, đánh giá, hướng dẫn viên

### **3. Đặt Tour**
- Đăng nhập (nếu chưa)
- Vào chi tiết tour
- Click [Đặt Tour Ngay]
- Điền form: Ngày khởi hành, số người, thông tin liên hệ
- Click [Xác Nhận Đặt Tour]

### **4. Quản Lý Đơn Đặt**
- Click "My Bookings"
- Xem danh sách: Pending / Confirmed / Cancelled

### **5. Đổi Ngôn Ngữ**
- Click [VI ▼] ở góc phải header
- Chọn: Tiếng Việt / English

---

## 🔍 CÁCH ĐIỀU HƯỚNG (NAVIGATION)

### **Từ Trang Chủ:**
```
[Logo] → Về trang chủ
[Home] → Về trang chủ
[Tours] → Danh sách tours
[About] → Giới thiệu
[Contact] → Liên hệ
[Avatar ▼] → Menu user
```

### **Từ Danh Sách Tour:**
```
[Tour Card] → Chi tiết tour
[Search] → Tìm kiếm
[Filter] → Lọc theo giá, đánh giá
[Sort] → Sắp xếp
```

### **Từ Chi Tiết Tour:**
```
[< Back] → Quay lại danh sách
[Đặt Tour] → Trang booking
[Tours liên quan] → Tours tương tự
```

---

## ❓ CÂU HỎI THƯỜNG GẶP

### **Q: Tôi không thấy trang chủ?**
A: Kiểm tra:
1. Đã chạy `npm install` chưa?
2. Đã chạy `npm run dev` chưa?
3. Mở trình duyệt: http://localhost:5173

### **Q: Không thấy nút Đăng Ký/Đăng Nhập?**
A: Nút nằm ở góc trên phải của header. Nếu đã đăng nhập → Sẽ thấy Avatar thay vì nút

### **Q: Sau khi đăng nhập, trang chủ có gì khác?**
A:
- Header: Avatar thay vì nút Đăng Nhập
- Menu: Thêm "My Bookings"
- Tours: Có thể đặt ngay không cần login lại

### **Q: Làm sao biết mình đã đăng nhập?**
A: Thấy avatar ở góc phải. Click avatar → Có menu: Profile, Logout

### **Q: Provider Dashboard ở đâu?**
A: Đăng nhập với tài khoản Provider → Click avatar → Chọn "Provider Dashboard"

### **Q: Admin Dashboard ở đâu?**
A: Đăng nhập với tài khoản Admin → Click avatar → Chọn "Admin Dashboard"

---

## 🎨 THIẾT KẾ & UX

### **Màu Sắc:**
- 🔵 Xanh dương (#1E88E5) - Primary
- 🟠 Cam (#FF6B35) - Accent
- ⚪ Trắng - Background
- ⚫ Đen/Xám - Text

### **Animations:**
- Fade-in: Hiệu ứng mờ dần khi load
- Slide-up: Trượt lên từ dưới
- Hover: Scale to 110%, shadow tăng
- Transition: 300ms smooth

### **Responsive:**
- 📱 Mobile: < 768px (1 column)
- 📱 Tablet: 768-1024px (2 columns)
- 💻 Desktop: > 1024px (3-4 columns)

---

**Chúc bạn trải nghiệm website vui vẻ! 🎉**
