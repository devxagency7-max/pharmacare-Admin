# Tamenny Admin Dashboard — Backend API Reference

> **For the Backend Team:** This document describes exactly what the Admin Frontend (Dashboard) displays, what data fields it reads, and every API endpoint it calls. If an endpoint is missing or returns unexpected field names, the UI will silently show "N/A" or "0". Use this as your implementation checklist.

---

## 1. Project Overview

**Tamenny** is a healthcare/pharmacy platform that connects:

| Role | Description |
|---|---|
| **Patient** | End-users who request medications |
| **Pharmacist** | Licensed professionals who handle prescriptions |
| **Intern Pharmacist** | Pharmacist trainees/students |
| **Pharmacy** | Physical business entities with branches |

The **Admin Dashboard** is a web panel for platform administrators to manage all of the above, review applications, track analytics, send notifications, and audit activity.

---

## 2. Technical Setup

### 2.1 Base URL
All API calls go to:
```
/api/v1
```
Example: `GET /api/v1/admin/stats`

The `apiClient.js` prepends `/api/v1` to every endpoint automatically.

**Exception:** The File Review module uses a hardcoded separate base URL:
```
http://148.230.114.124:8080/api/admin/files
```

### 2.2 Authentication
Every request (except login) sends a **Firebase JWT token** in the Authorization header:
```
Authorization: Bearer <firebase_id_token>
```
- The token is stored in `localStorage` under the key `idToken`.
- If the server returns `401`, the frontend automatically redirects to `/login.html`.
- The frontend does **not** manage token refresh — Firebase handles that on the client side.

### 2.3 Standard Response Format
The frontend is written to handle two response shapes. **Please standardize on this one:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "totalCount": 150
  }
}
```
The frontend also falls back to checking:
- `response.data.items`
- `response.data`
- `response.items`
- `response` (root array)

For pagination counts it checks: `totalCount` → `total` → `recordsTotal` → `items.length`

### 2.4 Pagination
All list endpoints must support these query parameters:
```
?page=1&pageSize=20
```
Default page size used in the UI: **20** (pharmacies use 12).

---

## 3. Login Page

**File:** `login.html` / `js/pages/login.js`

The login page posts credentials. The frontend expects to receive a token it stores in `localStorage`.

> The actual login implementation calls Firebase Auth directly on the client. The backend needs to verify Firebase tokens on protected routes — no separate login endpoint is required from the backend **unless** you want admin-specific login logic.

---

## 4. Dashboard (Home Page)

**File:** `index.html` / `js/pages/dashboard.js`

### 4.1 What the UI Displays
- 5 stat cards: Total Patients, Pharmacists, Intern Pharmacists, Pharmacies, Orders
- Donut chart: Orders by status (Pending / Confirmed / Completed / Rejected)
- Line chart: Active Users per day (last 7 days)
- Table: Last 5 recent orders
- List: Top 5 performing pharmacies
- List: Top 5 most-requested medicines
- List: Last 5 recent system activity events

### 4.2 API Calls

#### `GET /admin/stats`
Returns platform-wide totals shown in the 5 stat cards.

**Expected Response:**
```json
{
  "data": {
    "totalPatients": 1240,
    "totalPharmacists": 87,
    "totalInterns": 34,
    "totalPharmacies": 56,
    "totalOrders": 3800
  }
}
```

---

#### `GET /admin/analytics/orders`
Powers the Orders Donut Chart and the total orders count.

**Expected Response:**
```json
{
  "data": {
    "ordersByStatus": {
      "Pending": 120,
      "Accepted": 300,
      "Completed": 980,
      "Rejected": 45
    },
    "ordersPerDay": [
      { "date": "2025-07-01", "value": 40 },
      { "date": "2025-07-02", "value": 55 }
    ]
  }
}
```
The frontend sums `ordersPerDay[].value` for the total count. If `ordersPerDay` is empty, it falls back to summing all values in `ordersByStatus`.

---

#### `GET /admin/analytics/users`
Powers the Active Users Line Chart.

**Expected Response:**
```json
{
  "data": {
    "totalUsers": 1500,
    "activeUsersPerDay": [
      { "date": "2025-07-10", "value": 200 },
      { "date": "2025-07-11", "value": 215 }
    ],
    "newUsersPerDay": [
      { "date": "2025-07-10", "value": 12 },
      { "date": "2025-07-11", "value": 9 }
    ]
  }
}
```

---

#### `GET /admin/analytics/top-pharmacies`
Shows the top performing pharmacies list.

**Expected Response:**
```json
{
  "data": [
    { "name": "Al Dawaa Pharmacy", "orderCount": 420 },
    { "name": "Care Plus",          "orderCount": 380 }
  ]
}
```
The UI reads: `name` or `pharmacyName`, and `orderCount` or `revenue` or `logs`.

---

#### `GET /admin/analytics/top-medicines`
Shows the most-requested medicines list.

**Expected Response:**
```json
{
  "data": [
    { "name": "Paracetamol", "soldCount": 800 },
    { "name": "Amoxicillin", "soldCount": 650 }
  ]
}
```
The UI reads: `name`, and `soldCount` or `quantity`.

---

#### `GET /admin/activity`
Powers the Recent Activity feed and Audit Logs page.

**Expected Response:**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "action": "Pharmacist Approved",
        "entityType": "Pharmacist",
        "entityId": "uuid",
        "adminName": "Admin",
        "actorType": "Admin",
        "description": "Pharmacist John Doe was approved.",
        "timestamp": "2025-07-15T10:30:00Z",
        "createdAt": "2025-07-15T10:30:00Z"
      }
    ],
    "totalCount": 340
  }
}
```

