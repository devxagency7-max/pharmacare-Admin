# Backend Team — Action Required

---

## 1. Create First SuperAdmin Account (URGENT)

We need the first SuperAdmin account created so we can access the Admin Management panel and promote other admins.

**Per your own `SUPER_ADMIN_MASTER.md` (Section 2 — Bootstrapping the First SuperAdmin):**

> Set `SuperAdmin:SeedEmails` in the server environment variables, then have that person sign in — the role is appended automatically and idempotently.

**Please add this environment variable to the server:**

```
SuperAdmin__SeedEmails__0=gmohamedmedo@gmail.com
```

After adding it, we will sign out and sign back in — the SuperAdmin role will be picked up automatically from the next Firebase token sync.

**No database migration or API call needed — this is already implemented in `UserService.TryApplyAdminSeedRole`.**

---

## 2. Frontend — What We Have Done (no action needed from you)

The following is already implemented on the frontend and wired to your existing APIs:

| Screen | Endpoint Used | Status |
|--------|--------------|--------|
| Admin Management — list/search/filter | `GET /api/v1/super-admin/admins` | ✅ Done |
| Admin Management — detail drawer | `GET /api/v1/super-admin/admins/{id}` | ✅ Done |
| Admin Management — stats + recent promotions/role changes | `GET /api/v1/super-admin/stats` | ✅ Done |
| Promote to Admin modal | `POST /api/v1/super-admin/admins/promote` | ✅ Done |
| Remove Admin role | `POST /api/v1/super-admin/admins/remove` | ✅ Done |
| Promote / Demote SuperAdmin | `POST /api/v1/super-admin/admins/promote-super-admin` / `remove-super-admin` | ✅ Done |
| Lock / Unlock | `POST /api/v1/super-admin/admins/{id}/lock` / `unlock` | ✅ Done |
| Suspend / Reactivate | `POST /api/v1/super-admin/admins/{id}/suspend` / `reactivate` | ✅ Done |
| Reset Password (returns link, no email sent) | `POST /api/v1/super-admin/admins/{id}/reset-password` | ✅ Done |
| Platform Config | `GET/PUT /api/v1/super-admin/settings` | ✅ Done |
| System Health (auto-refresh 30s) | `GET /api/v1/super-admin/system-health` | ✅ Done |
| Backups — view / create / restore | `GET/POST /api/v1/super-admin/backups*` | ✅ Done |
| Integrations | `GET /api/v1/super-admin/integrations` | ✅ Done |
| Audit Logs — Archive button (SuperAdmin only, hidden for plain Admin) | `POST /api/v1/admin/audit-logs/archive` | ✅ Done |

---

## 3. Response Fields We Are Consuming from `GET /super-admin/stats`

Please confirm these fields exist in the response (we are rendering all of them):

```json
{
  "data": {
    "totalAdmins": 4,
    "totalSuperAdmins": 2,
    "lockedAdmins": 1,
    "activeAdmins": 3,
    "recentPromotions": [
      {
        "targetName": "Sara Ahmed",
        "performedBy": "Root SuperAdmin",
        "createdAt": "2026-07-18T09:00:00Z"
      }
    ],
    "recentRoleChanges": [
      {
        "targetName": "Omar K.",
        "performedBy": "Root SuperAdmin",
        "createdAt": "2026-07-15T09:00:00Z"
      }
    ]
  }
}
```

If `recentPromotions` or `recentRoleChanges` are not yet returned by the endpoint, please add them — or let us know the actual field names so we can map them correctly.

---

## 4. One Missing Endpoint — Activity Log

Per `SUPER_ADMIN_MASTER.md` Section 10.4, there should be:

```
GET /api/v1/super-admin/admins/activity
Query params: adminUserId, action, from, to, page, pageSize
```

**We do not have a screen for this yet.** Once you confirm the endpoint is live and returns data, we will build the Activity Log screen on the frontend.

Expected response shape:
```json
{
  "data": {
    "items": [
      {
        "timestamp": "2026-07-19T08:12:00Z",
        "actorName": "Root SuperAdmin",
        "action": "PromoteAdmin",
        "targetName": "Sara Ahmed",
        "oldRole": null,
        "newRole": "Admin",
        "ipAddress": "41.238.12.9"
      }
    ],
    "totalCount": 50,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## Summary of Actions Needed from Backend

| # | Action | Priority |
|---|--------|----------|
| 1 | Add `SuperAdmin__SeedEmails__0=gmohamedmedo@gmail.com` to server env vars | 🔴 URGENT |
| 2 | Confirm `recentPromotions` + `recentRoleChanges` in `GET /super-admin/stats` response | 🟡 Medium |
| 3 | Confirm `GET /super-admin/admins/activity` endpoint is live | 🟢 Low (we'll build the screen after) |

---

*Frontend team — Tamenny Admin Dashboard*
*Date: 2026-07-24*
