# FIX NEEDED: POST /admin/pharmacies → 500 Internal Server Error

> **To:** Backend Team
> **From:** Frontend Team (Admin Dashboard)
> **Priority:** HIGH — pharmacy creation is completely broken

---

## ما اللي بيحصل

كل مرة بنحاول نسجّل صيدلية جديدة من الـ Admin Dashboard بترجع 500.

---

## اختبارنا من جانبنا

| Test | Result |
|------|--------|
| مع logo | 500 |
| بدون logo (logoUrl: null) | 500 |
| governorate و address فاضيين | 400 ✓ (validation شغال) |
| governorate و address موجودين | 500 ✗ |

**الاستنتاج:** الـ validation شغال تمام (400 بيرجع صح). الـ crash بيحصل بعد الـ validation — في منطق إنشاء الصيدلية نفسه.

---

## الـ Request اللي بنبعته

```
POST /api/v1/admin/pharmacies
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json
```

```json
{
  "name": "Abdallah Mohamed Fathy",
  "code": "234567898765",
  "governorate": "Beni Suef",
  "address": "مركز بني سويف - محافظة بني سويف",
  "logoUrl": null
}
```

---

## الـ Response اللي بنستلمه

```
HTTP 500 Internal Server Error
```

```json
{
  "success": false,
  "message": "An unexpected error occurred.",
  "errors": null
}
```

---

## أكتر الأسباب احتمالاً (رتّبناها)

### السبب الأول (الأرجح): Firebase Admin SDK بيفشل في إنشاء الأونر

الـ endpoint ده بيعمل Firebase user للأونر تلقائياً. لو الـ Firebase Admin SDK عنده مشكلة هيطلع 500.

**اللي تتحقق منه:**
```csharp
// في الـ service method بتاعت CreatePharmacy
// شوف لو في try-catch حوالين الـ Firebase call
var firebaseUser = await _firebaseAdmin.CreateUserAsync(new UserRecordArgs {
    Email = generatedEmail,
    Password = generatedPassword
});
// لو الـ exception هنا مش متـ handle هيطلع 500
```

**الأسباب الشائعة:**
- الـ `FIREBASE_SERVICE_ACCOUNT` credentials في الـ environment variables ناقصة أو غلط
- الـ Firebase project مش فيه Admin SDK permissions
- الإيميل الـ auto-generated اتكسر في الـ generation logic (مثلاً null string)
- Firebase quota exceeded

---

### السبب الثاني: Database constraint violation مش متـ handle

ممكن حصلت محاولة قبل كده وخلّت بيانات ناقصة في الـ DB (partial insert). دلوقتي لما بتحاول تاني في unique constraint على `code` أو `email`.

**اللي تتحقق منه:**
```sql
-- شوف لو في pharmacies بـ code = '234567898765' أو '1111111111'
SELECT * FROM Pharmacies WHERE Code IN ('234567898765', '1111111111', '834567898765')

-- شوف لو في users بـ IsDeleted = false ومش عندهم pharmacy مرتبطة
SELECT * FROM Users WHERE Role = 'PharmacyOwner' AND CreatedAt > '2026-07-18'
```

---

### السبب الثالث: Null Reference في الـ Service

ممكن متغير مش متـ initialize قبل الاستخدام. خصوصاً لو في auto-generation logic للـ email أو password.

**اللي تتحقق منه:**
```csharp
// شوف إن الـ generated email والـ password مش null قبل استخدامهم
var generatedEmail = GenerateEmail(data.Name); // لو Name فيها حروف عربية ممكن تكسر logic
var generatedPassword = GeneratePassword();

if (string.IsNullOrEmpty(generatedEmail))
    throw new ArgumentException("Generated email is null"); // handle properly
```

> **ملاحظة:** الاسم "Abdallah Mohamed Fathy" فيه مسافات. لو الـ email generator بيعمل حاجة زي `split('.')[0]` ممكن يطلع نتيجة غير متوقعة.

---

## الـ Stack Trace (محتاجينه)

افتحوا الـ server logs وابحثوا عن الـ request في التوقيت ده:
- **`2026-07-19` حوالي الساعة اللي اتعملت فيها الـ request**
- ابحثوا عن `POST /api/v1/admin/pharmacies`
- انسخوا الـ **full stack trace** وشاركوه معنا

---

## الـ Fix المطلوب

1. **Wrap the Firebase call** في try-catch وارجعوا error واضح بدل 500
2. **Wrap the DB insert** في try-catch وتعاملوا مع duplicate key كـ 409 مش 500
3. **لو حصل partial insert** (Firebase اتعمل بس الـ DB فشل أو العكس) — تأكدوا إن عندكم **rollback/transaction** صح

مثال:
```csharp
public async Task<CreatePharmacyResult> CreatePharmacyAsync(CreatePharmacyDto dto)
{
    using var transaction = await _db.BeginTransactionAsync();
    try
    {
        // 1. Generate credentials
        var email = GenerateOwnerEmail(dto.Name);
        var password = GeneratePassword();

        // 2. Create Firebase user
        var firebaseUser = await _firebase.CreateUserAsync(email, password);

        // 3. Insert pharmacy in DB
        var pharmacy = new Pharmacy { ... };
        await _db.Pharmacies.AddAsync(pharmacy);
        await _db.SaveChangesAsync();

        await transaction.CommitAsync();
        return new CreatePharmacyResult { GeneratedEmail = email, GeneratedPassword = password, ... };
    }
    catch (FirebaseAuthException ex)
    {
        await transaction.RollbackAsync();
        throw new AppException("Failed to create pharmacy owner account: " + ex.Message);
    }
    catch (DbUpdateException ex) when (ex.IsUniqueConstraintViolation())
    {
        await transaction.RollbackAsync();
        throw new ConflictException("A pharmacy with this code already exists.");
    }
}
```

---

## للتأكيد بعد الـ Fix

بعد ما تعملوا الـ fix، جربوا الـ endpoint ده من الـ Swagger مباشرةً:

```json
{
  "name": "Test Pharmacy Fix",
  "code": "TEST-001",
  "governorate": "Cairo",
  "address": "Test Address",
  "logoUrl": null
}
```

المفروض يرجع:
```json
{
  "success": true,
  "data": {
    "pharmacyId": "...",
    "name": "Test Pharmacy Fix",
    "code": "TEST-001",
    "generatedEmail": "...",
    "generatedPassword": "..."
  }
}
```

---

---

## مشكلة ثانية: GET /admin/stats → 500

نفس الـ 500 error بتطلع من `GET /api/v1/admin/stats`.

```
GET /api/v1/admin/stats
→ 500 Internal Server Error
→ { "success": false, "message": "An unexpected error occurred.", "errors": null }
```

الداشبورد شغال عندنا بفضل fallback بيجيب البيانات من endpoints تانية، لكن محتاجين الـ stats endpoint يشتغل صح عشان الـ performance يبقى أحسن.

**اللي محتاجينه:** تأكد إن الـ stats aggregation query مش بتكرش على DB فاضية أو قيم null.

---

شكراً وفي انتظار الـ fix 🙏

**Tamenny Frontend Team**