---

#### `GET /admin/orders?pageSize=10`
Fetches the last 10 orders for the Recent Orders table.

**Expected Response:** See Orders module (Section 8).

---

## 5. Patients Module

**File:** `pages/patients.html` / `js/pages/patients.js`

### 5.1 What the UI Displays
- Table with columns: Name/Email, Patient ID, Phone, Joined Date, Status, Actions
- Actions per row: View Profile | Suspend / Activate | Ban
- Modal: Full patient profile
- Search by name/email
- Status filter (Active / Suspended)
- Pagination

### 5.2 API Calls

#### `GET /admin/patients`
**Query Params:** `page`, `pageSize`, `search`, `status`

**Expected Response:**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "fullName": "Ahmed Hassan",
        "email": "ahmed@example.com",
        "phone": "+201001234567",
        "phoneNumber": "+201001234567",
        "status": "Active",
        "isActive": true,
        "roles": ["Patient"],
        "role": "Patient",
        "avatar": "https://...",
        "createdAt": "2025-01-15T08:00:00Z"
      }
    ],
    "totalCount": 1240
  }
}
```

**Field name fallbacks the UI tries:**
- Name: `fullName` → `name` → `displayName` → `userName` → email prefix
- Phone: `phone` → `phoneNumber`
- Status: `status` field OR `isActive` boolean (false = Suspended)
- Date: `createdAt` → `joinedDate`

---

#### `GET /admin/patients/:id`
Returns single patient profile for the details modal.

**Expected Response:** Same shape as one item from the list above.

---

#### `PUT /admin/patients/:id/status`
Updates patient status.

**Request Body:**
```json
{ "status": "Active" }
```

---

#### `DELETE /admin/patients/:id`
Deletes a patient account.

---

#### `PUT /admin/users/:id/suspend`
Suspends a user (patient, pharmacist, or intern).

**Request Body:** `{}` (empty)

---

#### `PUT /admin/users/:id/activate`
Reactivates a suspended user.

**Request Body:** `{}` (empty)

---

#### `PUT /admin/users/:id/ban`
Permanently bans a user from the platform.

**Request Body:** `{}` (empty)

---

## 6. Pharmacists Module

**File:** `pages/pharmacists.html` / `js/pages/pharmacists.js`

### 6.1 What the UI Displays
Two tabs:
1. **All Pharmacists** — List of all registered pharmacists
2. **Applications** — Pending applications waiting for approval (tab shows a count badge)

Table columns: Name/Email, Type/Specialization, License Number, Join Date, Status, Actions

Actions: View Profile | Approve / Reject (for pending) | Suspend / Activate | Ban

Profile Modal shows:
- Full name, username, email, phone, license number, status, max patients limit, join date
- "Update Limit" button to set max patients

### 6.2 API Calls

#### `GET /admin/pharmacists`
**Query Params:** `page`, `pageSize`, `search`, `status`

**Expected Response:**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "fullName": "Dr. Sara Ahmed",
        "userName": "sara_pharm",
        "email": "sara@example.com",
        "phone": "+201001234567",
        "phoneNumber": "+201001234567",
        "membershipNumber": "PHARM-001",
        "licenseNumber": "PHARM-001",
        "specialization": "Clinical Pharmacist",
        "roles": ["Pharmacist"],
        "status": "Active",
        "isActive": true,
        "maxPatients": 50,
        "maxPatientsLimit": 50,
        "createdAt": "2025-02-01T00:00:00Z"
      }
    ],
    "totalCount": 87
  }
}
```

