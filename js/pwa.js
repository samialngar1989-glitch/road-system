// ═══════════════════════════════════════════════════════════
// 📱 تثبيت التطبيق PWA
// ═══════════════════════════════════════════════════════════

let deferredPrompt = null;

// تسجيل Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('✅ Service Worker مسجل'))
      .catch(err => console.log('⚠️ فشل تسجيل SW:', err));
  });
}

// حدث "يمكن التثبيت"
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // إظهار الزر الأخضر
  const installBtn = document.getElementById('installPwaBtn');
  if (installBtn) installBtn.style.display = 'flex';
  
  console.log('📱 التطبيق قابل للتثبيت');
});

// زر التثبيت
document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('installPwaBtn');
  const infoBtn = document.getElementById('infoBtn');

  // زر التثبيت
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) {
        // إذا كان مدعومًا لكن لم يُطلق الحدث بعد
        if (window.matchMedia('(display-mode: standalone)').matches) {
          showToast('التطبيق مثبت بالفعل ✅', 'success');
          return;
        }
        // للمتصفحات التي لا تدعم PWA تلقائيًا
        showToast('💡 افتح قائمة المتصفح → "إضافة إلى الشاشة الرئيسية"', 'info');
        return;
      }
      
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        showToast('🎉 تم تثبيت التطبيق بنجاح!', 'success');
      } else {
        showToast('تم إلغاء التثبيت', 'info');
      }
      
      deferredPrompt = null;
      installBtn.style.display = 'none';
    });
  }

  // زر المعلومات
  if (infoBtn) {
    infoBtn.addEventListener('click', () => {
      document.getElementById('infoModal').classList.add('active');
    });
  }

  // إذا كان التطبيق مثبتًا بالفعل، أخفِ الزر
  if (window.matchMedia('(display-mode: standalone)').matches) {
    if (installBtn) installBtn.style.display = 'none';
    console.log('📱 التطبيق يعمل في وضع التطبيق');
  }
});

// حدث اكتمال التثبيت
window.addEventListener('appinstalled', () => {
  console.log('✅ تم تثبيت التطبيق');
  const installBtn = document.getElementById('installPwaBtn');
  if (installBtn) installBtn.style.display = 'none';
  showToast('🎉 التطبيق مثبت على هاتفك!', 'success');
});

console.log('📱 pwa.js تم التحميل');
