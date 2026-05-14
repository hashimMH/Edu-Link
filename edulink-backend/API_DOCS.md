# EduLink API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

## Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "EduLink API is running",
  "timestamp": "2026-05-05T21:05:00.668Z"
}
```

---

### Auth

#### Register

```
POST /auth/register
```

**Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | Yes | Valid email |
| password | string | Yes | Min 8 chars, 1 number, 1 special char |
| first_name | string | Yes | |
| last_name | string | Yes | |
| role | string | No | `"student"` or `"teacher"`. Default: `"student"` |
| interests | string[] | No | e.g. `["Arabic", "English", "Vocabulary"]` |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "uuid",
      "firstName": "Karim",
      "lastName": "Mohammed",
      "email": "user@example.com",
      "role": "student",
      "interests": ["Arabic", "English"]
    }
  }
}
```

**Errors:** `409` Email already registered

---

#### Login

```
POST /auth/login
```

**Body:**
| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |
| password | string | Yes |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "uuid",
      "firstName": "Karim",
      "lastName": "Mohammed",
      "email": "user@example.com",
      "role": "student",
      "interests": ["Arabic", "English"],
      "avatarUrl": null
    }
  }
}
```

**Errors:** `401` Invalid email or password

---

#### Google Sign-In

```
POST /auth/google
```

**Body:**
| Field | Type | Required |
|-------|------|----------|
| googleId | string | Yes |
| email | string | Yes |
| firstName | string | Yes |
| lastName | string | Yes |

**Response (200):** Same shape as login. Creates a new user if one doesn't exist for that Google ID or email.

---

#### Forgot Password

```
POST /auth/forgot-password
```

**Body:** `{ "email": "user@example.com" }`

**Response (200):**
```json
{ "success": true, "message": "If the email exists, a reset link has been sent" }
```

Always returns success to prevent email enumeration.

---

#### Reset Password

```
POST /auth/reset-password
```

**Body:**
| Field | Type | Required |
|-------|------|----------|
| token | string | Yes | Reset token |
| password | string | Yes | New password (min 8 chars, 1 number, 1 special) |

**Response (200):**
```json
{ "success": true, "message": "Password has been reset successfully" }
```

---

### Users

#### Get My Profile

```
GET /users/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Karim",
    "lastName": "Mohammed",
    "email": "user@example.com",
    "role": "student",
    "interests": ["Arabic", "English"],
    "avatarUrl": null,
    "country": null,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

#### Update Profile

```
PUT /users/me
Authorization: Bearer <token>
```

**Body (all optional):**
| Field | Type | Notes |
|-------|------|-------|
| firstName | string | |
| lastName | string | |
| email | string | Must be unique |
| password | string | Min 8 chars, 1 number, 1 special |
| interests | string[] | |
| country | string | |

**Response (200):** Updated user object (same shape as get profile).

**Errors:** `409` Email already in use

---

#### Get Tutors

```
GET /users/tutors
```

**Query Parameters (all optional):**
| Param | Type | Example | Notes |
|-------|------|---------|-------|
| search | string | `search=Karim` | Partial name match |
| country | string | `country=us` | Filter by country code |
| interest | string | `interest=English` | Filter by interest |
| available | string | `available=true` | Only available tutors |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Karim Mohammed",
      "rating": 4.5,
      "isPositive": true,
      "accent": "Australian Accent",
      "interests": ["Arabic", "English", "Mathematics"],
      "isAvailable": true,
      "country": "au",
      "description": "Experienced tutor...",
      "video": "https://youtu.be/...",
      "avatarUrl": null
    }
  ]
}
```

---

#### Get Tutor Names (simplified)

```
GET /users/tutors/names
Authorization: Bearer <token>
```

Returns a simple list of tutors — useful for recipient selection in chat.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Karim Mohammed",
      "avatarUrl": null
    }
  ]
}
```

---

#### Get Single Tutor

```
GET /users/tutors/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Karim Mohammed",
    "rating": 4.5,
    "accent": "Australian Accent",
    "interests": ["Arabic", "English"],
    "isAvailable": true,
    "country": "au",
    "description": "Experienced tutor...",
    "video": "https://youtu.be/...",
    "avatarUrl": null,
    "availability": [
      {
        "id": "uuid",
        "dayOfWeek": "MON",
        "startTime": "08:00",
        "endTime": "12:00",
        "isRecurring": true
      }
    ]
  }
}
```

**Errors:** `404` Tutor not found

---

### Subscriptions

#### Get All Subscription Plans

```
GET /subscriptions
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Stander",
      "price": 60,
      "lessons": 12,
      "duration": "28 hrs 40 mins"
    },
    {
      "id": "uuid",
      "title": "Premium",
      "price": 120,
      "lessons": 24,
      "duration": "56 hrs 20 mins"
    }
  ]
}
```

---

#### Get My Subscriptions

```
GET /subscriptions/my
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "active",
      "started_at": "2026-01-01T00:00:00.000Z",
      "expires_at": null,
      "title": "Stander",
      "price": 60,
      "lessons": 12,
      "duration": "28 hrs 40 mins"
    }
  ]
}
```

