# API Testing Guide

## Sample API Requests

### 1. Authentication

#### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "0123456789",
    "role": "user"
  }'
```

#### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGc...",
    "type": "Bearer",
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  },
  "statusCode": 200
}
```

---

### 2. Tours

#### Get All Tours
```bash
curl -X GET http://localhost:8080/api/tours
```

#### Get Tour by ID
```bash
curl -X GET http://localhost:8080/api/tours/{tourId}
```

#### Get Tours by Type
```bash
curl -X GET "http://localhost:8080/api/tours/type/beach"
```

#### Get Tours by Location
```bash
curl -X GET "http://localhost:8080/api/tours/location/Hanoi"
```

#### Get Trending Tours
```bash
curl -X GET http://localhost:8080/api/tours/trending
```

#### Create Tour (Provider Only)
```bash
curl -X POST http://localhost:8080/api/tours \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Halong Bay 3 Days",
    "description": "Explore the beautiful Halong Bay",
    "location": "Quang Ninh",
    "type": "nature",
    "duration": 3,
    "price": 299.99,
    "image": "https://example.com/halong.jpg",
    "availability": true,
    "included": ["Hotel", "Meals", "Transport"]
  }'
```

#### Update Tour
```bash
curl -X PUT http://localhost:8080/api/tours/{tourId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Tour Name",
    "price": 349.99
  }'
```

#### Delete Tour
```bash
curl -X DELETE http://localhost:8080/api/tours/{tourId} \
  -H "Authorization: Bearer {token}"
```

---

### 3. Bookings

#### Create Booking
```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tourId": "{tourId}",
    "startDate": "2026-06-15",
    "endDate": "2026-06-18",
    "adults": 2,
    "children": 1,
    "contactName": "John Doe",
    "contactEmail": "john@example.com",
    "contactPhone": "0123456789",
    "paymentMethod": "card",
    "specialRequests": "Need vegetarian meals"
  }'
```

#### Get My Bookings
```bash
curl -X GET http://localhost:8080/api/bookings/my-bookings \
  -H "Authorization: Bearer {token}"
```

#### Get Booking by ID
```bash
curl -X GET http://localhost:8080/api/bookings/{bookingId} \
  -H "Authorization: Bearer {token}"
```

#### Update Booking Status
```bash
curl -X PUT "http://localhost:8080/api/bookings/{bookingId}/status/confirmed" \
  -H "Authorization: Bearer {token}"
```

#### Cancel Booking
```bash
curl -X POST http://localhost:8080/api/bookings/{bookingId}/cancel \
  -H "Authorization: Bearer {token}"
```

---

### 4. Reviews

#### Create Review
```bash
curl -X POST http://localhost:8080/api/reviews \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tourId": "{tourId}",
    "rating": 5,
    "comment": "Amazing experience! Highly recommended.",
    "images": []
  }'
```

#### Get Tour Reviews
```bash
curl -X GET http://localhost:8080/api/reviews/tour/{tourId}
```

#### Update Review
```bash
curl -X PUT http://localhost:8080/api/reviews/{reviewId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "comment": "Updated comment"
  }'
```

#### Delete Review
```bash
curl -X DELETE http://localhost:8080/api/reviews/{reviewId} \
  -H "Authorization: Bearer {token}"
```

#### Add Provider Response
```bash
curl -X POST "http://localhost:8080/api/reviews/{reviewId}/response?response=Thank%20you%20for%20your%20feedback" \
  -H "Authorization: Bearer {token}"
```

---

### 5. User Profile

#### Get Profile
```bash
curl -X GET http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer {token}"
```

#### Update Profile
```bash
curl -X PUT http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "phone": "0987654321",
    "avatar": "https://example.com/avatar.jpg"
  }'
```

#### Change Password
```bash
curl -X POST "http://localhost:8080/api/users/change-password?oldPassword=password123&newPassword=newpassword123" \
  -H "Authorization: Bearer {token}"
```

---

### 6. Destinations

#### Get All Destinations
```bash
curl -X GET http://localhost:8080/api/destinations
```

#### Get Destination by ID
```bash
curl -X GET http://localhost:8080/api/destinations/{destinationId}
```

#### Search Destinations
```bash
curl -X GET "http://localhost:8080/api/destinations/search?keyword=Hanoi"
```

#### Get Destinations by Region
```bash
curl -X GET "http://localhost:8080/api/destinations/region/North"
```

---

### 7. Contact Messages

#### Send Message
```bash
curl -X POST http://localhost:8080/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Name",
    "email": "customer@example.com",
    "phone": "0123456789",
    "subject": "Support Request",
    "message": "I need help with my booking"
  }'
```

#### Get New Messages (Admin Only)
```bash
curl -X GET http://localhost:8080/api/contact/new \
  -H "Authorization: Bearer {admin-token}"
```

#### Reply to Message
```bash
curl -X POST "http://localhost:8080/api/contact/{messageId}/reply?reply=We%20will%20help%20you&repliedBy=Admin" \
  -H "Authorization: Bearer {admin-token}"
```

---

### 8. Admin Operations

#### Get Pending Tours
```bash
curl -X GET http://localhost:8080/api/admin/tours/pending \
  -H "Authorization: Bearer {admin-token}"
```

#### Approve Tour
```bash
curl -X POST "http://localhost:8080/api/admin/tours/{tourId}/approve?notes=Approved" \
  -H "Authorization: Bearer {admin-token}"
```

#### Reject Tour
```bash
curl -X POST "http://localhost:8080/api/admin/tours/{tourId}/reject?reason=Price%20too%20high&notes=Please%20review" \
  -H "Authorization: Bearer {admin-token}"
```

#### Request Tour Edit
```bash
curl -X POST "http://localhost:8080/api/admin/tours/{tourId}/request-edit?notes=Please%20fix%20images" \
  -H "Authorization: Bearer {admin-token}"
```

---

### 9. Reports

#### Create Report
```bash
curl -X POST http://localhost:8080/api/reports \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tourId": "{tourId}",
    "reason": "Inappropriate content",
    "description": "Tour description contains offensive language"
  }'
```

#### Get Pending Reports (Admin)
```bash
curl -X GET http://localhost:8080/api/admin/reports/pending \
  -H "Authorization: Bearer {admin-token}"
```

#### Resolve Report
```bash
curl -X POST "http://localhost:8080/api/admin/reports/{reportId}/resolve?note=Tour%20updated" \
  -H "Authorization: Bearer {admin-token}"
```

---

## Common Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "statusCode": 200
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "statusCode": 400
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200  | OK |
| 201  | Created |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 500  | Internal Server Error |

## Testing with Postman

1. Import the collection: `postman_collection.json`
2. Set environment variables:
   - `base_url`: http://localhost:8080
   - `token`: <Your JWT Token>
   - `userId`: <Your User ID>
   - `tourId`: <Tour ID>

3. Run requests from the collection

## Notes

- All dates should be in format: `YYYY-MM-DD`
- Timestamps should be in format: `YYYY-MM-DDTHH:mm:ss`
- JWT tokens expire in 24 hours (86400000 ms)
- Authentication required endpoints need Bearer token in Authorization header
