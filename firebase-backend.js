/* ============================================================
   Backend موثوق للموقع — مبني على Firebase Firestore
   ------------------------------------------------------------
   الملف ده بيوفر:
   - عداد زوار حقيقي وجماعي (مش مجرد تخزين محلي على كل جهاز)
   - عداد تسابيح ودعاء جماعي لكل الزوار (مع الاحتفاظ بالعداد الشخصي)
   - تخزين رسائل "سيب رأيك" في قاعدة بيانات دائمة، مش بس عن طريق إيميل

   الموقع شغال عادي حتى لو الملف ده مش متظبط لسه (بيرجع تلقائيًا
   للتخزين المحلي/countapi القديم) — علشان كده منفصل في ملف لوحده.
   ============================================================ */
(function () {
  "use strict";

  window.hhBackendReady = false;

  const cfg = window.HH_FIREBASE_CONFIG;
  const isConfigured =
    cfg &&
    cfg.apiKey &&
    typeof cfg.apiKey === "string" &&
    !cfg.apiKey.includes("PASTE") &&
    typeof firebase !== "undefined";

  if (!isConfigured) {
    console.info(
      "ℹ️ Backend (Firebase) مش متفعّل لسه — الموقع شغال بالتخزين المحلي. " +
        "اتبع خطوات ملف SETUP.md عشان تفعّله."
    );
    return;
  }

  try {
    firebase.initializeApp(cfg);
  } catch (e) {
    console.warn("فشل تهيئة Firebase:", e);
    return;
  }

  const db = firebase.firestore();

  // تخزين مؤقت أوفلاين — يخلي أي زيادة عداد أو رسالة تتبعت أول ما النت يرجع
  try {
    db.enablePersistence({ synchronizeTabs: true }).catch(function () {});
  } catch (e) {}

  const statsRef = db.collection("stats").doc("global");

  // زيادة إحصائية جماعية بأمان (عملية atomic increment على السيرفر نفسه،
  // مفيش سباق قراءة/كتابة ولا فقدان زيارات لو حصل تزامن)
  window.hhIncrementStat = function (field, amount) {
    return statsRef
      .set(
        { [field]: firebase.firestore.FieldValue.increment(amount) },
        { merge: true }
      )
      .catch(function (e) {
        console.warn("hh: فشل تحديث إحصائية " + field, e);
      });
  };

  // متابعة الإحصائيات لحظيًا (بتتحدث تلقائيًا لكل الزوار المتصلين دلوقتي)
  let statsUnsub = null;
  window.hhWatchStats = function (callback) {
    if (statsUnsub) statsUnsub();
    statsUnsub = statsRef.onSnapshot(
      function (doc) {
        callback(doc.exists ? doc.data() : {});
      },
      function (err) {
        console.warn("hh: فشل متابعة الإحصائيات", err);
      }
    );
    return statsUnsub;
  };

  // حفظ رسالة "سيب رأيك" في قاعدة بيانات دائمة
  window.hhSaveFeedback = async function (payload) {
    try {
      await db.collection("feedback").add({
        name: String(payload.name || "").slice(0, 100),
        message: String(payload.message || "").slice(0, 2000),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        page: location.pathname + location.hash
      });
      return true;
    } catch (e) {
      console.warn("hh: فشل حفظ الرسالة", e);
      return false;
    }
  };

  window.hhBackendReady = true;
  console.info("✅ Backend (Firebase) شغال");
})();
