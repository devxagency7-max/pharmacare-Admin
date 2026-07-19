# CORS Origin — Please Finalize

> **To:** Backend Team
> **From:** Frontend Team (Admin Dashboard)
> **Date:** 2026-07-19

---

In your latest deployment report you mentioned CORS is currently set to a **temporary wildcard** and asked us to send the real Admin Dashboard origin.

Here it is:

```
https://tamenny-admin.vercel.app
```

Please replace the wildcard with this explicit origin in `Cors:AllowedOrigins` so CORS is locked down properly.

If we ever move to a custom domain, we'll send you the new one.

Thanks!
