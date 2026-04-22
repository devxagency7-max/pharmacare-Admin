# PharmaCare Comprehensive API Documentation

**Base API URL:** `https://api.domain.com/api/v1`
**Authorization:** Firebase Bearer Token (`Authorization: Bearer <token>`)

This document contains a comprehensive, endpoint-by-endpoint explanation of the entire PharmaCare system combining both Dashboard operations and Mobile Application interactions.

---

## 1. Admin operations (`/api/v1/admin/*`)
*Requires `Admin` Role*

### Pharmacist Onboarding
* `GET /api/v1/admin/pharmacist-applications` - Retrieves all pending applications from new pharmacists who wish to join the platform.
* `GET /api/v1/admin/pharmacist-applications/{id}` - Retrieves details and attached credential files for a specific pharmacist application.
* `POST /api/v1/admin/pharmacist/{id}/approve` - Approves a pharmacist application, activating their account and granting them the `Pharmacist` role.
* `POST /api/v1/admin/pharmacist/{id}/reject` - Rejects an application. Often allows attaching a reason for rejection.

### Notifications & System Broadcasts
* `POST /api/v1/admin/notifications/send` - Dispatches a targeted Firebase Cloud Messaging (FCM) push notification directly to a specific user.
* `POST /api/v1/admin/notifications/broadcast` - Sends a system-wide push notification to all active devices (or all devices of a specific sub-group, e.g. all patients).

### System Analytics & Metrics
* `GET /api/v1/admin/analytics/revenue` - Retrieves platform financial metrics, overall revenue, and discount utilizations.
* `GET /api/v1/admin/analytics/orders` - Fetches overall statistical data regarding order lifecycle (total Pending, Delivered, Cancelled).
* `GET /api/v1/admin/analytics/top-pharmacies` - Returns tabular metrics of the highest volume / highest-rated pharmacies.
* `GET /api/v1/admin/analytics/top-medicines` - Returns the most ordered medicines platform-wide.
* `GET /api/v1/admin/analytics/users` - Fetches global mapped user counts, patient-to-pharmacist ratios, and growth percentages.
* `GET /api/v1/admin/high-risk-patients` - Summarizes patients whose calculated Risk Score is flagged as 'High' or 'Critical' for immediate intervention.
* `GET /api/v1/admin/pharmacist-performance` - Benchmarks all pharmacists evaluating workload limits vs. ratings.
* `GET /api/v1/admin/activity` - Global audit trails mapping significant API actions requested by users system-wide.
* `GET /api/v1/admin/stats` - General quick dashboard overview metrics.

### Patient & Pharmacist Management
* `GET /api/v1/admin/patients` - List all patients in the system with optional search/filtering.
* `GET /api/v1/admin/patients/{id}` - Deep dive into a specific patient's profile.
* `PUT /api/v1/admin/patients/{id}/status` - Modify a patient's status (Active, Inactive).
* `GET /api/v1/admin/pharmacists` - List all verified pharmacists.
* `PUT /api/v1/admin/pharmacists/{id}/max-patients` - Admin override setting the total concurrent patient cap for a specific pharmacist.

### Pharmacy & Intern Management
* `GET /api/v1/admin/interns` - Retrieve all registered student pharmacy interns.
* `PUT /api/v1/admin/interns/{id}/approve` & `PUT /api/v1/admin/interns/{id}/reject` - Approve or deny intern platform access.
* `GET /api/v1/admin/pharmacies` - List all corporate parent pharmacies.
* `POST /api/v1/admin/pharmacies` - Force-create a pharmacy entity.
* `GET /api/v1/admin/pharmacies/{id}` - Details of a single pharmacy including branches.
* `PUT /api/v1/admin/pharmacies/{id}/approve` | `reject` | `suspend` - Manage pharmacy compliance status.

