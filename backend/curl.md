# Work Log API - cURL Requests

All requests assume your backend is running on `http://localhost:5000`.  
Replace `<YOUR_JWT_TOKEN>` with the token received from login/signup.

---

## 1️⃣ Signup

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Amaan",
    "email": "amaan@test.com",
    "password": "Password123"
  }'
```

## 2️⃣ Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "amaan@test.com",
    "password": "Password123"
  }'
```

## 3️⃣ Add or Update Work Log

```bash
curl -X POST http://localhost:5000/api/worklogs \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
-d '{
  "date": "2025-01-17",
  "content": "Completed task A"
}'
```

## 4️⃣ Get All Logs

```bash
curl -X GET http://localhost:5000/api/worklogs \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

## 5️⃣ Get Logs by Specific Date

```bash
curl -X GET http://localhost:5000/api/worklogs/date/2025-01-17 \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

## 6️⃣ Get Logs by Date Range

```bash
curl -X GET "http://localhost:5000/api/worklogs/range?start=2025-01-01&end=2025-01-31" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

## 7️⃣ Get Excel Sheet

#### All-time Excel:

```bash
curl -X GET http://localhost:5000/api/worklogs/summary \ -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \ --output worklog_summary.xlsx
```

#### Summary for a date range:

```bash
curl -X GET "http://localhost:5000/api/worklogs/summary?start=2025-01-01&end=2025-01-31" \ -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \ --output worklog_summary.xlsx
```


## 8️⃣ Get AI Summary

```bash
curl -X GET "http://localhost:5000/api/worklogs/ai-summary?start=2025-01-01&end=2025-01-31" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

## 9️⃣ Update Task Content

```bash
curl -X PUT http://localhost:5000/api/worklogs/task/<LOG_ID>/<TASK_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "content": "Updated task content"
  }'
```

## Notes
All /api/worklogs routes require the Authorization header:

```bash
Authorization: Bearer <YOUR_JWT_TOKEN>
```

All POST requests require:

```bash
Content-Type: application/json
```

Dates must be in YYYY-MM-DD format.
The addOrUpdateLog route will update an existing log if a log for the same date already exists, otherwise it creates a new one.