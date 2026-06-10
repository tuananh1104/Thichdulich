# Backend Schema Migration Guide

## 📋 Overview

Your backend has been updated to match the new database schema with the following key changes:

---

## 🔄 Major Changes

### 1. **Entity Classes Updated**

#### User Entity
- Changed `name` → `fullName` (VARCHAR 100)
- Changed `password` → `passwordHash`
- Added `status` enum (ACTIVE, BANNED)
- Removed `active` boolean and `updated_at` timestamp
- Kept `created_at` timestamp only

```java
public enum UserStatus {
    ACTIVE, BANNED
}
```

#### Destination Entity
- Changed `name` from string to **JSON** {vi, en}
- Changed `description` from string to **JSON** {vi, en}
- Removed `country` field
- Changed `region` to **ENUM** (BAC, TRUNG, NAM)
- Removed `updated_at` timestamp

#### Tour Entity
- Added `destination_id` FK
- Changed `name` → **JSON** {vi, en}
- Changed `description` → **JSON** {vi, en}
- Changed `type` → **ENUM** (ADVENTURE, BEACH, CULTURAL, FOOD, NATURE, MOUNTAIN, CITY)
- Changed `price` → **BIGINT** (VND instead of DECIMAL)
- Added `slots` (total) and `available_slots` (remaining)
- Removed `location` and `included_services` (merged into `images` and `included`)
- Added `images` → **JSON** (string array)
- Added `included` → **JSON** (string array)
- Changed `reviewedBy` from String → **User reference**
- Status enum: PENDING, APPROVED, REJECTED, NEED_EDIT, UPDATED

#### Booking Entity
- Reordered fields: user_id first, tour_id second
- Changed `total_amount` → **BIGINT** (VND)
- Changed `payment_method` → **ENUM** (CARD, TRANSFER, VNPAY, MOMO)
- Added `payment_status` → **ENUM** (PENDING, PAID, REFUNDED)
- Removed `updated_at` timestamp
- Status: PENDING, CONFIRMED, CANCELLED, COMPLETED

#### TourReview Entity
- Added `booking_id` FK (to verify user took tour)
- Changed `images` from String → **JSON** (string array)
- Changed `provider_response` → **JSON** {message, created_at}
- Removed `response_date` field
- Removed `updated_at` timestamp

#### TourReport Entity
- Renamed `user_id` → `reported_by`
- Changed `reviewed_by` from String → **User reference**
- Added `admin_note` field
- Status: PENDING, REVIEWED, RESOLVED, DISMISSED
- Removed `updated_at` timestamp

#### TourItinerary Entity
- Changed `title` → **JSON** {vi, en}
- Changed `activities` → **JSON** {vi: string[], en: string[]}
- Removed `notes` field

#### TourFeedback Entity (Restructured)
- Now one-to-one with Tour
- Added `sender_id` FK (User)
- Added `sender_role` ENUM (ADMIN, PROVIDER)
- Added `message` TEXT field
- Each message is a separate row (not a thread)
- Removed `message_thread` JSON field

#### ContactMessage Entity
- Added `user_id` FK (nullable - for guests)
- Changed `replied_by` from String → **User reference**
- Added separate `reply_message` field
- Removed `updated_at` timestamp

### 2. **New Enums**

```java
// User
public enum UserRole { USER, PROVIDER, ADMIN }
public enum UserStatus { ACTIVE, BANNED }

// Destination
public enum Region { BAC, TRUNG, NAM }

// Tour
public enum TourType { ADVENTURE, BEACH, CULTURAL, FOOD, NATURE, MOUNTAIN, CITY }
public enum TourStatus { PENDING, APPROVED, REJECTED, NEED_EDIT, UPDATED }

// Booking
public enum BookingStatus { PENDING, CONFIRMED, CANCELLED, COMPLETED }
public enum PaymentMethod { CARD, TRANSFER, VNPAY, MOMO }
public enum PaymentStatus { PENDING, PAID, REFUNDED }

// TourReport
public enum ReportStatus { PENDING, REVIEWED, RESOLVED, DISMISSED }

// TourFeedback
public enum SenderRole { ADMIN, PROVIDER }

// ContactMessage
public enum MessageStatus { NEW, REPLIED, RESOLVED }
```

---

## 💾 Database Changes

### New JSON Columns

```sql
-- Multi-language support
destination.name JSON {vi, en}
destination.description JSON {vi, en}
tour.name JSON {vi, en}
tour.description JSON {vi, en}
tour.images JSON string[]
tour.included JSON string[]
tour_itinerary.title JSON {vi, en}
tour_itinerary.activities JSON {vi: string[], en: string[]}
tour_review.images JSON string[]
tour_review.provider_response JSON {message, created_at}
```

