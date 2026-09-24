// ═══════════════════════════════════════════════════════════
// ⚙️ الإعدادات العامة
// ═══════════════════════════════════════════════════════════
const CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxKdjGA5XARe4LYMT0HbOZDGSYPooeG-ho3D6Fk4YyuA5H3M0pRQJBbq4rmNp0CicED/exec',
  VERSION: '9.1.0',
  WORKDAY_HOURS: 8,
  OVERTIME_MULTIPLIER: 1.5
};

// ═══════════════════════════════════════════════════════════
// 📦 المتغيرات العامة
// ═══════════════════════════════════════════════════════════
let projectsData = [], sitesData = [], equipmentData = [], workersData = [];
let materialsData = [], invoicesData = [], suppliersData = [], expensesData = [];
let safetyData = [], qualityData = [], progressData = [], boqData = [];
let dailyEquipData = [], dailyWorkersData = [], supplyData = [];
let fuelData = [], purchasesData = [], maintenanceData = [], consoExpensesData = [];
let groupAttendanceData = [];
let salariesData = [], attachmentsData = [];
let currentUploads = { mt: [], inv: [], exp: [], del: [], dwl: [], ms: [], fl: [], pur: [] };
let charts = {};
let currentPage = 'dashboard';
let currentPlanData = null;
let spGanttChart = null;

// ═══════════════════════════════════════════════════════════
// 🌐 الاتصال بـ Google Apps Script
// ═══════════════════════════════════════════════════════════
async function apiGet(action, params = {}) {
  try {
    const query = new URLSearchParams({ action, ...params });
    const res = await fetch(`${CONFIG.SCRIPT_URL}?${query}`);
    return await res.json();
  } catch (e) { return { success: false, error: 'Connection failed: ' + e.message }; }
}

async function apiPost(action, data = {}) {
  try {
    const res = await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...data })
    });
    return await res.json();
  } catch (e) { return { success: false, error: 'Connection failed: ' + e.message }; }
}

