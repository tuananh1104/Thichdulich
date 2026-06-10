# 🚪 CÁCH ĐĂNG XUẤT KHỎI WEBSITE

## 📱 **TRÊN DESKTOP (Màn hình lớn)**

### **Bước 1: Tìm Avatar**
```
Góc trên bên phải màn hình → Bạn sẽ thấy:

┌────────────────────────────────────┐
│ [VI ▼] [👤 Avatar] [Tên của bạn]  │
└────────────────────────────────────┘
        ↑
   CLICK VÀO ĐÂY!
```

### **Bước 2: Click vào Avatar**
Một menu dropdown sẽ xuất hiện:

```
┌─────────────────────────┐
│ Nguyễn Văn A           │
│ user@example.com       │
├─────────────────────────┤
│ 👤 My Profile          │
│ 📋 My Bookings         │
├─────────────────────────┤
│ 🚪 Logout              │ ← CLICK ĐÂY!
└─────────────────────────┘
```

### **Bước 3: Click "Logout"**
- Bạn sẽ tự động đăng xuất
- Quay về trang chủ
- Header sẽ hiển thị lại nút "Đăng Nhập" và "Đăng Ký"

---

## 📱 **TRÊN MOBILE (Màn hình nhỏ)**

### **Bước 1: Mở Menu**
```
Góc trên bên phải → Click vào icon ☰ (3 gạch ngang)

┌────────────────────────────┐
│ [Logo] .............. [☰]  │ ← CLICK ĐÂY!
└────────────────────────────┘
```

### **Bước 2: Menu mở ra**
```
┌────────────────────────────┐
│ Home                       │
│ Tours                      │
│ About                      │
│ Contact                    │
│ My Bookings                │
│ My Profile                 │
├────────────────────────────┤
│ 🚪 Logout                  │ ← CLICK ĐÂY!
└────────────────────────────┘
```

### **Bước 3: Click "Logout"**
- Đăng xuất thành công!

---

## ❓ **KHÔNG THẤY AVATAR / LOGOUT?**

### **Kiểm tra:**

#### 1. **Bạn đã đăng nhập chưa?**
- Nếu CHƯA → Không có Avatar, chỉ thấy nút "Đăng Nhập"
- Nếu ĐÃ → Có Avatar tròn màu cam

#### 2. **Kiểm tra góc phải header:**
```
CHƯA ĐĂNG NHẬP:
[VI ▼] [Đăng Ký] [Đăng Nhập]

ĐÃ ĐĂNG NHẬP:
[VI ▼] [👤 Avatar]
```

#### 3. **Avatar ở đâu?**
- Desktop: Góc trên phải, bên cạnh nút chọn ngôn ngữ (VI/EN)
- Mobile: Mở menu ☰ → Scroll xuống cuối

---

## 🔧 **NẾU DROPDOWN KHÔNG HOẠT ĐỘNG**

### **Cách 1: Dùng Mobile Menu (Desktop cũng được)**

Ngay cả trên desktop, bạn có thể:
1. Thu nhỏ cửa sổ trình duyệt (Ctrl + - hoặc Cmd + -)
2. Khi màn hình nhỏ → Xuất hiện menu ☰
3. Click ☰ → Scroll xuống → Thấy nút Logout đỏ

### **Cách 2: Logout thủ công**

1. Mở Browser Console (F12)
2. Gõ lệnh:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```
3. Refresh trang → Đăng xuất thành công!

### **Cách 3: Truy cập trực tiếp**

Gõ vào thanh URL:
```
http://localhost:5173/login
```
Rồi đăng nhập lại.

---

## 🎯 **VIDEO HƯỚNG DẪN (MÔ TẢ)**

```
1. Mở website: http://localhost:5173
2. Đăng nhập (nếu chưa):
   - Email: user@example.com
   - Password: password
3. Sau khi đăng nhập thấy Avatar góc phải
4. Click vào Avatar (vòng tròn màu cam với icon người)
5. Menu dropdown xuất hiện
6. Click "Logout" (màu đỏ, có icon cửa)
7. Xong!
```

---

## 📸 **GỬI CHO TÔI NẾU VẪN KHÔNG ĐƯỢC:**

1. Screenshot toàn màn hình (Ctrl + PrtScr)
2. Screenshot Browser Console (F12)
3. Cho tôi biết:
   - Đã đăng nhập chưa? (Có thấy tên hiển thị không?)
   - Click vào Avatar có gì xảy ra không?
   - Có báo lỗi trong console không?

Tôi sẽ sửa ngay! 🔧