### New Columns

```sql
-- Tour management
tour.slots INT
tour.available_slots INT
tour.destination_id VARCHAR(36) FK

-- Booking
booking.payment_status ENUM

-- Contact
contact_messages.user_id VARCHAR(36) FK (nullable)

-- Feedback
tour_feedbacks.sender_id VARCHAR(36) FK
tour_feedbacks.sender_role ENUM
tour_feedbacks.message TEXT
```

### Modified Data Types

```sql
-- Prices in VND (Vietnamese Dong)
tour.price: DECIMAL → BIGINT
booking.total_amount: DECIMAL → BIGINT

-- User references instead of strings
tour.reviewed_by: String → VARCHAR(36) FK
tour_report.reviewed_by: String → VARCHAR(36) FK
contact_messages.replied_by: String → VARCHAR(36) FK

-- Enums instead of strings
tour.status: VARCHAR → ENUM
tour.type: VARCHAR → ENUM
booking.status: VARCHAR → ENUM
booking.payment_method: VARCHAR → ENUM
... and more
```

---

## 🔧 Migration Steps

### 1. **Backup Current Database** (if you have data)
```bash
mysqldump -u root -p thichdulich > backup_thichdulich.sql
```

### 2. **Drop Old Database** (Optional - if starting fresh)
```bash
mysql -u root -p -e "DROP DATABASE thichdulich;"
```

### 3. **Run New Schema**
```bash
mysql -u root -p < ../database/thichdulich.sql
```

### 4. **Update pom.xml**
Already done - Hypersistence-utils library added for JSON support

### 5. **Rebuild Project**
```bash
mvn clean install
```

---

## 📝 API Changes

### Data Format Changes

#### Multi-language Tours
```json
{
  "id": "...",
  "name": {
    "vi": "Tour Vịnh Hạ Long 3 Ngày",
    "en": "Halong Bay 3 Days Tour"
  },
  "description": {
    "vi": "Khám phá vịnh Hạ Long tuyệt đẹp",
    "en": "Explore beautiful Halong Bay"
  },
  "type": "NATURE",
  "price": 5999000,
  "slots": 20,
  "availableSlots": 20
}
```

#### Bookings with Payment Status
```json
{
  "id": "...",
  "tourId": "...",
  "userId": "...",
  "totalAmount": 5999000,
  "status": "CONFIRMED",
  "paymentMethod": "CARD",
  "paymentStatus": "PAID"
}
```

#### Reviews with Images Array
```json
{
  "id": "...",
  "tourId": "...",
  "rating": 5,
  "comment": "Great tour!",
  "images": ["url1", "url2"],
  "providerResponse": {
    "message": "Thank you for your feedback!",
    "created_at": "2024-05-14T10:00:00"
  }
}
```

---

## ⚠️ Breaking Changes

1. **User login/registration** now uses `fullName` instead of `name`
2. **Tour prices** are now in **BIGINT (VND)** - multiply frontend prices by 1000
3. **JSON fields** require special handling in frontend (objects instead of strings)
4. **Tour slots** must be specified (no more infinite availability)
5. **Payment status** added - must track payment separately from booking status
6. **Booking** cannot have `updated_at` - only created_at
7. **Contact messages** can be from unauthenticated users (user_id nullable)

---

## ✅ Testing Checklist

- [ ] Database created successfully
- [ ] All tables exist with correct structure
- [ ] Indexes created
- [ ] Sample data inserted
- [ ] Backend compiles: `mvn clean install`
- [ ] Application starts: `mvn spring-boot:run`
- [ ] Login works with new schema
- [ ] Tours display with multi-language support
- [ ] Bookings save with payment status
- [ ] Reviews show provider responses
- [ ] Admin can approve/reject tours
- [ ] Contact form works for guests

---

## 📞 Sample Data Login

```
Email: admin@demo.com
Password: admin123
Role: ADMIN

Email: provider@demo.com
Password: demo123
Role: PROVIDER

Email: user@demo.com
Password: demo123
Role: USER
```

---

## 📚 Related Files

- `../database/thichdulich.sql` - SQL schema used by the project
- Entity classes in `src/main/java/com/example/thichdulich/entity/`
- DTO classes in `src/main/java/com/example/thichdulich/dto/`
- pom.xml - Updated with Hypersistence-utils for JSON support

---

**Schema migration complete!** 🎉

Your backend is now ready with the new multi-language, payment, and slot management features.