---

#### `GET /admin/applications?type=Pharmacist`
Fetches pending pharmacist applications.

**Query Params:** `type=Pharmacist`, `page`, `pageSize`

**Expected Response:** Same shape as pharmacists list but with `status: "Pending"`.

---

#### `GET /admin/pharmacists/:id`
Single pharmacist profile for modal.

---

#### `POST /admin/pharmacist/:id/approve`
Approves a pharmacist application.

**Request Body:** `{}` (empty)

---

#### `POST /admin/pharmacist/:id/reject`
Rejects a pharmacist application.

**Request Body:**
```json
{ "reason": "Did not meet criteria." }
```

---

#### `PUT /admin/pharmacists/:id/max-patients`
Sets the maximum number of patients this pharmacist can handle.

**Request Body:**
```json
{ "maxPatients": 50 }
```

---

#### `DELETE /admin/pharmacists/:id`
Deletes a pharmacist account.

---

#### `PUT /admin/users/:id/suspend` / `PUT /admin/users/:id/activate` / `PUT /admin/users/:id/ban`
Same as Patients module (Section 5.2).

---

## 7. Intern Pharmacists Module

**File:** `pages/intern_pharmacists.html` / `js/pages/internPharmacists.js`

### 7.1 What the UI Displays
Same layout as Pharmacists — two tabs: All Interns & Applications.

### 7.2 API Calls

#### `GET /admin/interns`
**Query Params:** `page`, `pageSize`, `search`, `status`

**Expected Response:** Same shape as pharmacists.

---

#### `GET /admin/applications?type=Intern`
Pending intern applications.

---

#### `GET /admin/interns/:id`
Single intern profile.

---

#### `PUT /admin/interns/:id/approve`
**Request Body:** `{}` (empty)

---

#### `PUT /admin/interns/:id/reject`
**Request Body:** `{}` (empty)

---

#### `DELETE /admin/intern-pharmacists/:id`
Deletes an intern account.

---

#### `PUT /admin/users/:id/suspend` / `PUT /admin/users/:id/activate` / `PUT /admin/users/:id/ban`
Same as Patients module.

---

## 8. Pharmacies Module

**File:** `pages/pharmacies.html` / `js/pages/pharmacies.js`

### 8.1 What the UI Displays
- Table: Logo, Name/Email, License Number, Status, Actions
- Actions: View Details | Suspend / Activate
- Create Pharmacy modal (with logo upload)
- Details modal: Full pharmacy info including branches count
- Search and status filter

### 8.2 API Calls

#### `GET /admin/pharmacies`
**Query Params:** `page`, `pageSize`, `search`, `status`

**Expected Response:**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Al Dawaa Pharmacy",
        "email": "info@aldawaa.com",
        "phone": "+20100000000",
        "registrationNumber": "REG-001",
        "licenseNumber": "REG-001",
        "logoUrl": "https://...",
        "status": "Active",
        "governorate": "Cairo",
        "address": "123 Main St, Nasr City",
        "branchCount": 3,
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "totalCount": 56
  }
}
```

---

#### `GET /admin/pharmacies/:id`
Single pharmacy full details.

**Expected Response:** Same shape as one item from the list.

---

#### `POST /pharmacies`
Creates a new pharmacy. (Note: no `/admin/` prefix — this matches the non-admin endpoint.)

**Request Body:**
```json
{
  "name": "New Pharmacy",
  "email": "email@example.com",
  "phone": "+20100000000",
  "address": "123 Street",
  "governorate": "Cairo",
  "registrationNumber": "REG-999",
  "logoUrl": "https://cdn.example.com/logo.png"
}
```

---

#### `PUT /admin/pharmacies/:id/approve`
Approves / Reactivates a pharmacy.

**Request Body:** `{}` (empty)

---

#### `PUT /admin/pharmacies/:id/reject`
Rejects a pharmacy application.

**Request Body:** `{}` (empty)

---

#### `PUT /admin/pharmacies/:id/suspend`
Suspends a pharmacy (hides it from patients).

**Request Body:** `{}` (empty)

---

#### `GET /pharmacies/:id/branches`
Gets all branches for a specific pharmacy.

**Expected Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Branch Name",
      "address": "Branch Address",
      "phone": "+20100000000"
    }
  ]
}
```

