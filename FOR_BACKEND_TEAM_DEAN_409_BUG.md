# `POST /api/v1/admin/deans` — 409 "Already Has an Active Dean" on Every Faculty

> **To:** Backend Team
> **From:** Frontend Team (Admin Dashboard)
> **Date:** 2026-09-12
> **Priority:** High — blocks Dean provisioning entirely right now

---

## What's Happening

`POST /api/v1/admin/deans` returns **409 Conflict** with:

```json
{ "success": false, "message": "This faculty already has an active Dean. Deactivate the current Dean before appointing a new one." }
```

...on **every faculty we try**, including a **brand-new faculty we just created**, which has never had a Dean provisioned for it before.

This is not our client-side duplicate check triggering (we do have one, but it only blocks based on faculties that already show up as having an active Dean in `GET /admin/deans` — it did not block here, we're seeing your API's actual 409 response).

## Steps to Reproduce

1. Create a University (works).
2. Create a Faculty under it (works).
3. Call `GET /api/v1/admin/deans` → returns an **empty list** (no Deans exist yet).
4. Call `POST /api/v1/admin/deans` for that Faculty → **409, "already has an active Dean"**.
5. Repeat with a **second, completely new Faculty** (different `facultyId`, never touched before) → **same 409**.

## What This Suggests

The duplicate-active-Dean check inside `POST /admin/deans` does not appear to be scoped correctly to `facultyId`. Two hypotheses, from most to least likely:

1. **The check isn't filtering by `facultyId` at all** — it's checking "does an active Dean exist anywhere in the system" instead of "does an active Dean exist for *this* faculty." If any Dean was ever successfully created earlier (we did test-create one, name "DevX", email `devx.agency7@gmail.com` — not sure if that attempt actually persisted despite showing an error on our end at the time), this would explain why *every* faculty is now blocked.
2. There's a data inconsistency where a Dean row exists and is marked active in whatever table/query the duplicate-check reads from, but `GET /admin/deans` reads from a different source/query that isn't returning it.

## What We Need

- Please check whether a Dean record (possibly the "DevX" / `devx.agency7@gmail.com` test one) exists and is marked active in the database, and if so, on which `facultyId`.
- Please check the duplicate-check query in `POST /admin/deans` actually filters `WHERE FacultyId = @facultyId AND IsActive = true` rather than checking globally.
- Once fixed, we'll retest end-to-end on our side.

---

*Frontend team — Tamenny Admin Dashboard*
*Date: 2026-09-12*
