# URGENT: POST /api/v1/admin/pharmacies Returning HTTP 500

> **To:** Backend Team  
> **From:** Frontend Team (Admin Dashboard)  
> **Date:** 2026-09-30  
> **Server IP:** `187.7.30.23`  
> **Priority:** HIGH — Pharmacy Registration Failing  

---

## Issue Description

When attempting to register a new pharmacy via the Admin Dashboard (`https://tamenny-admin.vercel.app`), the request fails with **HTTP 500 Internal Server Error**.

### Console Log & Diagnostic Evidence
```
POST https://tamenny-admin.vercel.app/api/v1/admin/pharmacies 500 (Internal Server Error)
Response Body: { "success": false, "message": "An unexpected error occurred.", "errors": null, "errorCode": null }
Status: 500
```

---

## Request Payload Sent by Frontend

```json
POST /api/v1/admin/pharmacies
Content-Type: application/json
Authorization: Bearer <Firebase_ID_Token>

{
  "name": "Hoda El Islam Pharmacy",
  "code": "LIC-2026-UNIQUE-001",
  "governorate": "Beni Suef",
  "address": "EGYPT, Bani suef",
  "logoUrl": null
}
```

---

## Expected Behavior

The server should create the Pharmacy record, generate the Pharmacy Owner credentials via Firebase Admin SDK, and return `200 OK` with the created pharmacy data and auto-generated credentials:

```json
{
  "success": true,
  "data": {
    "pharmacyId": "...",
    "name": "Hoda El Islam Pharmacy",
    "code": "LIC-2026-UNIQUE-001",
    "generatedEmail": "...",
    "generatedPassword": "..."
  }
}
```

---

## Suspected Root Causes on Backend (`187.7.30.23`)

1. **Firebase Admin SDK Unhandled Exception:**
   - The `CreatePharmacy` handler calls Firebase Admin SDK to create the owner account. If Firebase credentials (`firebase-admin.json` / Environment Variables) are missing or invalid on the new server `187.7.30.23`, an unhandled `FirebaseAuthException` triggers a 500 response.

2. **Unhandled DB Exception / Constraint:**
   - Any database error during the insertion of the new Pharmacy or User record is not caught in a try-catch block, resulting in a generic 500 response.

---

## Requested Action

Please check ASP.NET Core server logs on `187.7.30.23` for `POST /api/v1/admin/pharmacies` and handle the exception cleanly.

Thanks,  
**Tamenny Admin Frontend Team**
