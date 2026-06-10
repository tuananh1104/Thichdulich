# Quick Start Guide - Backend Setup

## 📋 Prerequisites

- **Java 17+** - [Download](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)
- **MySQL 8.0+** - [Download](https://dev.mysql.com/downloads/mysql/)
- **Maven 3.6+** - [Download](https://maven.apache.org/download.cgi)
- **Git** - [Download](https://git-scm.com/)

Verify installations:
```bash
java -version
mysql --version
mvn -version
git --version
```

---

## 🚀 Setup Instructions

### Step 1: Database Setup

**Windows (MySQL Command Line)**
```bash
mysql -u root -p

CREATE DATABASE thichdulich CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE thichdulich;
```

**Mac/Linux**
```bash
mysql -u root -p

CREATE DATABASE thichdulich CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE thichdulich;
```

### Step 2: Clone & Configure Backend

```bash
cd Backend
```

Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/thichdulich?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=<your-mysql-password>
```

### Step 3: Build Project

```bash
mvn clean install
```

If you get build errors, try:
```bash
mvn clean install -DskipTests
```

### Step 4: Run Application

**Option A: Using Maven**
```bash
mvn spring-boot:run
```

**Option B: Using IDE**
- Open `ThichdulichApplication.java` in your IDE
- Click "Run" button

**Option C: Using JAR**
```bash
mvn package
java -jar target/thichdulich-0.0.1-SNAPSHOT.jar
```

### Step 5: Verify Backend is Running

```bash
curl http://localhost:8080/api/tours
```

Or open in browser: `http://localhost:8080/api/tours`

You should see a JSON response with empty tours array (or sample data if initialized).

---

## 🧪 Testing the API

### Using cURL

**1. Register a new user**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "0987654321",
    "role": "user"
  }'
```

**2. Login**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the token from response.

**3. Get your profile**
```bash
curl -X GET http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Create new request
3. Set URL: `http://localhost:8080/api/auth/login`
4. Set Method: `POST`
5. Go to `Body` tab → `raw` → `JSON`
6. Paste:
```json
{
  "email": "user@demo.com",
  "password": "demo123"
}
```
7. Click `Send`

---

## 🔑 Default Accounts

If data initializer runs, these accounts are created:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | admin123 |
| Provider | provider@demo.com | demo123 |
| User | user@demo.com | demo123 |

---

## 📝 Common Issues & Solutions

### Issue 1: "Connection refused" - MySQL not running

**Solution:**
```bash
# Windows
net start MySQL80

# Mac
brew services start mysql@8.0

# Linux
sudo service mysql start
```

### Issue 2: "Access denied for user 'root'" - Wrong password

**Solution:** Update password in `application.properties`:
```properties
spring.datasource.password=YOUR_ACTUAL_PASSWORD
```

### Issue 3: "Port 8080 already in use"

**Solution:** Change port in `application.properties`:
```properties
server.port=8081
```

### Issue 4: Build fails with "Java version mismatch"

**Solution:** Ensure Java 17+ is active:
```bash
java -version  # Should show version 17 or higher
```

If not, set JAVA_HOME:
```bash
# Windows
set JAVA_HOME=C:\Program Files\Java\jdk-17

# Mac/Linux
export JAVA_HOME=/usr/libexec/java_home -v 17
```

### Issue 5: "Cannot find org.springframework" - Dependency issue

**Solution:**
```bash
mvn clean install -U
```

---

## 📂 Project Structure

```
Backend/
├── pom.xml                          # Maven configuration
├── src/
│   ├── main/
│   │   ├── java/com/example/thichdulich/
│   │   │   ├── ThichdulichApplication.java
│   │   │   ├── entity/              # Database models
│   │   │   ├── dto/                 # Data transfer objects
│   │   │   ├── repository/          # Data access layer
│   │   │   ├── service/             # Business logic
│   │   │   ├── controller/          # REST endpoints
│   │   │   ├── security/            # JWT & Auth
│   │   │   └── config/              # App configuration
│   │   ├── resources/
│   │   │   ├── application.properties
│   │   │   ├── static/
│   │   │   └── templates/
│   └── test/                        # Unit tests
├── BACKEND_README.md                # Full documentation
└── API_TESTING_GUIDE.md             # API examples
```

---

## 🔄 Database Schema

Key tables created automatically:
- `users` - User accounts
- `tours` - Tour offerings
- `bookings` - Tour bookings
- `tour_reviews` - Customer reviews
- `tour_reports` - Report violations
- `destinations` - Tour destinations
- `contact_messages` - Contact forms
- `tour_itineraries` - Tour schedules
- `tour_feedbacks` - Admin feedback

---

## 🚦 Health Check

Check API status:

```bash
# Get all tours (public endpoint, no auth needed)
curl http://localhost:8080/api/tours

# Get all destinations
curl http://localhost:8080/api/destinations
```

Both should return JSON with status 200.

---

## 📚 Next Steps

1. **Connect Frontend**: Update frontend API URL to `http://localhost:8080`
2. **Test Endpoints**: Use Postman collection (`API_TESTING_GUIDE.md`)
3. **Add Data**: Create tours, bookings, reviews via API
4. **Deploy**: Build JAR and deploy to server

---

## 🆘 Need Help?

- Check `BACKEND_README.md` for detailed documentation
- Review `API_TESTING_GUIDE.md` for API examples
- Check application logs: `src/main/resources/application.properties` (logging section)

---

## ✅ Verification Checklist

- [ ] Java 17+ installed
- [ ] MySQL running
- [ ] Database `thichdulich` created
- [ ] `application.properties` configured
- [ ] Project built successfully: `mvn clean install`
- [ ] Application started: `mvn spring-boot:run`
- [ ] Can access: `http://localhost:8080/api/tours`
- [ ] Sample data loaded
- [ ] Can login with demo accounts

---

**Happy coding! 🎉**