// ═══════════════════════════════════════════════════════════
// 🛠️ دوال مساعدة
// ═══════════════════════════════════════════════════════════
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function setValue(id, val) { const el = document.getElementById(id); if (el) el.value = val || ''; }
function getValue(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function safeNum(val) { const n = Number(val); return isFinite(n) && !isNaN(n) ? n : 0; }

function formatCurrency(num) {
  const n = Number(num) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString('en-US');
}

function formatNum(num) {
  return (Number(num) || 0).toLocaleString('en-US');
}

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function escapeAttr(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function statusBadge(status) {
  const map = {
    'تخطيط': 'tag-warning', 'قيد التنفيذ': 'tag-info',
    'مكتمل': 'tag-success', 'متوقف': 'tag-danger',
    'يعمل': 'tag-success', 'صيانة': 'tag-warning',
    'لم يبدأ': 'tag-gray', 'استلم': 'tag-success', 'لم يستلم': 'tag-warning',
    'مسدد': 'tag-success', 'جزئي': 'tag-warning', 'غير مسدد': 'tag-danger'
  };
  return `<span class="tag ${map[status] || 'tag-gray'}">${escapeHtml(status || '')}</span>`;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function closeModalById(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function showConfirm(message, onConfirm) {
  const modal = document.getElementById('confirmModal');
  document.getElementById('confirmMessage').textContent = message;
  const btn = document.getElementById('confirmBtn');
  btn.onclick = () => { closeModalById('confirmModal'); onConfirm(); };
  modal.classList.add('active');
}

document.querySelectorAll('.modal-overlay').forEach(modal => {
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
});

// ═══════════════════════════════════════════════════════════
// 🖨️ طباعة الصفحة الحالية
// ═══════════════════════════════════════════════════════════
function printCurrentPage() {
  const pageEl = document.querySelector('.page.active');
  if (!pageEl) { showToast('لا توجد صفحة للطباعة', 'warning'); return; }
  const title = pageEl.querySelector('.page-title span')?.textContent || 'تقرير';
  const content = pageEl.innerHTML;

  // بناء محتوى التقرير
  const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<style>
  *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{font-family:'Tajawal',sans-serif;padding:20px;background:#fff;color:#0f172a;direction:rtl}
  h1,h2,h3{color:#2563eb}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:15px}
  th{background:#2563eb !important;color:#fff !important;padding:10px;text-align:right;font-weight:700}
  td{border:1px solid #e2e8f0;padding:8px;text-align:right}
  tr:nth-child(even){background:#f8fafc}
  .tag{display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700}
  .tag-success{background:#dcfce7;color:#166534}
  .tag-warning{background:#fef3c7;color:#92400e}
  .tag-danger{background:#fee2e2;color:#991b1b}
  .tag-info{background:#dbeafe;color:#1e40af}
  .tag-gray{background:#f1f5f9;color:#475569}
  .tag-purple{background:#e9d5ff;color:#6b21a8}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:15px}
  .stat-card{padding:12px;border:1px solid #e2e8f0;border-radius:8px;text-align:center;background:#f8fafc}
  .stat-info h3{margin:0;font-size:20px;color:#2563eb}
  .stat-info p{margin:4px 0 0;font-size:11px;color:#64748b}
  .stat-icon{display:none}
  .btn,.icon-btn,.menu-toggle,.modal-close,.upload-zone,.filter-row,.actions-cell,.nav-section{display:none !important}
  .card{border:1px solid #e2e8f0;border-radius:8px;margin-bottom:15px;background:#fff}
  .card-header{padding:12px;border-bottom:1px solid #e2e8f0;background:#f8fafc}
  .card-body{padding:12px}
  .page-header{margin-bottom:20px;border-bottom:3px solid #2563eb;padding-bottom:10px;display:flex;justify-content:space-between}
  .page-title{font-size:22px;margin:0;display:flex;align-items:center;gap:10px}
  .progress-bar{height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden}
  .progress-fill{height:100%;background:#2563eb}
  @media print{@page{size:A4 landscape;margin:10mm}}
</style>
</head>
<body>
  <div style="text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #2563eb">
    <h1 style="margin:0;color:#2563eb">🛣️ شركة الطرق للهندسة والمقاولات</h1>
    <p style="margin:5px 0;color:#64748b;font-size:13px;">تقرير: ${title} - ${new Date().toLocaleDateString('ar-YE')}</p>
  </div>
  ${content}
  <div style="margin-top:30px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px;">
    نظام شركة هندسة الطرقات v${CONFIG.VERSION} - تاريخ الطباعة: ${new Date().toLocaleString('ar-YE')}
  </div>
  <script>setTimeout(function(){window.print();},700);<\/script>
</body>
</html>`;

  // تحميل كـ Blob (يعمل على كل المتصفحات بما فيها الجوال)
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  
  // فتح في تاب جديد
  const w = window.open(blobUrl, '_blank');
  
  if (!w) {
    // إذا حجب المتصفح النافذة، استخدم طريقة أخرى
    const link = document.createElement('a');
    link.href = blobUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('⚠️ إذا لم تُفتح النافذة، اسمح بالنوافذ المنبثقة', 'warning');
  }
  
  // تنظيف الذاكرة بعد فترة
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}


// ═══════════════════════════════════════════════════════════
// 🎨 التنقل بين الصفحات
// ═══════════════════════════════════════════════════════════
function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (pageEl) pageEl.classList.add('active');
  if (navEl) navEl.classList.add('active');
  document.getElementById('sidebar').classList.remove('open');

  const today = new Date().toISOString().split('T')[0];
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'projects': loadProjects(); break;
    case 'sites': loadSites(); break;
    case 'boq': loadBOQPage(); break;
    case 'equipment': loadEquipment(); break;
    case 'maintenance': loadMaintenance(); break;
    case 'workers': loadWorkers(); break;
    case 'materials': loadMaterials(); break;
    case 'suppliers': loadSuppliers(); break;
    case 'invoices': loadInvoices(); break;
    case 'expenses': loadExpenses(); break;
    case 'safety': loadSafety(); break;
    case 'quality': loadQuality(); break;
    case 'progress': loadProgress(); break;
    case 'settings': loadFuelPrices(); break;
    case 'daily-equip':
      setValue('filterEquipDate', today);
      fillProjectFilter('filterEquipProject');
      loadDailyEquipLog();
      break;
    case 'daily-workers':
      setValue('filterWorkerDate', today);
      fillProjectFilter('filterWorkerProject');
      loadDailyWorkersLog();
      break;
    case 'attendance':
      setValue('attendanceDate', today);
      fillProjectSelect('attendanceProject');
      loadGroupAttendance();
      break;
    case 'material-supply':
      setValue('filterSupplyDate', today);
      fillProjectFilter('filterSupplyProject');
      loadMaterials();
      loadSuppliers();
      loadMaterialSupply();
      break;
    case 'fuel':
      setValue('filterFuelDate', today);
      loadFuelLog();
      break;
    case 'purchases':
      setValue('filterPurchaseDate', today);
      loadPurchases();
      break;
    case 'consolidated-expenses': loadConsolidatedExpenses(); break;
    case 'advanced-dashboard': loadAdvancedDashboard(); break;
    case 'profit-loss':
      fillProjectSelect('plProject');
      loadProjectPL();
      break;
    case 'equipment-cost': loadEquipmentForCost(); break;
    case 'worker-productivity': loadWorkerProductivity(); break;
    case 'anomalies': loadAnomalies(); break;
    case 'monthly-salaries': {
      const now = new Date();
      setValue('salYear', now.getFullYear());
      setValue('salMonth', now.getMonth() + 1);
      loadMonthlySalaries();
      break;
    }
    case 'person-statement': loadPersonsForStatement(); break;
    case 'equipment-statement': loadEquipmentForStatement(); break;
    case 'attachments': loadAttachments(); break;
    case 'smart-planner': 
      document.getElementById('sp_results').style.display = 'none';
      break;
    case 'saved-plans': loadSavedPlans(); break;
  }
}

function fillProjectFilter(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">كل المشاريع</option>' +
    projectsData.map(p => `<option value="${escapeAttr(p.projectId)}">${escapeHtml(p.name)}</option>`).join('');
  select.value = current;
}

function fillProjectSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">بدون مشروع</option>' +
    projectsData.map(p => `<option value="${escapeAttr(p.projectId)}">${escapeHtml(p.name)}</option>`).join('');
  select.value = current;
}

// ═══════════════════════════════════════════════════════════
// 🎨 الوضع الليلي
// ═══════════════════════════════════════════════════════════
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('road_theme', isDark ? 'light' : 'dark');
  document.querySelector('#themeBtn i').className = isDark ? 'fas fa-moon' : 'fas fa-sun';
}

// ═══════════════════════════════════════════════════════════
// 📷 رفع الملفات
// ═══════════════════════════════════════════════════════════
function handleModalUpload(input, prefix) {
  const files = Array.from(input.files || []);
  if (!currentUploads[prefix]) currentUploads[prefix] = [];
  files.forEach(f => {
    if (f.size > 5 * 1024 * 1024) { showToast(`الملف ${f.name} أكبر من 5MB`, 'warning'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      currentUploads[prefix].push({ name: f.name, type: f.type || 'image/jpeg', data: ev.target.result });
      renderThumbs(prefix);
    };
    reader.readAsDataURL(f);
  });
  input.value = '';
}

function renderThumbs(prefix) {
  const container = document.getElementById(prefix + '_thumbs');
  if (!container) return;
  const files = currentUploads[prefix] || [];
  container.innerHTML = files.map((f, i) => `
    <div class="thumb">
      <img src="${f.data}" alt="صورة">
      <button type="button" class="remove-btn" onclick="removeUpload('${prefix}',${i})">×</button>
    </div>
  `).join('');
}

function removeUpload(prefix, index) {
  if (currentUploads[prefix]) {
    currentUploads[prefix].splice(index, 1);
    renderThumbs(prefix);
  }
}

function clearUploads(prefix) {
  currentUploads[prefix] = [];
  renderThumbs(prefix);
}

async function uploadAttachments(prefix, refType, refId) {
  const files = currentUploads[prefix] || [];
  if (files.length === 0) return '';
  const uploaded = [];
  for (const f of files) {
    try {
      const res = await apiPost('uploadFileToDrive', {
        fileData: f.data, fileName: f.name, mimeType: f.type,
        refType: refType, refId: refId
      });
      if (res.success && res.data && res.data.fileUrl) uploaded.push(res.data.fileUrl);
    } catch(e) {}
  }
  return uploaded.join(',');
}

console.log('🛣️ core.js تم التحميل - v' + CONFIG.VERSION);
