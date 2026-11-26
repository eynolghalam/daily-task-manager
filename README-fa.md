# مدیریت کارهای روزانه

## اجرای برنامه در حالت توسعه

```powershell
npm.cmd install
npm.cmd start
```

## انتشار نسخهٔ جدید

برای اینکه نسخهٔ نصب‌شده بتواند به‌روزرسانی بگیرد، نسخه‌های جدید باید به صورت GitHub Release منتشر شوند. گردش‌کار GitHub Actions در فایل `.github/workflows/release.yml` این انتشار را هنگام push کردن یک tag با پیشوند `v` می‌سازد.

نمونهٔ انتشار نسخهٔ 1.0.1:

```powershell
git add .
git commit -m "Describe the update"
git tag v1.0.1
git push origin main --tags
```

پس از اتمام موفق GitHub Actions و انتشار Release، نسخهٔ نصب‌شده در اجرای بعدی انتشار جدید را بررسی می‌کند و اعلان به‌روزرسانی نشان می‌دهد.