---

#### `POST /files/upload`
Uploads a pharmacy logo. Returns a URL.

**Request:** `multipart/form-data` with field `file`

**Expected Response:**
```json
{ "url": "https://cdn.example.com/uploads/logo.png" }
```
The frontend also checks: `data.url` or `fileUrl`.

---

## 9. Orders Module

**File:** `pages/orders.html` / `js/pages/orders.js`

### 9.1 What the UI Displays
- 4 stat cards: Total Orders, Pending, In Progress (Accepted+Completed), Rejected
- Filter tabs: All | Pending | Accepted | Completed | Rejected
- Table: Order ID, Patient Name, Branch/Pharmacy, Date, Status, View button
- Order detail modal:
  - Order ID, status, date, payment status
  - Customer name, branch name, final price
  - List of ordered items (name, quantity, form, dosage, image)
  - Order timeline / status history

### 9.2 API Calls

#### `GET /admin/orders`
**Query Params:** `page`, `pageSize`, `search`, `status` (e.g. `status=Pending`)

**Expected Response:**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "orderStatus": "Pending",
        "status": "Pending",
        "customerName": "Ahmed Hassan",
        "patientName": "Ahmed Hassan",
        "branchName": "Al Dawaa - Nasr City",
        "pharmacyName": "Al Dawaa Pharmacy",
        "paymentStatus": "Paid",
        "finalPrice": 250.50,
        "createdAt": "2025-07-15T10:00:00Z",
        "items": [
          {
            "name": "Paracetamol",
            "quantity": 2,
            "form": "Tablet",
            "dosage": "500mg",
            "imageUrl": "https://..."
          }
        ],
        "statusHistory": [
          {
            "status": "Pending",
            "comments": "Order placed",
            "changedAt": "2025-07-15T10:00:00Z"
          }
        ]
      }
    ],
    "totalCount": 3800
  }
}
```

---

#### `GET /admin/orders/:id`
Single order full details for the modal. Returns same shape as one item above.

---

#### `GET /admin/analytics/orders`
Used for the 4 stat cards at the top of Orders page. Same response as Dashboard (Section 4.2).

---

## 10. Medications (Drugs) Module

**File:** `pages/medications.html` / `js/pages/medications.js`

### 10.1 What the UI Displays
- Table: Image, Drug Name/ID, Active Ingredient, Dosage & Form, Status (Active/Inactive), Actions
- Actions: Edit | Toggle Active/Inactive | Delete
- Add/Edit modal with fields: name, active ingredient, form, dosage, image URL, description, warnings, requiresPrescription, isControlled, isSensitive
- Import from Excel button
- Search by name
- Pagination

### 10.2 API Calls

#### `GET /admin/drugs`
**Query Params:** `page`, `pageSize`, `search`

**Expected Response:**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Paracetamol",
        "activeIngredient": "Acetaminophen",
        "form": "Tablet",
        "dosage": "500mg",
        "imageUrl": "https://...",
        "imageURL": "https://...",
        "description": "Pain reliever and fever reducer.",
        "warnings": "Do not exceed 4g/day.",
        "requiresPrescription": false,
        "isControlled": false,
        "isSensitive": false,
        "isActive": true,
        "synonyms": []
      }
    ],
    "totalCount": 500
  }
}
```

---

#### `POST /admin/drugs`
Creates a new drug.

**Request Body:**
```json
{
  "name": "Paracetamol",
  "activeIngredient": "Acetaminophen",
  "form": "Tablet",
  "dosage": "500mg",
  "imageUrl": "https://...",
  "description": "Pain reliever.",
  "warnings": "Do not exceed 4g/day.",
  "requiresPrescription": false,
  "isControlled": false,
  "isSensitive": false,
  "isActive": true,
  "synonyms": []
}
```

---

#### `PUT /admin/drugs/:id`
Updates an existing drug. Same body as POST.

---

#### `DELETE /admin/drugs/:id`
Deletes a drug permanently.

---

#### `PATCH /admin/drugs/:id/toggle`
Toggles `isActive` status (Active ↔ Inactive).

**Request Body:** `{}` (empty)

---

#### `POST /admin/drugs/import`
Imports a batch of drugs from an Excel (.xlsx) file.

**Request:** `multipart/form-data` with field `file`

---