### User Controls
* `GET /api/v1/admin/users` - Global user matrix.
* `PUT /api/v1/admin/users/{id}/activate` | `deactivate` | `suspend` | `ban` | `status` - Moderation controls locking/securing accounts out of auth generation.
* `PUT /api/v1/admin/users/{id}/role` - Grant/revoke Roles manually (`Admin`, `Pharmacist`, etc.).

### Report Management
* `GET /api/v1/admin/reports` - Fetch flagged feedback/bug reports from users.
* `PUT /api/v1/admin/reports/{id}/resolve` & `POST /api/v1/admin/reports/{id}/resolve` - Closes/Acks a user ticket.

---

## 2. AdminFile Operations
* `GET /api/admin/files/pending` - Review newly uploaded but unverified critical files (like prescriptions that need strict administrative scrutiny).
* `POST /api/admin/files/{id}/approve` | `reject` - Accept/Strike standard document uploads.

---

## 3. Auth
* `POST /api/v1/auth/sync-user` - Safely binds the initial Google Firebase Token, injecting internal UUIDs and issuing the user object for initial frontend state hydration.
* `GET /api/v1/auth/me` - Verifies session logic and returns current token payload identity representation.

---

## 4. Chat & Interactions
* `GET /api/v1/chat/conversations` - Retrieves all active chat threads for the current user.
* `POST /api/v1/chat/conversations` - Instantiates a new thread between patient and pharmacist.
* `GET /api/v1/chat/{id}/messages` - Loads the paginated message history.
* `POST /api/v1/chat/{id}/messages` - Dispatches a standard text or multimedia chat block over SignalR and persists to DB.
* `POST /api/v1/chat/ai-message` - Sends a query specifically isolated for the AI Chatbot context.
* `PUT /api/v1/chat/conversations/{id}/read` - Marks all messages prior to the watermark timestamp as `IsRead`.

---

## 5. Discovery
* `GET /api/v1/pharmacists` - Core smart-engine query for patients allowing them to find available pharmacists. Passing `includeFull=true` overrides max-patient hiding algorithms.
* `GET /api/v1/pharmacists/{id}` - Detailed profile including pharmacist qualifications and average rating.

---

## 6. Files Infrastructure
* `POST /api/files/upload` - Base multipart/form-data processor uploading content physically to AWS S3 / R2 buckets returning Public URLs.
* `GET /api/files/my` - Lists all raw files the user owns.
* `GET /api/files/{id}` - Fetch metadata for a specific file.
* `DELETE /api/files/{id}` - Hard-delete a file from storage.

---

## 7. Health & Telemetry 
* `POST /api/v1/ai/health-insight` - Invokes OpenAI algorithms scraping a patient's recent vitals/med logs to structure Clinical Summaries and Warnings.
* `POST /api/v1/health-readings` - Patient adds a local measurement (e.g., Blood Pressure: 120/80).
* `GET /api/v1/health-readings` - Retrieves most recent reading batches.
* `GET /api/v1/health-readings/history` - Historical graphing data representation.

---

## 8. Inventory Matrix
* `POST /api/v1/inventory` - Seed a new local branch-specific inventory item connecting a System Medicine to local quantity.
* `GET /api/v1/inventory/{id}` & `PUT /api/v1/inventory/{id}` - Standard CRUD for local branch mapping.
* `GET /api/v1/inventory/branch/{branchId}` - Load all items stored physically at the branch.
* `PUT /api/v1/inventory/{id}/stock` - Fast scalar update specifically modifying standard stock integers.
* `PUT /api/v1/inventory/branch/{branchId}/bulk-update` - Array processor pushing bulk warehouse counts at once.
* `GET /api/v1/inventory/branch/{branchId}/low-stock` - Returns items dropping beneath critical reorder thresholds locally.
* `GET /api/v1/inventory/low-stock` - Global chain-wide query.
* `GET / POST /api/v1/inventory/{id}/transactions` - Audit logs showing exact + / - ledger movements for inventory item audits.

---

## 9. Medical & EHR Data 
* `POST /api/v1/medical-records` - Links Cloud Storage files (Blood Tests, Scans) definitively to clinical Patient timelines.
* `GET /api/v1/medical-records` - Extracts all formal records for AI / Pharmacist review.

