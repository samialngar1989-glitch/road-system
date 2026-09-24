// ═══════════════════════════════════════════════════════════
// 🚀 التهيئة الرئيسية
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  
  // حماية من إعادة تحميل الصفحة
  document.addEventListener('submit', function(e) {
    e.preventDefault();
    return false;
  });

  // ═══ الثيم (الوضع الليلي) ═══
  const savedTheme = localStorage.getItem('road_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeBtnIcon = document.querySelector('#themeBtn i');
  if (themeBtnIcon) themeBtnIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

  // ═══ زر الثيم ═══
  document.getElementById('themeBtn').addEventListener('click', toggleTheme);

  // ═══ زر التحديث ═══
  document.getElementById('refreshBtn').addEventListener('click', () => {
    showToast('جاري التحديث...', 'info');
    loadDashboard();
    loadProjects();
  });

  // ═══ زر القائمة الجانبية (☰) ═══
  document.getElementById('menuToggle').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
  });

  // ═══ زر كاشف الأخطاء ═══
  const anomalyBtn = document.getElementById('anomalyBtn');
  if (anomalyBtn) anomalyBtn.addEventListener('click', () => navigateTo('anomalies'));

  // ═══ زر الطباعة (الهيدر) ═══
  const printBtn = document.getElementById('printCurrentBtn');
  if (printBtn) printBtn.addEventListener('click', printCurrentPage);

  // ═══ عناصر القائمة الجانبية (التنقل) ═══
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      if (page) navigateTo(page);
    });
  });

  // ═══ إغلاق القائمة عند النقر خارجها (على الهاتف) ═══
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    if (!sidebar || !menuToggle) return;
    if (window.innerWidth <= 900) {
      if (sidebar.classList.contains('open') && 
          !sidebar.contains(e.target) && 
          !menuToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });

  // ═══ تحميل البيانات الأولية ═══
  loadProjects();
  loadDashboard();

  console.log('🛣️ نظام شركة هندسة الطرقات v' + CONFIG.VERSION + ' — جاهز للعمل');
  console.log('💡 افتح ☰ لرؤية القائمة الجانبية على الهاتف');
});