#### `GET /admin/drugs/:id/synonyms`
Gets alternative names for a drug.

**Expected Response:**
```json
{
  "data": [
    { "id": "uuid", "name": "Tylenol" },
    { "id": "uuid", "name": "Adol" }
  ]
}
```

---

#### `POST /admin/drugs/:id/synonyms`
Adds a synonym to a drug.

**Request Body:**
```json
{ "name": "Tylenol" }
```

---

#### `DELETE /admin/drugs/:drugId/synonyms/:synId`
Removes a synonym.

---

## 11. Notifications Module

**File:** `pages/notifications.html` / `js/pages/notifications.js`

### 11.1 What the UI Displays
- Form to compose and send notifications:
  - Title, Message Body, Notification Type
  - Target: **Broadcast** (all users of a role) OR **Direct** (specific user by ID)
  - For Broadcast: select role (All / Patient / Pharmacist / Intern)
  - For Direct: enter User ID
- History table: Title, Type, Target (Role or UserID), Date, Status, Actions

### 11.2 API Calls

#### `GET /admin/notification-requests`
**Query Params:** `page`, `pageSize`

Loads notification history. If endpoint is not available, the frontend silently shows an empty table.

**Expected Response:**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "System Maintenance",
        "body": "Platform will be down Saturday night.",
        "type": "System",
        "role": "All",
        "userId": null,
        "status": "Delivered",
        "createdAt": "2025-07-15T08:00:00Z",
        "timestamp": "2025-07-15T08:00:00Z"
      }
    ],
    "totalCount": 45
  }
}
```

---

#### `POST /admin/notifications/broadcast`
Sends a notification to all users of a specific role.

**Request Body:**
```json
{
  "role": "Patient",
  "title": "System Update",
  "body": "New features are now available.",
  "type": "Announcement"
}
```
`role` can be: `"All"`, `"Patient"`, `"Pharmacist"`, `"Intern"`

---

#### `POST /admin/notifications/send`
Sends a direct notification to one specific user.

**Request Body:**
```json
{
  "userId": "firebase-uid-here",
  "title": "Account Alert",
  "body": "Your account has been reviewed.",
  "type": "Alert"
}
```

---

#### `PUT /admin/notification-requests/:id/approve`
Approves a notification request.

**Request Body:** `{}` (empty)

---

#### `PUT /admin/notification-requests/:id/reject`
Rejects a notification request.

**Request Body:**
```json
{ "reason": "Not appropriate." }
```

---

#### `DELETE /admin/notifications/:id`
Deletes a notification record.

---

## 12. File Review Module

**File:** `pages/file_review.html` / `js/pages/fileReview.js`

### 12.1 What the UI Displays
- Table of pending documents submitted by pharmacists for verification
- Each row: Document Type, Owner Name, Submission Date, Actions (View File / Approve / Reject)
- Clicking "View File" opens the file URL in a new tab
- Reject opens a modal to enter a reason

### 12.2 Base URL
This module uses a **different base URL** (not `/api/v1`):
```
http://148.230.114.124:8080/api/admin/files
```

### 12.3 API Calls

#### `GET /api/admin/files/pending`
Returns all files awaiting review.

**Expected Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "Pharmacy License",
      "ownerName": "Dr. Sara Ahmed",
      "url": "https://storage.example.com/file.pdf",
      "createdAt": "2025-07-10T00:00:00Z"
    }
  ]
}
```

---

#### `POST /api/admin/files/:fileId/approve`
Approves a submitted file.

**Request Body:** `{}` (empty)

---

#### `POST /api/admin/files/:fileId/reject`
Rejects a submitted file with a reason.

**Request Body:**
```json
{ "reason": "Document is not legible." }
```

---

## 13. Audit Logs Module

**File:** `pages/audit_logs.html` / `js/pages/auditLogs.js`

### 13.1 What the UI Displays
- 4 stat cards: Total Events, Unique Actors, Actions Today, Admin Actions
- Table: Timestamp, Admin Name, Action, Entity Type, Entity ID, Log ID, Details button
- Export to CSV button
- Pagination

### 13.2 API Calls

