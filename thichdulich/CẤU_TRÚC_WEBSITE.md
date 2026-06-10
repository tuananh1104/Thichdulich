# 🗺️ CẤU TRÚC WEBSITE VIETNAMTRAVEL - VISUAL MAP

## 📱 TOÀN BỘ WEBSITE CÓ GÌ?

```
                    VIETNAMTRAVEL WEBSITE
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   PUBLIC PAGES      AUTH PAGES         PROTECTED PAGES
   (Ai cũng xem)     (Đăng ký/nhập)    (Phải đăng nhập)
        │                   │                   │
        ├─ Homepage          ├─ Login           ├─ My Bookings
        ├─ Tours            └─ Register         ├─ Profile
        ├─ Tour Detail                          ├─ Booking
        ├─ About                                ├─ Provider Dashboard
        └─ Contact                              └─ Admin Dashboard
```

---

## 🏠 1. TRANG CHỦ - HOMEPAGE (/)

**🎬 HERO SLIDER** - Ảnh nền tự động chuyển mỗi 6 giây với 11 sections

**📋 DỊCH VỤ CỦA CHÚNG TÔI** - 5 cards icon với hover effects

**⭐ TOUR ĐƯỢC ĐỀ XUẤT** - 6 tour cards grid 3 columns

**🔥 ƯU ĐÃI HOT TRONG TUẦN** - Banner 2 columns (ảnh + nội dung)

**🏆 TOUR HOT NHẤT** - 8 cards grid 4 columns với badges (HOT/Best/Sale)

**📍 ĐIỂM ĐÉN PHỔ BIẾN** - 4 destination cards to (h-96)

**📰 CẨM NANG DU LỊCH** - 3 blog posts

**💬 KHÁCH HÀNG NÓI GÌ** - 3 review cards

**📊 THỐNG KÊ** - 4 KPI stats

**🛡️ TRUST BADGES** - 4 huy hiệu

**🎯 CTA** - Call to action buttons

---

## 🔐 2. TRANG ĐĂNG NHẬP - LOGIN (/login)

Form đơn giản với:
- 📧 Email input
- 🔒 Password input
- ☑ Remember me checkbox
- Link "Forgot password"
- Link "Register"

---

## 📝 3. TRANG ĐĂNG KÝ - REGISTER (/register)

Form đầy đủ với:
- 👤 Full name
- 📧 Email
- 🔒 Password
- 🔒 Confirm password
- Role selection (User / Provider)
- Terms & conditions checkbox

---

## ✅ 4. SAU KHI ĐĂNG NHẬP - HEADER THAY ĐỔI

TRƯỚC:
```
[Logo] Home Tours About Contact [Đăng Ký] [Đăng Nhập]
```

SAU:
```
[Logo] Home Tours My Bookings [👤 Avatar ▼]
```

Avatar dropdown menu:
- Profile
- My Bookings
- Provider Dashboard (nếu là provider)
- Admin Dashboard (nếu là admin)
- Logout

---

## 🎨 DESIGN TOKENS

### **Màu Sắc:**
- Primary: #1E88E5 (Xanh dương)
- Accent: #FF6B35 (Cam)
- Success: #4ECDC4
- Warning: #FFD166
- Error: #DC2626

### **Typography:**
- Font: Inter
- H1: 3rem bold
- H2: 2.25rem bold
- Body: 1rem normal

### **Spacing:**
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px

### **Border Radius:**
- sm: 6px, md: 8px, lg: 12px, xl: 16px, 2xl: 24px, 3xl: 32px

---

**🎉 Website đã SẴN SÀNG!**