---

### Appointments

#### Get My Appointments

```
GET /appointments
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "date": "2024-06-11",
      "day": "MON",
      "time": "08:00 - 12:00",
      "status": "upcoming",
      "instructor": {
        "id": "uuid",
        "name": "Karim Mohammed",
        "role": "instructor",
        "avatar": null
      }
    }
  ]
}
```

---

#### Create Appointment

```
POST /appointments
Authorization: Bearer <token>
```

**Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| tutorId | string | Yes | Tutor UUID |
| date | string | Yes | `"YYYY-MM-DD"` |
| day | string | Yes | `"MON"`, `"TUE"`, etc. |
| startTime | string | Yes | `"HH:MM"` 24h format |
| endTime | string | Yes | `"HH:MM"` 24h format |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tutorId": "uuid",
    "day": "MON",
    "startTime": "09:00",
    "endTime": "11:00",
    "date": "2024-06-12",
    "status": "upcoming"
  }
}
```

**Errors:** `404` Tutor not found | `409` Time slot already booked

---

#### Cancel Appointment

```
DELETE /appointments/:id
Authorization: Bearer <token>
```

Only the student who created the appointment can cancel it.

**Response (200):**
```json
{ "success": true, "message": "Appointment cancelled" }
```

**Errors:** `404` Appointment not found

---

### Messages

#### Get Conversations

```
GET /messages
Authorization: Bearer <token>
```

Returns all conversations for the current user, each showing the other participant and the last message.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "chatId": "uuid",
      "name": "Karim Mohammed",
      "message": "Perfect, will check it",
      "time": "09:34 pm",
      "avatarPath": null
    }
  ]
}
```

---

#### Get Chat Messages

```
GET /messages/:chatId
Authorization: Bearer <token>
```

Automatically marks messages as read when fetched.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "text": "Hello! How are you?",
      "time": "08:04 pm",
      "sender": "You"
    },
    {
      "id": "uuid",
      "text": "I'm doing great, thanks!",
      "time": "08:05 pm",
      "sender": "other"
    }
  ]
}
```

`sender` is `"You"` for the current user, `"other"` for the recipient.

---

#### Send Message

```
POST /messages
Authorization: Bearer <token>
```

**Body:**
| Field | Type | Required |
|-------|------|----------|
| receiverId | string | Yes | Recipient user UUID |
| text | string | Yes | Message content |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "text": "Hello!",
    "time": "08:05 pm",
    "sender": "You"
  }
}
```

**Errors:** `404` Receiver not found

---

### Lessons

#### Get Lesson History

```
GET /lessons/history
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| sort | string | `"newest"` | `"newest"` or `"oldest"` |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Introduction",
      "duration": "6:10 mins",
      "description": "Lorem ipsum dolor sit amet...",
      "createdAt": "2025-02-04T20:30:00Z"
    }
  ]
}
```

---

### Payments

#### Get All Payments

```
GET /payments
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "Session",
      "amount": 28.10,
      "cardType": "MASTERCARD",
      "cardNumber": "****3241",
      "date": "12/12/21",
      "status": "completed"
    }
  ]
}
```

---

#### Get Payment Summary

```
GET /payments/summary
Authorization: Bearer <token>
```

Returns balance, income, pending totals plus the 4 most recent payments.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "balance": 50789,
    "income": 50789,
    "pending": 10102,
    "payments": [
      {
        "id": "uuid",
        "type": "Session",
        "amount": 28.10,
        "cardType": "MASTERCARD",
        "cardNumber": "****3241",
        "date": "12/12/21",
        "status": "completed"
      }
    ]
  }
}
```

---

### Notifications

#### Get Notifications

```
GET /notifications
Authorization: Bearer <token>
```

Returns up to 50 most recent notifications.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "purchase",
      "title": "Successful purchase!",
      "body": null,
      "time": "Just now",
      "isRead": false
    }
  ]
}
```

Notification types: `purchase`, `completion`, `reminder`, `message`, `system`.

Time is shown as relative: `"Just now"`, `"5 hours ago"`, `"2 days ago"`, or absolute for older.

---

#### Mark Notification as Read

```
PUT /notifications/:id/read
Authorization: Bearer <token>
```

**Response (200):**
```json
{ "success": true }
```

---

#### Mark All Notifications Read

```
PUT /notifications/read-all
Authorization: Bearer <token>
```

**Response (200):**
```json
{ "success": true }
```

---

### Reviews

#### Get Reviews for Teacher

```
GET /reviews/:teacherId
```