#### `GET /admin/activity`
**Query Params:** `page`, `pageSize`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "action": "Pharmacist Approved",
        "entityType": "Pharmacist",
        "entityId": "uuid",
        "adminName": "Super Admin",
        "actorType": "Admin",
        "description": "Pharmacist was approved by admin.",
        "timestamp": "2025-07-15T10:30:00Z",
        "createdAt": "2025-07-15T10:30:00Z"
      }
    ],
    "totalCount": 3400
  }
}
```
> **Note:** The frontend specifically checks `res.success && res.data` for this endpoint. Other pages check `res.data`. Please make sure `success: true` is included here.

`entityType` known values used for color coding: `"User"`, `"Pharmacy"`, `"Pharmacist"`, `"System"`

---

#### `GET /admin/activity/export`
Downloads all logs as a CSV file. The frontend opens this URL in a new tab with the token appended as a query param:
```
GET /api/v1/admin/activity/export?token=<jwt_token>
```
**Response:** File download (CSV format).

---

## 14. Reports & Analytics Module

**File:** `pages/reports.html` / `js/pages/reports.js`

### 14.1 What the UI Displays
- 4 order stat cards: Total, Pending, Completed, Cancelled
- 4 user stat cards: Total Users, New Today, Active Today, Active Pharmacists
- 3 performance stats: Avg Response Time, Total Messages Handled, Top Pharmacy, Top Medicine
- Bar chart: New users per day (last 7 days)
- Line chart: Active users trend
- Doughnut chart: Orders by status
- Horizontal bars: Top 5 pharmacies by revenue/orders
- Horizontal bars: Top 3 medicines by order count
- Horizontal bars: Top 5 pharmacists by messages handled
- Export to PDF button (client-side, no API needed)

### 14.2 API Calls

All 5 calls are made in parallel:

#### `GET /admin/analytics/users`
See Dashboard Section 4.2 for response format. Additional fields used here:
- `newUsersPerDay[].value` — for the "New Today" stat and the bar chart
- `activeUsersPerDay[].value` — for "Active Today" stat and line chart
- `totalUsers` — for Total Users stat

---

#### `GET /admin/analytics/orders`
Same as Dashboard. Additional fields:
- `ordersByStatus` — for the doughnut chart and pending/completed/cancelled stats

---

#### `GET /admin/analytics/top-pharmacies`
Same as Dashboard. Used for horizontal bar chart in Reports.

The value shown is `totalRevenue` → `revenue` → `orderCount`.

---

#### `GET /admin/analytics/top-medicines`
Same as Dashboard. Used for horizontal bar chart.

The value shown is `orderCount` → `quantity` → `value`.

---

#### `GET /admin/pharmacist-performance`
Powers the pharmacists performance bars and the response time stats.

**Expected Response:**
```json
{
  "data": [
    {
      "pharmacistName": "Dr. Sara Ahmed",
      "messagesHandled": 320,
      "averageResponseTimeMinutes": 8
    }
  ]
}
```
- `messagesHandled` is used for the bar width and count display
- `averageResponseTimeMinutes` is averaged across all pharmacists for the "Avg Response Time" stat
- The length of the array = number of "Active Pharmacists"

---

#### `GET /admin/analytics/revenue` *(Optional / Future)*
Called from `reportsApi.js` but not currently wired to any visible UI element in the Reports page. Can be implemented later.

---

#### `GET /admin/high-risk-patients` *(Optional / Future)*
Called from `reportsApi.js` but not currently wired to any visible UI element. Can be implemented later.

---

## 15. Settings Module

**File:** `pages/settings.html` / `js/pages/settings.js`

### 15.1 What the UI Displays
- Admin profile section: view and update name, email, avatar
- Platform settings: whatever the platform-level settings are (e.g., maintenance mode, default limits)

### 15.2 API Calls

#### `GET /admin/profile`
Returns the logged-in admin's profile.

**Expected Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Super Admin",
    "email": "admin@tamenny.com",
    "avatar": "https://..."
  }
}
```

---

#### `PUT /admin/profile`
Updates admin profile.

**Request Body:**
```json
{
  "name": "Super Admin",
  "email": "admin@tamenny.com"
}
```

---

#### `GET /admin/settings`
Returns platform-level settings.

---

#### `PUT /admin/settings`
Updates platform-level settings.

---

## 16. Shared User Sync (Firebase Flow)

When an admin creates a new Patient, Pharmacist, or Intern from the dashboard, the frontend:
1. Registers the user in Firebase Auth directly (client-side)
2. Then calls the backend to sync the user

#### `POST /users/sync`
Registers the Firebase user in the platform database.

**Request Body (Patient):**
```json
{
  "email": "patient@example.com",
  "displayName": "Ahmed Hassan",
  "phoneNumber": "+201001234567",
  "firebaseUid": "firebase-uid-here",
  "role": "Patient",
  "roles": ["Patient"],
  "status": "Active"
}
```

