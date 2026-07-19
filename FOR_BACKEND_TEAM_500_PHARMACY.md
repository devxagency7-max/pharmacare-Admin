# BUG: POST /admin/pharmacies returns 500 Internal Server Error

> **To:** Backend Team
> **From:** Frontend Team (Admin Dashboard)
> **Date:** 2026-07-19
> **Priority:** HIGH

---

## What Happened

Attempting to register a new pharmacy from the Admin Dashboard returns a **500 Internal Server Error**.

---

## Exact Request

**Endpoint:** `POST /api/v1/admin/pharmacies`

**Request Body (JSON):**
```json
{
  "name": "Dev SmartX",
  "code": "1111111111",
  "governorate": "Cairo",
  "address": "Ahmed Orabi St, Beni Suef",
  "logoUrl": "https://..."
}
```

All required fields are present and valid. This is the exact payload your API reference specifies.

---

## Response Received

**Status:** `500 Internal Server Error`

**Response Body:**
```json
{
  "success": false,
  "message": "An unexpected error occurred.",
  "errors": null
}
```

---

## What We Already Ruled Out

- ❌ Not a validation error — all required fields are present (we already fixed a prior 400 by adding `governorate` and `address`)
- ❌ Not a CORS or auth issue — the request reaches your server (you can see it in your logs with the traceId)
- ❌ Not a frontend payload problem — the body matches your documented `CreatePharmacyRequest` schema exactly

---

## Likely Causes (for your investigation)

1. **Firebase user creation failing** — your flow auto-generates an owner account in Firebase. If the Firebase Admin SDK call is throwing an unhandled exception (e.g. network timeout, quota, invalid config), it would produce a 500.
2. **Duplicate `code` constraint** — if a pharmacy with `code = "1111111111"` was partially created in a previous failed attempt and left a dirty DB row, a unique constraint violation could throw a 500 instead of returning a clean 409.
3. **Unhandled null reference** — any unguarded `null` in the pharmacy creation service method would produce this generic 500.

Please check your server logs for the stack trace on this request and let us know what you find.

---

## What We Need

1. Fix the 500 so pharmacy creation works end-to-end.
2. Ideally, if the `code` already exists, return a **409 Conflict** with a clear message instead of a 500, so we can show the admin a meaningful error.

Thanks!
**Tamenny Frontend Team**
