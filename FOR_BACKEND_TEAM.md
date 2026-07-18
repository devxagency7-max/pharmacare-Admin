# Admin Dashboard — Frontend Update Summary & Open Questions

> **To:** Backend Team  
> **From:** Frontend Team (Admin Dashboard)  
> **Date:** 2026-07-18  
> **Re:** API integration after reviewing `FRONTEND_ADMIN_DASHBOARD_GUIDE.md`

---

## 1. What We Fixed on Our Side

After reviewing the backend API reference document you shared, we found and corrected **6 mismatches** in our codebase. Everything listed below has already been updated and pushed.

---

### Fix 1 — Medications: wrong endpoint prefix

**We were calling:** `/api/v1/admin/drugs/*`  
**Correct endpoint:** `/api/v1/admin/medicines/*`

Updated all calls across `medicationsApi.js`:

| Old | New |
|---|---|
| `GET /admin/drugs` | `GET /admin/medicines` |
| `POST /admin/drugs` | `POST /admin/medicines` |
| `PUT /admin/drugs/:id` | `PUT /admin/medicines/:id` |
| `DELETE /admin/drugs/:id` | `DELETE /admin/medicines/:id` |
| `PATCH /admin/drugs/:id/toggle` | `PATCH /admin/medicines/:id/toggle` |
| `POST /admin/drugs/import` | `POST /admin/medicines/import` |
| `GET /admin/drugs/:id/synonyms` | `GET /admin/medicines/:id/synonyms` |
| `POST /admin/drugs/:id/synonyms` | `POST /admin/medicines/:id/synonyms` |
| `DELETE /admin/drugs/:id/synonyms/:synId` | `DELETE /admin/medicines/:id/synonyms/:synId` |

We also added a missing `deleteDrug()` function that was being called in the UI but never defined in the API layer.

---

### Fix 2 — Pharmacist Approve/Reject: wrong route

**We were calling:**
```
POST /api/v1/admin/pharmacist/:id/approve
POST /api/v1/admin/pharmacist/:id/reject
```
**Correct endpoint:**
```
POST /api/v1/admin/applications/:id/approve
POST /api/v1/admin/applications/:id/reject
```

Also updated `rejectPharmacist()` to send **no body** (we were sending `{ reason }` which your docs confirm is not accepted for this endpoint).

---

### Fix 3 — Pharmacist Max Patients: wrong field name in request body

**We were sending:**
```json
{ "maxPatients": 50 }
```
**Correct body:**
```json
{ "maxPatientsLimit": 50 }
```

---

### Fix 4 — Create Pharmacy: wrong endpoint + completely different flow

**We were calling:** `POST /api/v1/pharmacies`  
**Correct endpoint:** `POST /api/v1/admin/pharmacies`

We also updated the payload to match your schema:
```json
{
  "name": "...",
  "code": "...",
  "governorate": "...",
  "address": "...",
  "logoUrl": null
}
```

We updated the UI to **display the `generatedEmail` and `generatedPassword`** from the response in a one-time modal with copy buttons, since your docs confirm these credentials are never retrievable again.

---

### Fix 5 — Admin Profile: endpoint doesn't exist

**We were calling:**
```
GET  /api/v1/admin/profile
PUT  /api/v1/admin/profile
```
**Correct endpoint (shared user profile):**
```
GET  /api/v1/users/me
PUT  /api/v1/users/me
```

---

### Fix 6 — File Review: hardcoded server IP

**We had a hardcoded URL:**
```js
const FILE_REVIEW_BASE = 'http://148.230.114.124:8080/api/admin/files';
```
**Fixed to relative path on the same server:**
```js
const FILE_REVIEW_BASE = '/api/admin/files';
```

---

### Additional Cleanup

- **Removed broken `createPatient()` / `createPharmacist()` / `createInternPharmacist()`** — these functions were calling `apiClient.registerFirebaseUser()` which was never implemented. Per the backend docs, admin cannot create patients or pharmacists directly — they register themselves via the mobile app. We've removed these broken functions from the codebase.

---

## 2. Current Status After All Fixes

| Module | Status |
|---|---|
| Dashboard (stats + charts) | ✅ Ready |
| Patients (list, detail, ban, suspend, activate) | ✅ Ready |
| Pharmacists (list, detail, applications, approve, reject, max patients) | ✅ Ready |
| Intern Pharmacists (list, detail, applications, approve, reject) | ✅ Ready |
| Pharmacies (list, detail, create, suspend) | ✅ Ready |
| Orders (list, detail, analytics) | ✅ Ready |
| Medications (list, create, edit, toggle, delete, import, synonyms) | ✅ Ready |
| Audit Logs (list, export) | ✅ Ready |
| File Review (pending, approve, reject) | ✅ Ready |
| Notifications (send, broadcast) | ✅ Ready |
| Reports & Analytics | ✅ Ready |
| Settings (platform settings) | ✅ Ready |
| Admin Profile | ✅ Ready (now using `/users/me`) |
| Notification history / approval workflow | ⚠️ Waiting on backend (see below) |

---

## 3. Open Questions — Please Reply

We have **9 questions** that are blocking us or require a decision from your side.

---

### Q1 — Notification Broadcast: is `role: "All"` a valid value?

Our UI has an "All Users" option in the broadcast dropdown, which sends:
```json
{ "role": "All", "title": "...", "body": "...", "type": "..." }
```
Your `UserRole` enum values are: `Admin`, `Patient`, `Pharmacist`, `PharmacyIntern`, `PharmacyOwner`.  
**"All" is not in the enum.** Will the backend reject this?