**Request Body (Pharmacist):**
```json
{
  "email": "pharm@example.com",
  "displayName": "Dr. Sara Ahmed",
  "phoneNumber": "+201001234567",
  "firebaseUid": "firebase-uid-here",
  "roles": ["Pharmacist"]
}
```

**Request Body (Intern):**
```json
{
  "email": "intern@example.com",
  "displayName": "Mohamed Ali",
  "phoneNumber": "+201001234567",
  "firebaseUid": "firebase-uid-here",
  "role": "Intern",
  "roles": ["Intern"],
  "status": "Active"
}
```

---

## 17. Summary of All Endpoints

| # | Method | Endpoint | Module | Notes |
|---|--------|----------|--------|-------|
| 1 | GET | `/admin/stats` | Dashboard | Totals for all 5 stat cards |
| 2 | GET | `/admin/analytics/orders` | Dashboard / Orders / Reports | Orders by status + per day |
| 3 | GET | `/admin/analytics/users` | Dashboard / Reports | Active & new users per day |
| 4 | GET | `/admin/analytics/top-pharmacies` | Dashboard / Reports | Top pharmacies by orders |
| 5 | GET | `/admin/analytics/top-medicines` | Dashboard / Reports | Top medicines by count |
| 6 | GET | `/admin/activity` | Dashboard / Audit Logs | Activity feed & logs |
| 7 | GET | `/admin/activity/export` | Audit Logs | CSV download |
| 8 | GET | `/admin/patients` | Patients | Paginated list |
| 9 | GET | `/admin/patients/:id` | Patients | Single profile |
| 10 | PUT | `/admin/patients/:id/status` | Patients | Change status |
| 11 | DELETE | `/admin/patients/:id` | Patients | Delete |
| 12 | GET | `/admin/pharmacists` | Pharmacists | Paginated list |
| 13 | GET | `/admin/pharmacists/:id` | Pharmacists | Single profile |
| 14 | DELETE | `/admin/pharmacists/:id` | Pharmacists | Delete |
| 15 | PUT | `/admin/pharmacists/:id/max-patients` | Pharmacists | Set patient limit |
| 16 | GET | `/admin/applications?type=Pharmacist` | Pharmacists | Pending applications |
| 17 | POST | `/admin/pharmacist/:id/approve` | Pharmacists | Approve application |
| 18 | POST | `/admin/pharmacist/:id/reject` | Pharmacists | Reject application |
| 19 | GET | `/admin/interns` | Intern Pharmacists | Paginated list |
| 20 | GET | `/admin/interns/:id` | Intern Pharmacists | Single profile |
| 21 | DELETE | `/admin/intern-pharmacists/:id` | Intern Pharmacists | Delete |
| 22 | GET | `/admin/applications?type=Intern` | Intern Pharmacists | Pending applications |
| 23 | PUT | `/admin/interns/:id/approve` | Intern Pharmacists | Approve |
| 24 | PUT | `/admin/interns/:id/reject` | Intern Pharmacists | Reject |
| 25 | GET | `/admin/pharmacies` | Pharmacies | Paginated list |
| 26 | GET | `/admin/pharmacies/:id` | Pharmacies | Single profile |
| 27 | POST | `/pharmacies` | Pharmacies | Create pharmacy |
| 28 | PUT | `/admin/pharmacies/:id/approve` | Pharmacies | Approve / Activate |
| 29 | PUT | `/admin/pharmacies/:id/reject` | Pharmacies | Reject |
| 30 | PUT | `/admin/pharmacies/:id/suspend` | Pharmacies | Suspend |
| 31 | GET | `/pharmacies/:id/branches` | Pharmacies | List branches |
| 32 | POST | `/files/upload` | Pharmacies | Upload logo |
| 33 | GET | `/admin/orders` | Orders | Paginated list |
| 34 | GET | `/admin/orders/:id` | Orders | Single order with items & history |
| 35 | GET | `/admin/drugs` | Medications | Paginated list |
| 36 | POST | `/admin/drugs` | Medications | Create drug |
| 37 | PUT | `/admin/drugs/:id` | Medications | Update drug |
| 38 | DELETE | `/admin/drugs/:id` | Medications | Delete drug |
| 39 | PATCH | `/admin/drugs/:id/toggle` | Medications | Toggle active status |
| 40 | POST | `/admin/drugs/import` | Medications | Import from Excel |
| 41 | GET | `/admin/drugs/:id/synonyms` | Medications | List synonyms |
| 42 | POST | `/admin/drugs/:id/synonyms` | Medications | Add synonym |
| 43 | DELETE | `/admin/drugs/:drugId/synonyms/:synId` | Medications | Delete synonym |
| 44 | GET | `/admin/notification-requests` | Notifications | Notification history |
| 45 | POST | `/admin/notifications/broadcast` | Notifications | Send broadcast |
| 46 | POST | `/admin/notifications/send` | Notifications | Send to user |
| 47 | PUT | `/admin/notification-requests/:id/approve` | Notifications | Approve request |
| 48 | PUT | `/admin/notification-requests/:id/reject` | Notifications | Reject request |
| 49 | DELETE | `/admin/notifications/:id` | Notifications | Delete notification |
| 50 | GET | `/admin/pharmacist-performance` | Reports | Pharmacist perf data |
| 51 | GET | `/admin/analytics/revenue` | Reports | Revenue (future) |
| 52 | GET | `/admin/high-risk-patients` | Reports | High risk (future) |
| 53 | GET | `/admin/profile` | Settings | Admin profile |
| 54 | PUT | `/admin/profile` | Settings | Update admin profile |
| 55 | GET | `/admin/settings` | Settings | Platform settings |
| 56 | PUT | `/admin/settings` | Settings | Update settings |
| 57 | PUT | `/admin/users/:id/ban` | Global | Ban any user |
| 58 | PUT | `/admin/users/:id/suspend` | Global | Suspend any user |
| 59 | PUT | `/admin/users/:id/activate` | Global | Activate any user |
| 60 | POST | `/users/sync` | Global | Sync Firebase user |
| 61 | GET | `/api/admin/files/pending` | File Review | Pending documents *(separate base URL)* |
| 62 | POST | `/api/admin/files/:id/approve` | File Review | Approve document *(separate base URL)* |
| 63 | POST | `/api/admin/files/:id/reject` | File Review | Reject document *(separate base URL)* |