Returns all reviews for a specific teacher (public).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "student_name": "Karim Mohamed",
      "rating": 4.5,
      "date": "Mon, 11 June 2024",
      "time": "08:00 - 12:00",
      "comment": null
    }
  ]
}
```

---

#### Get My Reviews (Teacher)

```
GET /reviews
Authorization: Bearer <token>
```

Returns reviews for the authenticated teacher.

**Response (200):** Same shape as above.

---

### Teacher

All teacher endpoints require `Authorization: Bearer <token>` AND the user must have role `"teacher"`.

**Error for non-teachers:** `403` Insufficient permissions

---

#### Get Teacher Stats

```
GET /teacher/stats
Authorization: Bearer <token> (teacher only)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "currentStudents": 20,
    "bookedClasses": 20,
    "completedClasses": 20,
    "cancelledClasses": 20,
    "averageRating": 4.5
  }
}
```

---

#### Get Teacher Classes

```
GET /teacher/classes
Authorization: Bearer <token> (teacher only)
```

**Query Parameters (all optional):**
| Param | Type | Example | Notes |
|-------|------|---------|-------|
| status | string | `status=upcoming` | Filter by `upcoming`, `completed`, `cancelled`, or `All` |
| day | string | `day=MON` | Filter by first 3 chars of day |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "studentName": "Karim Mohammed",
      "studentImage": null,
      "date": "Mon, 11 June 2024",
      "time": "08:00 - 12:00",
      "duration": "4 hours",
      "status": "upcoming"
    }
  ]
}
```

---

#### Get Upcoming Class

```
GET /teacher/upcoming
Authorization: Bearer <token> (teacher only)
```

Returns the soonest upcoming class, or `null` if none.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "studentName": "Karim Mohammed",
    "studentImage": null,
    "dateTime": "Mon, 11 June 2024 08:00 - 12:00",
    "duration": "4 hours"
  }
}
```

---

#### Cancel Class

```
DELETE /teacher/classes/:id
Authorization: Bearer <token> (teacher only)
```

Only the teacher who owns the class can cancel it.

**Response (200):**
```json
{ "success": true, "message": "Class cancelled" }
```

**Errors:** `404` Class not found

---

#### Set Availability

```
POST /teacher/availability
Authorization: Bearer <token> (teacher only)
```

**Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| dayOfWeek | string | Yes | `"MON"` through `"SUN"` |
| startTime | string | Yes | `"HH:MM"` 24h format |
| endTime | string | Yes | `"HH:MM"` 24h format |
| isRecurring | boolean | No | Default: `false` |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "dayOfWeek": "MON",
    "startTime": "08:00",
    "endTime": "12:00",
    "isRecurring": true
  }
}
```

---

#### Get Availability

```
GET /teacher/availability
Authorization: Bearer <token> (teacher only)
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "dayOfWeek": "MON",
      "startTime": "08:00",
      "endTime": "12:00",
      "isRecurring": true
    }
  ]
}
```

---

## Error Format

All errors follow this structure:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

HTTP status codes used:
| Code | Meaning |
|------|---------|
| 400 | Validation error / bad request |
| 401 | Missing or invalid token |
| 403 | Insufficient role permissions |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, double booking) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Rate Limiting

- **General:** 100 requests per 15 minutes
- **Auth endpoints:** 20 requests per 15 minutes

Rate limit headers are included in responses (`RateLimit-*`).

---

## Seeded Test Data

The seed script creates:

| Resource | Count | Details |
|----------|-------|---------|
| Users | 4 | 1 student, 3 teachers |
| Tutors | 5 | Various accents/countries/interests |
| Subscriptions | 2 | Stander ($60) and Premium ($120) |
| Appointments | 3 | For the student with various tutors |
| Teacher Classes | 3 | Mixed statuses (upcoming, completed, cancelled) |
| Conversations | 3 | Between student and each teacher |
| Messages | 4 | Across 3 conversations |
| Lessons | 3 | Introduction, grammar, base language |
| Payments | 12 | Various card types and amounts for teacher1 |
| Reviews | 3 | 4.5-star reviews for teacher1 |
| Notifications | 8 | Mixed types and timestamps for student |

**Test Accounts:**

| Role | Email | Password |
|------|-------|----------|
| Student | `karimshebo15@gmail.com` | `password123!` |
| Teacher | `teacher1@edulink.com` | `password123!` |
| Teacher | `teacher2@edulink.com` | `password123!` |
| Teacher | `teacher3@edulink.com` | `password123!` |

---

## Setup Commands

```bash
# Install dependencies
cd edulink-backend && npm install

# Run migrations (creates database tables)
npm run migrate

# Seed with mock data
npm run seed

# Or do both at once
npm run setup

# Start the server
npm start        # Production
npm run dev      # Development with nodemon
```

---

## Environment Variables

See `.env.example` — copy to `.env` and modify:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment mode |
| DB_PATH | ./data/edulink.db | SQLite database file path |
| JWT_SECRET | (dev default) | Secret key for JWT signing |
| JWT_EXPIRES_IN | 7d | Token expiration duration |
| CORS_ORIGINS | localhost:8081,localhost:3000 | Allowed CORS origins (comma-separated) |
| RATE_LIMIT_WINDOW_MS | 900000 | Rate limit window in ms (15 min) |
| RATE_LIMIT_MAX | 100 | Max requests per window |
