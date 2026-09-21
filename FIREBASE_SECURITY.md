# تفعيل أمان Firebase

أضفنا قواعد Firestore في `firestore.rules`، وهي تسمح للزوار بقراءة الإحصائيات وزيادة عداد واحد فقط بمقدار واحد، وتسمح بإرسال رسائل التواصل دون قراءتها أو تعديلها أو حذفها. أي مجموعات أخرى مغلقة افتراضيًا.

## التفعيل من Firebase Console

1. افتح مشروع `elsayedaa-memorial` في [Firebase Console](https://console.firebase.google.com/).
2. افتح **Firestore Database** ثم تبويب **Rules**.
3. استبدل المحتوى بمحتوى ملف `firestore.rules` الموجود في هذا المستودع.
4. اضغط **Publish**.

ملف `firebase.json` وملف `.firebaserc` جاهزان أيضًا للنشر عبر Firebase CLI بعد تسجيل الدخول:

```bash
firebase login
firebase deploy --only firestore:rules --project elsayedaa-memorial
```

لا تضع أي كلمة مرور أو مفتاح خدمة داخل ملفات الموقع. إعدادات Firebase Web الظاهرة في الصفحة ليست مفاتيح سرية؛ الحماية الفعلية تأتي من قواعد Firestore.