---

## 18. Important Notes for the Backend Team

### 18.1 Response Consistency
The frontend tries multiple field names because the backend has been inconsistent. Going forward, **please standardize on this response shape**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "totalCount": 100
  }
}
```
For single-object endpoints:
```json
{
  "success": true,
  "data": { ... }
}
```

### 18.2 Status Values
The following status strings are used across the UI (case-sensitive in display, checked case-insensitively in logic):

| Status | Color shown |
|---|---|
| `Active` / `Approved` / `Verified` | Green |
| `Pending` | Yellow/Orange |
| `Suspended` / `Rejected` / `Banned` | Red |

### 18.3 User Roles
The platform uses exactly 3 user roles. Field name can be `role` (string) or `roles` (array):
- `"Patient"` or `["Patient"]`
- `"Pharmacist"` or `["Pharmacist"]`
- `"Intern"` or `["Intern"]`

### 18.4 Date Format
All dates must be ISO 8601 strings:
```
"2025-07-15T10:30:00Z"
```

### 18.5 Pagination
- All list endpoints must support `?page=1&pageSize=20`
- Page numbers are **1-indexed** (first page = `page=1`)
- The `totalCount` field is required for the frontend to render pagination buttons correctly

### 18.6 CORS
The admin dashboard is served from a different domain than the API. Make sure CORS headers are set to allow the admin domain.

### 18.7 File Review Separate URL
The File Review module currently uses `http://148.230.114.124:8080/api/admin/files` directly in the code. If this changes, update `js/api/fileReviewApi.js` line 2.

### 18.8 Analytics Date Arrays
For all `*PerDay` arrays, the frontend takes the last 7 entries (`.slice(-7)`). Arrays should be sorted **oldest first** so the most recent data appears on the right side of the chart.

### 18.9 Orders Status Keys
The frontend groups order statuses as follows:
- **Completed/Approved:** keys containing `complet`, `approv`, or `deliver`
- **Pending:** keys containing `pend` or `process`
- **Rejected/Cancelled:** keys containing `cancel` or `reject`
- **Confirmed:** keys containing `confirm`

So `ordersByStatus` keys can be any of these, and the frontend will bucket them correctly.

### 18.10 Pharmacist Max Patients
The field for max patients limit can be `maxPatients` OR `maxPatientsLimit` OR `limit`. Please use `maxPatients` as the primary field name for consistency.