---

## 10. Medication Core
### Adherence
* `POST /api/v1/medications/log` - Patient executes a Taken/Missed/Skipped telemetry check-in.
* `GET /api/v1/medications/adherence` - Calculates percentage ratios of doses taken successfully over window periods.
* `GET /api/v1/medications/logs` - Flat history of previous check-in interactions.

### Prescribing & Setup
* `POST /api/v1/medications` - Creates a formal Medication Treatment Plan object.
* `GET /api/v1/medications` & `GET /api/v1/medications/{id}` - Pulling patient active plans.
* `POST /api/v1/medications/{id}/schedule` - Converts a plan into rigid localized DateTime arrays mapping physical alarm times for patients.

---

## 11. System Medicine Catalog
* `GET /api/v1/medicines` & `GET /api/v1/medicines/{id}` - Retrieves master definitions of chemical components and brand medicines.
* `POST /api/v1/medicines` & `PUT` / `DELETE` - Admin-only catalog modifications pushing updates out to pharmacies.
* `GET /api/v1/medicines/search` - Wildcard string search for frontend autocomplete boxes.
* `GET /api/v1/medicines/categories` - Extracts enumerations for OTC, Prescription, Supplement trees.

---

## 12. Notifications Gateway
* `GET /api/v1/notifications` - Pull structured push notification history directly from DB.
* `GET /api/v1/notifications/unread-count` - Tiny byte count mapping the red-dot UI tracker.
* `PUT /api/v1/notifications/{id}/read` - Dismisses alert flag from DB.
* `POST /api/v1/notifications/test` - Debug route pushing trial blocks to the device.
* `POST /api/v1/notifications/reminders/trigger` - Hard force manual cron-style processor.

---

## 13. eCommerce & Order Pipeline
* `POST /api/v1/orders` - Assembles standard cart items into a "Pending" order pushing to `BranchId`.
* `GET /api/v1/orders/my` | `/me` - Extracts all placed orders correlating to Patient.
* `GET /api/v1/orders/{id}` - Pulls exact cost / line item totals / statuses.
* `DELETE /api/v1/orders/{id}/cancel` - Safely terminates a mistakenly placed order.
* `GET /api/v1/orders/branch/{branchId}` - (Dashboard) Extracts all queued and active sales fulfilling from the store.
* `PUT /api/v1/orders/{id}/accept` & `reject` - (Dashboard) Soft-commits the pharmacy to handle delivery or denies for inventory reasons.
* `PUT /api/v1/orders/{id}/status` - (Dashboard) Modifies pipeline state (Preparing, EnRoute, Delivered).

---

## 14. Patient ↔ Pharmacist Workflow (PatientRequests)
* `GET /api/v1/patients/pharmacists` - Lists pharmacists currently bound to the requested patient.
* `POST /api/v1/patients/request-pharmacist` - Sends an inbound 'Follow Request' to a targeted Pharmacist profile.
* `GET /api/v1/patients/my-requests` - Shows history of outbound asks.
* `DELETE /api/v1/patients/requests/{id}/cancel` - Terminates a follow request before acceptance.

### Counter-Party (PharmacistPatients)
* `GET /api/v1/pharmacists/pending-requests` - (Pharmacist) Inbox of patients wanting to be monitored.
* `PUT /api/v1/pharmacists/requests/{id}/respond` - (Pharmacist) Accept / Decline the inbound requests.
* `GET /api/v1/pharmacists/my-patients` - (Pharmacist) Extracts all actively monitored clients allowing fast access to their HealthReadings.
* `GET /api/v1/pharmacists/patients/{id}` - (Pharmacist) Detailed lookup on a specific client's data.
* `PUT /api/v1/pharmacists/patients/{id}/terminate` - Sever the relationship (Discharges patient).

---