**What we need:** Either confirm that `"All"` is handled, or tell us how to broadcast to all users regardless of role (do we need to call the endpoint 5 times, once per role?).

---

### Q2 — Notification History: is there a plan for a sent-notifications list endpoint?

Our dashboard has a "Notification History" table that should show previously sent notifications. We're currently getting a 404 because this endpoint doesn't exist:
```
GET /api/v1/admin/notification-requests
```
We currently handle this gracefully (empty table, no error) but the feature is non-functional.

**What we need:** Either implement `GET /api/v1/admin/notifications/history` (or similar), or confirm this feature is out of scope and we'll remove the table from the UI.

---

### Q3 — `GET /admin/interns`: does it return only Pending?

Your docs say this endpoint is "Not paginated, not filterable — hardcoded to Pending applications only."

Our UI sends `page`, `pageSize`, and `search` params on this endpoint, and also expects to see **all interns** (not just pending ones).

**What we need:**
- Should we switch our "All Interns" tab to use `GET /admin/applications?type=Intern&status=Approved` instead?
- Or will you update `/admin/interns` to support pagination + status filter like `/admin/patients` does?

---

### Q4 — Delete Pharmacist/Intern: is there a DELETE endpoint?

We have delete buttons in the UI that call:
```
DELETE /api/v1/admin/pharmacists/:id
DELETE /api/v1/admin/intern-pharmacists/:id
```
These endpoints don't exist in your docs. We can work around this by using `ban` or `deactivate` instead, but we need your guidance.

**What we need:** Should we replace the Delete button with Ban? Or will you add DELETE endpoints for pharmacists and interns?

---

### Q5 — Order Detail: are `finalPrice` and `paymentStatus` always empty?

Your docs say these fields are "always empty" in the Admin order detail response. Our order detail modal displays both fields. If they're always empty, we'll remove them from the UI.

**What we need:** Confirm whether these will be populated in the future, or if we should remove them now.

---

### Q6 — Order Items: are `form`, `dosage`, and `imageUrl` missing from admin order detail?

Your `AdminOrderDetailResponse` only contains `items[].medicineName` and `items[].quantity`.  
Our order detail modal also tries to display `form`, `dosage`, and `imageUrl` per item.

**What we need:** Will you add these fields to `AdminOrderDetailResponse`? Or should we remove them from our UI?

---

### Q7 — Audit Log Export: does the CSV download accept the token as a query param?

We trigger the export by opening the URL directly in a new tab:
```
window.open(`/api/v1/admin/activity/export?token=${jwt}`, '_blank');
```
This is the only way to trigger a file download with auth — `fetch` + blob is an alternative but requires extra code.

**What we need:** Confirm that the endpoint accepts `?token=<jwt>` as a query parameter (instead of the `Authorization` header). If not, we'll switch to a fetch + blob approach.

---

### Q8 — Notification Types: what `type` values are valid for admin broadcasts?

The `NotificationType` enum has many values: `MedicationReminder`, `LabReminder`, `AppointmentReminder`, `OrderUpdate`, `PrescriptionUpdate`, `ChatMessage`, `AdminBroadcast`, `AdminDirect`, `ReportSubmitted`, `SystemAlert`, etc.

Our broadcast form currently sends whatever the admin selects. For admin-initiated broadcasts, should we restrict the dropdown to only `AdminBroadcast` and `AdminDirect`? Or are all types allowed?

**What we need:** The list of `NotificationType` values that are valid/meaningful when sent from the admin panel.

---

### Q9 — Pharmacy Phone Number: will it ever be populated?

Your docs note that `PharmacyResponse.phone` is always an empty string because "phone is not stored on Pharmacy but on Branches." However, our pharmacy list and detail pages display a phone number column.

**What we need:** Should we hide the phone column entirely? Or is there a plan to expose branch phone numbers from the pharmacy detail endpoint?

---

## 4. Known Stub Values (We've Noted These — No Action Needed)

We've read your docs carefully and understand the following are intentionally hardcoded stubs — we've adjusted our UI accordingly:

| Field | Stub Value | What We Did |
|---|---|---|
| `prescriptionApprovalRate` in `/admin/dashboard` | Always `0` | Removed from our dashboard display |
| `averageResponseTimeMinutes` in pharmacist performance | Always `5` | Added "(estimate)" label in UI |
| `revenueGenerated` in top medicines | Always `0` | Hidden from the medicines chart |
| `adminName` in audit logs | Always `"Admin"` | Displaying as-is, no per-admin attribution |
| `PlatformSettings` (maintenanceMode, allowNewRegistrations) | Not enforced server-side | Added note in UI: "informational only" |

---

## 5. Summary

**We're unblocked and ready on:**  
Dashboard, Patients, Pharmacists, Interns, Pharmacies, Orders, Medications, Audit Logs, File Review, Notifications (send only), Analytics, Settings.

**We're blocked / waiting on your response for:**  
Q1 (broadcast "All" role), Q2 (notification history), Q3 (interns list behavior), Q4 (delete pharmacist/intern), Q5-Q6 (order detail fields), Q7 (CSV export token), Q8 (notification types), Q9 (pharmacy phone).

Please reply with answers or a Jira ticket per item so we can close these off. We can jump on a call if easier.

Thanks!  
**Tamenny Frontend Team**
