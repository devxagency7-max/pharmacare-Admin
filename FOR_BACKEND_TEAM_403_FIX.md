# URGENT: Admin Dashboard — 403 Forbidden on All Endpoints

> **To:** Backend Team
> **From:** Frontend Team (Admin Dashboard)
> **Date:** 2026-07-18
> **Priority:** HIGH — Dashboard is completely non-functional

---

## What's Happening

The Admin Dashboard at `https://tamenny-admin.vercel.app` is returning **403 Forbidden** on every single API call:

```
GET /api/v1/admin/stats                    → 403
GET /api/v1/admin/users                    → 403
GET /api/v1/admin/analytics/orders         → 403
GET /api/v1/admin/analytics/top-pharmacies → 403
GET /api/v1/admin/analytics/top-medicines  → 403
GET /api/v1/admin/analytics/users          → 403
GET /api/v1/admin/activity                 → 403
GET /api/v1/admin/orders                   → 403
GET /api/v1/admin/pharmacies               → 403
```

The Firebase token **is being sent correctly** in the `Authorization: Bearer <token>` header.  
Token length confirmed: **950 characters** (valid JWT format).

---

## Root Cause

The user account we are logging in with **does not have the `Admin` role** in your database.

Your Firebase middleware reads the token, identifies the user, and then checks their role.  
Since the role is not `Admin`, the middleware rejects every `/admin/*` request with 403.

This is not a code bug — the frontend is working correctly. The problem is a **missing role assignment in the database**.

---

## What We Need From You

Please set the `Admin` role for our dashboard account in your database.

### Our Account Details

To get our Firebase UID, open the browser console on the dashboard and run:

```js
const p = JSON.parse(atob(localStorage.getItem('idToken').split('.')[1]));
console.log('UID:', p.user_id || p.sub);
console.log('Email:', p.email);
```

**OR** — we'll send you the email address of the account directly. Just ask.

### The Fix (one SQL query)

```sql
UPDATE Users
SET Role = 'Admin'
WHERE FirebaseUid = '<our_firebase_uid>';
```

Or via whatever admin seeding mechanism you have.

---

## Important Notes

1. **One account is not enough** — every developer/tester who needs dashboard access needs their account set to `Admin` role. Please confirm how we should handle this going forward (seed script? manual DB update each time?).

2. **After the fix**, we also need you to confirm that CORS is configured to allow requests from `https://tamenny-admin.vercel.app`. We are currently proxying through Vercel to avoid Mixed Content issues (our site is HTTPS, your server is HTTP), but if you later add HTTPS to the backend, CORS headers will matter.

3. **New server IP confirmed** — we have updated all our API calls to target `204.168.149.185` (the new server). The old IP `148.230.114.124:8080` is no longer referenced anywhere in our code.

---

## Summary

| Step | Owner | Status |
|---|---|---|
| Set `Role = Admin` for dashboard account | **Backend** | ❌ Needed NOW |
| Confirm CORS allows `tamenny-admin.vercel.app` | **Backend** | ⚠️ Needed soon |
| Confirm new server `204.168.149.185` is live | **Backend** | ❓ Please confirm |
| Frontend API calls — all endpoints correct | Frontend | ✅ Done |
| Vercel proxy configured (Mixed Content fixed) | Frontend | ✅ Done |

Please action the role update as soon as possible so we can begin full testing.

Thanks!
**Tamenny Frontend Team**