## 15. Pharmacies Matrix (Entity mapping)
* `GET /api/v1/pharmacies` & `GET /api/v1/pharmacies/{id}` - Top-level query showing generic corporate info.
* `POST /api/v1/pharmacies` - Opens a new Corporate string block.
* `GET /api/v1/pharmacies/governorates` - Geographical parsing helper.
* `GET` & `POST /api/v1/pharmacies/{pharmacyId}/branches` - Management of localized physical stores appended to the primary corp.
* `GET /api/v1/pharmacies/branches/{branchId}` - Geolocation detail query.
* `PUT /api/v1/pharmacies/branches/{branchId}/working-hours` - Configures 24/7 flags or standard hour representations.
* `POST /api/v1/pharmacies/{pharmacyId}/staff` - Binds existing system Users onto the local branch (Cashier, Managing Pharmacist).
* `GET /api/v1/pharmacies/nearby` - PostGIS / Geography query identifying the closest branches to a Lat/Long parameter.

---

## 16. Pharmacist Core Onboarding
* `POST /api/v1/pharmacist/apply` - Drops an initial application packet.
* `GET /api/v1/pharmacist/application-status` - Checks whether admin approved / rejected the packet.
* `POST /api/v1/pharmacist/{applicationId}/documents` - Upload IDs and Licenses into the queue.

---

## 17. Prescriptions Security
* `POST /api/v1/prescriptions` - Translates a raw Medical Record document into a verifiable prescription request.
* `GET /api/v1/prescriptions/me` & `/{id}` - Extracts patient access to active meds.
* `GET /api/v1/prescriptions/pending` - (Dashboard) Extracts a global unverified queue.
* `POST /api/v1/prescriptions/{id}/approve` | `reject` - (Dashboard) Pharmacist manually validates a written file.
* `POST /api/v1/prescriptions/{id}/review` - Attaches pharmacist notes detailing exact medicine match IDs to the scan.
* `GET /api/v1/prescriptions/pending-reviews` - Extracts queue of pending notes.

---

## 18. Ratings Interface
* `POST /api/v1/ratings` - Patient submits an explicitly structured 1-5 metric alongside text.
* `GET /api/v1/ratings/pharmacist/{pharmacistId}` & `/pharmacy/{pharmacyId}` - Extract pagination of public display feedback for rendering the 5-star view.

---

## 19. Reminders Applet
* `POST /api/v1/reminders` - Custom creation of generic non-medical reminders (e.g., 'Drink water').
* `GET /api/v1/reminders` - Extracts the current synced config mapping.
* `POST /api/v1/reminders/{id}/taken` | `skip` | `snooze` - Adjusts active timers locally resolving standard CRUD check-ins.

---

## 20. Reports
* `POST /api/v1/reports` - Generic bug reporting / feedback submittal gateway sending directly to `/api/v1/admin/reports`.

---

## 21. Search Engine
* `GET /api/v1/search/medicines` - Standardized text query engine wrapper for medicine.
* `GET /api/v1/search/pharmacies` - Standardized query for stores.
* `GET /api/v1/search/medicines/nearby` - Deep query joining `Inventory` against distance radius determining the exact nearest store possessing `Medicine X`.

---

## 22. User Lifecycle Context
* `POST /api/v1/users/sync` - Alternative identity builder validating active Firebase claims against postgres.
* `GET` | `PUT` | `DELETE /api/v1/users/me` - The complete localized CRUD representation allowing Profile modification and self-termination (GDPR compliant).
* `GET /api/v1/users/me/addresses` - Loads saved map / text locations.
* `POST /api/v1/users/me/addresses` & `DELETE` - Add / remove house mappings for Delivery.
* `PATCH /api/v1/users/me/addresses/{addressId}/default` - Selects the primary checkout cart delivery location mapping.
* `GET /api/v1/users/me/devices` - Returns active FCM registered tokens.
* `POST` & `DELETE /api/v1/users/me/devices` - Add / Remove push trackers.
* `POST /api/v1/users/telemetry` - Silent background endpoint pulling frontend interaction metrics strictly for Administrative analytics and tracking.
