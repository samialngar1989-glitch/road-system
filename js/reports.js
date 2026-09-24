// ═══════════════════════════════════════════════════════════
// 🏗️ التخطيط الذكي
// ═══════════════════════════════════════════════════════════
const PLANNING_CONFIG = {
  PRODUCTION_RATES: {
    'طريق سريع': { 'تحضير': 300, 'حفر': 200, 'ردم': 250, 'أساس': 150, 'رابطة': 200, 'سطحية': 250, 'إنهاء': 300 },
    'طريق رئيسي': { 'تحضير': 500, 'حفر': 300, 'ردم': 400, 'أساس': 200, 'رابطة': 300, 'سطحية': 400, 'إنهاء': 500 },
    'طريق فرعي': { 'تحضير': 600, 'حفر': 400, 'ردم': 500, 'أساس': 250, 'رابطة': 350, 'سطحية': 450, 'إنهاء': 600 }
  },
  SALARIES: {
    'مدير المشروع': 800000, 'مهندس المشروع': 500000, 'مهندس تنفيذ': 500000,
    'مهندس مساحة': 400000, 'مهندس مختبر': 400000, 'مشرف ردميات': 200000,
    'مشرف قطوعات': 200000, 'مساح': 250000, 'فني مختبر': 200000,
    'سائق معدات ثقيلة': 200000, 'سائق قلاب': 180000, 'عامل عام': 100000,
    'فني': 150000, 'طباخ': 100000, 'إداري': 150000
  },
  TEAM_TEMPLATES: {
    'مدير المشروع': { base: 1, per_km: 0 },
    'مهندس تنفيذ': { base: 0, per_km: 0.5 },
    'مهندس مساحة': { base: 0, per_km: 0.33 },
    'مهندس مختبر': { base: 1, per_km: 0 },
    'مشرف ردميات': { base: 0, per_km: 0.5 },
    'مشرف قطوعات': { base: 0, per_km: 0.5 },
    'مساح': { base: 0, per_km: 0.33 },
    'فني مختبر': { base: 1, per_km: 0 },
    'عامل عام': { base: 0, per_km: 5 },
    'فني': { base: 0, per_km: 1 },
    'طباخ': { base: 1, per_km: 0 },
    'إداري': { base: 1, per_km: 0 }
  },
  EQUIPMENT_TEMPLATES: {
    'بوكلين': { per_km: 0.75, rate: 200000, reason: 'أعمال الحفر' },
    'شيول': { per_km: 0.5, rate: 180000, reason: 'أعمال التحميل' },
    'جريدر': { per_km: 0.5, rate: 180000, reason: 'تسوية الطريق' },
    'مدحلة': { per_km: 0.5, rate: 180000, reason: 'ضغط الطبقات' },
    'دركتر': { per_km: 0.33, rate: 220000, reason: 'أعمال الحفر والتسوية' },
    'قلاب': { per_km: 1.5, rate: 150000, reason: 'نقل المواد' },
    'قاطرة': { per_km: 0.5, rate: 200000, reason: 'نقل المعدات' },
    'بوزة ماء': { per_km: 0.5, rate: 120000, reason: 'رش المياه' },
    'فرادة اسفلت': { per_km: 0.25, rate: 250000, reason: 'رصف الأسفلت' }
  },
  WORK_HOURS_PER_DAY: 8,
  WORK_DAYS_PER_MONTH: 26,
  TIMELINE_BUFFER: 1.2,
  TEAM_BUFFER: 1.1,
  EQUIPMENT_BUFFER: 1.15
};

async function generateSmartPlan() {
  const params = {
    projectType: getValue('sp_projectType'),
    lengthKm: getValue('sp_lengthKm'),
    widthM: getValue('sp_widthM'),
    layersCount: getValue('sp_layersCount'),
    startDate: getValue('sp_startDate'),
    durationDays: getValue('sp_durationDays'),
    contractValue: getValue('sp_contractValue'),
    location: getValue('sp_location')
  };
  if (!params.lengthKm || !params.widthM || !params.contractValue) {
    showToast('⚠️ أكمل الحقول المطلوبة', 'warning');
    return;
  }
  showToast('⏳ جاري التوليد...', 'info');
  const res = await apiPost('generateSmartPlan', params);
  if (!res.success) { showToast('❌ ' + res.error, 'error'); return; }
  currentPlanData = res.data;
  renderSmartPlan(res.data);
  showToast('✅ تم توليد الخطة', 'success');
  document.getElementById('sp_results').style.display = 'block';
  document.getElementById('sp_results').scrollIntoView({ behavior: 'smooth' });
}

function renderSmartPlan(data) {
  const { projectData, timeline, team, equipment, budget, boq, stats } = data;
  const profitClass = stats.profitPercent >= 15 ? 'green' : (stats.profitPercent >= 0 ? 'orange' : 'red');
  document.getElementById('sp_stats').innerHTML = `
    <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-calendar"></i></div>
      <div class="stat-info"><h3>${stats.totalDays}</h3><p>يوم متوقع</p></div></div>
    <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-users"></i></div>
      <div class="stat-info"><h3>${stats.totalTeam}</h3><p>شخص</p></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-truck-monster"></i></div>
      <div class="stat-info"><h3>${stats.totalEquipment}</h3><p>معدة</p></div></div>
    <div class="stat-card"><div class="stat-icon cyan"><i class="fas fa-coins"></i></div>
      <div class="stat-info"><h3>${formatCurrency(stats.totalEstimatedCost)}</h3><p>التكلفة</p></div></div>
    <div class="stat-card"><div class="stat-icon ${profitClass}"><i class="fas fa-chart-line"></i></div>
      <div class="stat-info"><h3>${formatCurrency(stats.profitMargin)}</h3><p>الربح (${stats.profitPercent}%)</p></div></div>
  `;
  document.getElementById('sp_timelineStatus').innerHTML = 
    `<span class="tag ${timeline.totalDays <= timeline.requiredDuration ? 'tag-success' : 'tag-warning'}">${timeline.status}</span>`;
  renderGanttChart(timeline.phases);
  document.getElementById('sp_timelineTable').innerHTML = timeline.phases.map((p, i) => `
    <tr>
      <td>${i+1}</td>
      <td><strong>${escapeHtml(p.phase)}</strong></td>
      <td>${escapeHtml(p.description)}</td>
      <td><span class="tag tag-info">${p.days} يوم</span></td>
      <td>${escapeHtml(p.startDate)}</td>
      <td>${escapeHtml(p.endDate)}</td>
    </tr>
  `).join('');
  document.getElementById('sp_teamCount').textContent = team.totalCount + ' شخص';
  document.getElementById('sp_teamTable').innerHTML = team.members.map(m => `
    <tr>
      <td><strong>${escapeHtml(m.role)}</strong></td>
      <td><span class="tag tag-info">${m.count}</span></td>
      <td>${formatNum(m.monthlySalary)}</td>
      <td><strong>${formatNum(m.totalMonthlyCost)}</strong></td>
    </tr>
  `).join('');
  document.getElementById('sp_teamFooter').innerHTML = `
    <tr style="background:var(--bg-hover);font-weight:800;">
      <td colspan="3">الإجمالي الشهري</td>
      <td style="color:var(--primary);">${formatNum(team.monthlyCost)} ر.ي</td>
    </tr>
  `;
  document.getElementById('sp_equipCount').textContent = equipment.totalCount + ' معدة';
  document.getElementById('sp_equipTable').innerHTML = equipment.items.map(e => `
    <tr>
      <td><strong>${escapeHtml(e.type)}</strong></td>
      <td><span class="tag tag-warning">${e.count}</span></td>
      <td>${escapeHtml(e.reason)}</td>
      <td>${formatNum(e.monthlyRate)}</td>
    </tr>
  `).join('');
  document.getElementById('sp_equipFooter').innerHTML = `
    <tr style="background:var(--bg-hover);font-weight:800;">
      <td colspan="3">الإجمالي الشهري</td>
      <td style="color:var(--warning);">${formatNum(equipment.monthlyCost)} ر.ي</td>
    </tr>
  `;
  const profitBadge = stats.profitPercent >= 15 
    ? `<span class="tag tag-success">ربح ${stats.profitPercent}%</span>`
    : stats.profitPercent >= 0
      ? `<span class="tag tag-warning">هامش ${stats.profitPercent}%</span>`
      : `<span class="tag tag-danger">خسارة ${stats.profitPercent}%</span>`;
  document.getElementById('sp_profitBadge').innerHTML = profitBadge;
  document.getElementById('sp_budgetTable').innerHTML = budget.categories.map(c => `
    <tr>
      <td><strong>${c.icon} ${escapeHtml(c.category)}</strong></td>
      <td><span class="tag tag-info">${c.percent}%</span></td>
      <td style="color:var(--danger);font-weight:700;">${formatNum(c.amount)}</td>
    </tr>
  `).join('');
  document.getElementById('sp_budgetFooter').innerHTML = `
    <tr style="background:var(--bg-hover);font-weight:800;">
      <td colspan="2">الإجمالي</td>
      <td style="color:var(--primary);">${formatNum(budget.totalCost)} ر.ي</td>
    </tr>
    <tr style="background:rgba(34,197,94,.1);font-weight:800;">
      <td colspan="2">المتبقي (ربح متوقع)</td>
      <td style="color:var(--success);">${formatNum(budget.remaining)} ر.ي</td>
    </tr>
  `;
  document.getElementById('sp_boqCount').textContent = boq.itemsCount + ' بند';
  document.getElementById('sp_boqTable').innerHTML = boq.items.map(item => `
    <tr>
      <td><span class="tag tag-gray">${escapeHtml(item.itemCode)}</span></td>
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td><span class="tag tag-info">${escapeHtml(item.unit)}</span></td>
      <td>${formatNum(item.quantity)}</td>
      <td>${formatNum(item.unitPrice)}</td>
      <td><strong>${formatNum(item.totalPrice)}</strong></td>
    </tr>
  `).join('');
  document.getElementById('sp_boqFooter').innerHTML = `
    <tr style="background:var(--bg-hover);font-weight:800;">
      <td colspan="5">الإجمالي</td>
      <td style="color:var(--primary);">${formatNum(boq.totalBOQ)} ر.ي</td>
    </tr>
  `;
}

function renderGanttChart(phases) {
  const ctx = document.getElementById('sp_ganttChart');
  if (!ctx) return;
  if (spGanttChart) spGanttChart.destroy();
  const labels = phases.map(p => p.phase);
  const data = phases.map(p => p.days);
  const colors = ['#06b6d4', '#2563eb', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#a855f7'];
  spGanttChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: labels, datasets: [{ label: 'المدة (يوم)', data: data, backgroundColor: colors, borderRadius: 8 }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.raw} يوم` } } },
      scales: { x: { beginAtZero: true, title: { display: true, text: 'أيام' } } }
    }
  });
}

function resetSmartPlanner() {
  document.getElementById('sp_results').style.display = 'none';
  currentPlanData = null;
  showToast('🔄 تم إعادة التعيين', 'info');
}

function saveSmartPlan() {
  if (!currentPlanData) { showToast('⚠️ لا توجد خطة للحفظ', 'warning'); return; }
  const pd = currentPlanData.projectData;
  document.getElementById('sp_planName').value = `${pd.projectType} - ${pd.location} (${pd.lengthKm} كم)`;
  document.getElementById('sp_confirm_type').textContent = pd.projectType;
  document.getElementById('sp_confirm_length').textContent = pd.lengthKm + ' كم × ' + pd.widthM + ' م';
  document.getElementById('sp_confirm_value').textContent = formatNum(pd.contractValue) + ' ر.ي';
  document.getElementById('sp_confirm_duration').textContent = currentPlanData.timeline.totalDays + ' يوم';
  document.getElementById('savePlanModal').classList.add('active');
}

async function confirmSavePlan() {
  if (!currentPlanData) return;
  const data = {
    planName: getValue('sp_planName') || 'خطة بدون اسم',
    planNotes: getValue('sp_planNotes'),
    planData: currentPlanData
  };
  const res = await apiPost('saveProjectPlan', data);
  if (res.success) {
    closeModalById('savePlanModal');
    showToast('✅ تم حفظ الخطة: ' + res.planId, 'success');
  } else showToast('❌ ' + res.error, 'error');
}

async function convertPlanToProject() {
  if (!currentPlanData) { showToast('⚠️ لا توجد خطة', 'warning'); return; }
  showConfirm('هل تريد إنشاء مشروع فعلي من هذه الخطة؟', async () => {
    showToast('⏳ جاري الإنشاء...', 'info');
    const pd = currentPlanData.projectData;
    const saveRes = await apiPost('saveProjectPlan', {
      planName: `${pd.projectType} - ${pd.location}`,
      planData: currentPlanData
    });
    if (!saveRes.success) { showToast('❌ فشل حفظ الخطة', 'error'); return; }
    const res = await apiPost('convertPlanToProject', { planId: saveRes.planId });
    if (res.success) { showToast('✅ ' + res.message, 'success'); loadProjects(); }
    else showToast('❌ ' + res.error, 'error');
  });
}

function printSmartPlan() {
  if (!currentPlanData) { showToast('⚠️ لا توجد خطة للطباعة', 'warning'); return; }
  try {
    const planHtml = buildPrintablePlan();
    const printWindow = window.open('', 'PrintPlan', 'width=1400,height=900,noopener,noreferrer');
    if (!printWindow) { showToast('⚠️ يرجى السماح بالنوافذ المنبثقة', 'warning'); return; }
    printWindow.document.open();
    printWindow.document.write(planHtml);
    printWindow.document.close();
  } catch (err) { showToast('❌ فشل الطباعة: ' + err.message, 'error'); }
}

function buildPrintablePlan() {
  const d = currentPlanData;
  const pd = d.projectData;
  const t = d.timeline, team = d.team, equip = d.equipment, budget = d.budget, boq = d.boq, stats = d.stats;
  const timelineRows = t.phases.map((p, i) => `<tr><td>${i+1}</td><td><strong>${p.phase}</strong></td><td>${p.description}</td><td>${p.days}</td><td>${p.startDate}</td><td>${p.endDate}</td></tr>`).join('');
  const teamRows = team.members.map(m => `<tr><td>${m.role}</td><td>${m.count}</td><td>${formatNum(m.monthlySalary)}</td><td>${formatNum(m.totalMonthlyCost)}</td></tr>`).join('');
  const equipRows = equip.items.map(e => `<tr><td>${e.type}</td><td>${e.count}</td><td>${e.reason}</td><td>${formatNum(e.monthlyRate)}</td></tr>`).join('');
  const budgetRows = budget.categories.map(c => `<tr><td>${c.icon} ${c.category}</td><td>${c.percent}%</td><td>${formatNum(c.amount)}</td></tr>`).join('');
  const boqRows = boq.items.map(item => `<tr><td>${item.itemCode}</td><td>${item.name}</td><td>${item.unit}</td><td>${formatNum(item.quantity)}</td><td>${formatNum(item.unitPrice)}</td><td>${formatNum(item.totalPrice)}</td></tr>`).join('');
  const profitColor = stats.profitPercent >= 15 ? '#166534' : stats.profitPercent >= 0 ? '#92400e' : '#991b1b';
  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>الخطة الذكية</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-family:'Tajawal',sans-serif;padding:20px;background:#fff;color:#0f172a;direction:rtl;margin:0}.header{text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:3px solid #2563eb}.header h1{margin:0;color:#2563eb;font-size:22px}.header .subtitle{margin:8px 0 0 0;color:#64748b;font-size:13px}.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px}.stat{padding:12px;border:1px solid #e2e8f0;border-radius:8px;text-align:center;background:#f8fafc}.stat-value{margin:0;font-size:18px;font-weight:800;color:#2563eb}.stat-label{margin:4px 0 0 0;font-size:11px;color:#64748b}.section{margin-bottom:25px;page-break-inside:avoid}.section-title{background:#2563eb;color:#fff;padding:10px 15px;margin:0 0 10px 0;border-radius:8px;font-size:15px;font-weight:700}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#e2e8f0 !important;color:#0f172a !important;padding:8px;text-align:right;font-weight:700;border:1px solid #cbd5e1}td{border:1px solid #cbd5e1;padding:7px 8px;text-align:right}tr:nth-child(even) td{background:#f8fafc}.total-row{background:#dbeafe !important;font-weight:800}.total-row td{background:#dbeafe !important}.profit-row{background:#dcfce7 !important}.profit-row td{background:#dcfce7 !important;color:#166534;font-weight:800}.footer{margin-top:30px;padding-top:15px;border-top:2px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8}@media print{@page{size:A4 portrait;margin:10mm}body{padding:0}.section{page-break-inside:avoid}}</style></head>
<body><div class="header"><h1>🛣️ شركة الطرق للهندسة والمقاولات</h1><p class="subtitle">الخطة الذكية للمشروع — ${new Date().toLocaleDateString('ar-YE')}</p></div>
<div class="stats"><div class="stat"><p class="stat-value">${stats.totalDays}</p><p class="stat-label">يوم متوقع</p></div><div class="stat"><p class="stat-value">${stats.totalTeam}</p><p class="stat-label">شخص</p></div><div class="stat"><p class="stat-value">${stats.totalEquipment}</p><p class="stat-label">معدة</p></div><div class="stat"><p class="stat-value">${formatCurrency(stats.totalEstimatedCost)}</p><p class="stat-label">التكلفة (ر.ي)</p></div><div class="stat"><p class="stat-value" style="color:${profitColor}">${stats.profitPercent}%</p><p class="stat-label">نسبة الربح</p></div></div>
<div class="section"><h2 class="section-title">📋 بيانات المشروع</h2><table><tr><th style="width:30%;">النوع</th><td>${pd.projectType}</td></tr><tr><th>الموقع</th><td>${pd.location || '—'}</td></tr><tr><th>الطول × العرض</th><td>${pd.lengthKm} كم × ${pd.widthM} م</td></tr><tr><th>عدد الطبقات</th><td>${pd.layersCount}</td></tr><tr><th>تاريخ البدء</th><td>${pd.startDate}</td></tr><tr><th>المدة المطلوبة</th><td>${pd.durationDays} يوم</td></tr><tr><th>القيمة التعاقدية</th><td>${formatNum(pd.contractValue)} ر.ي</td></tr></table></div>
<div class="section"><h2 class="section-title">📅 الجدول الزمني (${t.totalDays} يوم)</h2><table><thead><tr><th>#</th><th>المرحلة</th><th>الوصف</th><th>المدة (يوم)</th><th>من</th><th>إلى</th></tr></thead><tbody>${timelineRows}<tr class="total-row"><td colspan="3">الإجمالي</td><td>${t.totalDays}</td><td>${t.startDate}</td><td>${t.endDate}</td></tr></tbody></table></div>
<div class="section"><h2 class="section-title">👥 التشكيل الفني (${team.totalCount} شخص)</h2><table><thead><tr><th>الوظيفة</th><th>العدد</th><th>الراتب الشهري</th><th>الإجمالي</th></tr></thead><tbody>${teamRows}<tr class="total-row"><td colspan="3">الإجمالي الشهري</td><td>${formatNum(team.monthlyCost)} ر.ي</td></tr></tbody></table></div>
<div class="section"><h2 class="section-title">🚜 المعدات (${equip.totalCount} معدة)</h2><table><thead><tr><th>النوع</th><th>العدد</th><th>الغرض</th><th>الإيجار الشهري</th></tr></thead><tbody>${equipRows}<tr class="total-row"><td colspan="3">الإجمالي الشهري</td><td>${formatNum(equip.monthlyCost)} ر.ي</td></tr></tbody></table></div>
<div class="section"><h2 class="section-title">💰 الميزانية التقديرية</h2><table><thead><tr><th>الفئة</th><th>النسبة</th><th>المبلغ (ر.ي)</th></tr></thead><tbody>${budgetRows}<tr class="total-row"><td colspan="2">الإجمالي</td><td>${formatNum(budget.totalCost)}</td></tr><tr class="profit-row"><td colspan="2">الربح المتوقع (${stats.profitPercent}%)</td><td>${formatNum(budget.remaining)}</td></tr></tbody></table></div>
<div class="section"><h2 class="section-title">📋 بنود BOQ (${boq.itemsCount} بند)</h2><table><thead><tr><th>الكود</th><th>البند</th><th>الوحدة</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead><tbody>${boqRows}<tr class="total-row"><td colspan="5">الإجمالي</td><td>${formatNum(boq.totalBOQ)} ر.ي</td></tr></tbody></table></div>
<div class="footer">نظام شركة هندسة الطرقات v9.1.0 — ${new Date().toLocaleString('ar-YE')}</div>
<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},500)})<\/script></body></html>`;
}

async function loadSavedPlans() {
  const tbody = document.getElementById('savedPlansTable');
  tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;"><span class="loader" style="border-top-color:var(--primary);"></span></td></tr>';
  const res = await apiGet('getProjectPlans');
  if (!res.success) { tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--danger);">خطأ</td></tr>'; return; }
  const plans = res.data || [];
  if (plans.length === 0) { tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد خطط محفوظة</td></tr>'; return; }
  tbody.innerHTML = plans.map((p, i) => {
    const profitPercent = safeNum(p.profitPercent);
    const profitClass = profitPercent >= 15 ? 'tag-success' : (profitPercent >= 0 ? 'tag-warning' : 'tag-danger');
    const statusClass = p.status === 'تم التحويل لمشروع' ? 'tag-success' : 'tag-info';
    return `<tr>
      <td>${i+1}</td><td>${escapeHtml(p.date || '')}</td>
      <td><strong>${escapeHtml(p.projectType || '')}</strong></td>
      <td>${escapeHtml(p.location || '')}</td>
      <td>${p.lengthKm || 0} كم</td><td>${p.totalDays || 0} يوم</td>
      <td>${formatCurrency(p.contractValue || 0)}</td>
      <td><span class="tag ${profitClass}">${formatCurrency(p.profitMargin)} (${profitPercent}%)</span></td>
      <td><span class="tag ${statusClass}">${escapeHtml(p.status || 'مُخطط')}</span></td>
      <td class="actions-cell">
        <button type="button" class="btn-icon delete" onclick="deleteSavedPlan('${escapeAttr(p.planId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

async function deleteSavedPlan(planId) {
  showConfirm('هل تريد حذف هذه الخطة؟', async () => {
    const res = await apiPost('deleteProjectPlan', { planId: planId });
    if (res.success) { showToast('✅ تم الحذف', 'success'); loadSavedPlans(); }
    else showToast('❌ ' + res.error, 'error');
  });
}

// ═══════════════════════════════════════════════════════════
// التقارير المتقدمة
// ═══════════════════════════════════════════════════════════
async function loadAdvancedDashboard() {
  const res = await apiGet('getAdvancedDashboard');
  if (!res.success) { showToast('فشل', 'error'); return; }
  const d = res.data;
  document.getElementById('advStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon red"><i class="fas fa-exclamation-triangle"></i></div>
      <div class="stat-info"><h3>${d.anomalies.total}</h3><p>المشاكل</p></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-fire"></i></div>
      <div class="stat-info"><h3>${d.anomalies.high}</h3><p>حرجة</p></div></div>
    <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-exclamation"></i></div>
      <div class="stat-info"><h3>${d.anomalies.medium}</h3><p>متوسطة</p></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-road"></i></div>
      <div class="stat-info"><h3>${d.projectsSummary.length}</h3><p>مشاريع نشطة</p></div></div>
    <div class="stat-card"><div class="stat-icon cyan"><i class="fas fa-tools"></i></div>
      <div class="stat-info"><h3>${d.urgentMaintenance.length}</h3><p>صيانة عاجلة</p></div></div>
  `;
  document.getElementById('advProjectsSummary').innerHTML = d.projectsSummary.length === 0
    ? '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">لا توجد مشاريع</td></tr>'
    : d.projectsSummary.map(p => `
      <tr>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td style="color:var(--success);">${formatCurrency(p.revenue)}</td>
        <td style="color:var(--danger);">${formatCurrency(p.expenses)}</td>
        <td style="color:${p.grossProfit >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:800;">${formatCurrency(p.grossProfit)}</td>
        <td><span class="tag ${p.marginPercent >= 20 ? 'tag-success' : p.marginPercent >= 0 ? 'tag-warning' : 'tag-danger'}">${p.marginPercent}%</span></td>
        <td>${p.progress}%</td>
      </tr>
    `).join('');
  const mEl = document.getElementById('advUrgentMaint');
  if (d.urgentMaintenance.length === 0) {
    mEl.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-muted);">لا توجد ✅</td></tr>';
  } else {
    const equipData = await apiGet('getEquipment');
    const equipMap = {};
    if (equipData.success) equipData.data.forEach(e => equipMap[e.equipId] = e.name);
    mEl.innerHTML = d.urgentMaintenance.map(m => `
      <tr>
        <td><strong>${escapeHtml(equipMap[m.equipId] || m.equipId)}</strong></td>
        <td>${escapeHtml(m.date)}</td><td>${escapeHtml(m.nextDate || '-')}</td>
        <td>${m.colorStatus === 'red' ? '<span class="tag tag-danger">🔴</span>' : '<span class="tag tag-warning">🟡</span>'}</td>
      </tr>
    `).join('');
  }
  document.getElementById('advTopSuppliers').innerHTML = d.topSuppliers.map(s => `
    <tr>
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td><span class="tag tag-info">${escapeHtml(s.type || '')}</span></td>
      <td style="color:var(--primary);">${formatNum(s.suppliedTotal)}</td>
      <td style="color:var(--danger);">${formatNum(s.purchasedTotal)}</td>
      <td style="color:var(--success);">${formatNum(s.paidTotal || 0)}</td>
      <td style="color:var(--warning);font-weight:800;">${formatNum(s.currentBalance)}</td>
    </tr>
  `).join('');
}

async function loadProjectPL() {
  const projectId = getValue('plProject');
  if (!projectId) { document.getElementById('plContent').innerHTML = '<div class="empty-state"><i class="fas fa-chart-line"></i><h3>اختر مشروعاً</h3></div>'; return; }
  document.getElementById('plContent').innerHTML = '<div style="text-align:center;padding:40px;"><span class="loader" style="border-top-color:var(--primary);"></span></div>';
  const res = await apiGet('getProjectProfitLoss', { projectId });
  if (!res.success) { showToast(res.error, 'error'); return; }
  const d = res.data;
  const expRows = Object.entries(d.expenses.byType).map(([k, v]) => `
    <tr><td><span class="tag tag-gray">${escapeHtml(k)}</span></td>
    <td style="color:var(--danger);font-weight:700;">${formatNum(v)}</td>
    <td>${d.expenses.total > 0 ? ((v / d.expenses.total) * 100).toFixed(1) : 0}%</td></tr>
  `).join('');
  document.getElementById('plContent').innerHTML = `
    <div class="card"><div class="card-header"><h3 class="card-title">${escapeHtml(d.project.name)}</h3>${statusBadge(d.project.status)}</div></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-file-invoice"></i></div>
        <div class="stat-info"><h3>${formatCurrency(d.revenue.billed)}</h3><p>الفواتير</p></div></div>
      <div class="stat-card"><div class="stat-icon green"><i class="fas fa-money-bill-wave"></i></div>
        <div class="stat-info"><h3>${formatCurrency(d.revenue.collected)}</h3><p>المقبوضات</p></div></div>
      <div class="stat-card"><div class="stat-icon red"><i class="fas fa-clock"></i></div>
        <div class="stat-info"><h3>${formatCurrency(d.revenue.receivables)}</h3><p>المستحقات</p></div></div>
      <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-receipt"></i></div>
        <div class="stat-info"><h3>${formatCurrency(d.expenses.total)}</h3><p>المصروفات</p></div></div>
      <div class="stat-card"><div class="stat-icon ${d.metrics.grossProfit >= 0 ? 'green' : 'red'}"><i class="fas fa-chart-line"></i></div>
        <div class="stat-info"><h3>${formatCurrency(d.metrics.grossProfit)}</h3><p>الربح</p></div></div>
      <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-percent"></i></div>
        <div class="stat-info"><h3>${d.metrics.marginPercent}%</h3><p>الهامش</p></div></div>
    </div>
    <div class="grid-2">
      <div class="card"><div class="card-header"><h3 class="card-title">توزيع المصروفات</h3></div>
        <div class="table-wrapper"><table class="table">
          <thead><tr><th>النوع</th><th>المبلغ</th><th>النسبة</th></tr></thead>
          <tbody>${expRows || '<tr><td colspan="3" style="text-align:center;">لا توجد</td></tr>'}</tbody>
        </table></div>
      </div>
      <div class="card"><div class="card-header"><h3 class="card-title">المؤشرات</h3></div>
        <div class="card-body"><div style="display:flex;flex-direction:column;gap:15px;">
          <div><strong>قيمة العقد:</strong> ${formatNum(d.metrics.contractValue)} ر.ي</div>
          <div><strong>الميزانية المتبقية:</strong> <span style="color:${d.metrics.remainingBudget >= 0 ? 'var(--success)' : 'var(--danger)'}">${formatNum(d.metrics.remainingBudget)}</span></div>
          <div><strong>معدل الاستهلاك:</strong> ${d.metrics.burnRatePercent}%</div>
        </div></div>
      </div>
    </div>
  `;
}

async function loadEquipmentForCost() {
  await loadEquipment();
  const sel = document.getElementById('ecEquip');
  if (sel) sel.innerHTML = '<option value="">اختر المعدة</option>' +
    equipmentData.map(e => `<option value="${escapeAttr(e.equipId)}">${escapeHtml(e.name)}</option>`).join('');
}

async function loadEquipmentCost() {
  const equipId = getValue('ecEquip');
  if (!equipId) { showToast('اختر معدة', 'warning'); return; }
  document.getElementById('ecContent').innerHTML = '<div style="text-align:center;padding:40px;"><span class="loader" style="border-top-color:var(--primary);"></span></div>';
  const res = await apiGet('getEquipmentCostAnalysis', { equipId });
  if (!res.success) { showToast(res.error, 'error'); return; }
  const d = res.data;
  const bd = d.breakdown;
  const sum = bd.rent + bd.diesel + bd.maintenance + bd.depreciation || 1;
  document.getElementById('ecContent').innerHTML = `
    <div class="card"><div class="card-header"><h3 class="card-title">${escapeHtml(d.name)}</h3></div></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-clock"></i></div>
        <div class="stat-info"><h3>${d.totalHours}</h3><p>ساعات</p></div></div>
      <div class="stat-card"><div class="stat-icon cyan"><i class="fas fa-calendar"></i></div>
        <div class="stat-info"><h3>${d.uniqueDays}</h3><p>أيام</p></div></div>
      <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-tachometer-alt"></i></div>
        <div class="stat-info"><h3>${d.utilizationPercent}%</h3><p>استغلال</p></div></div>
      <div class="stat-card"><div class="stat-icon red"><i class="fas fa-coins"></i></div>
        <div class="stat-info"><h3>${formatCurrency(d.totalCost)}</h3><p>الإجمالي</p></div></div>
      <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-hourglass"></i></div>
        <div class="stat-info"><h3>${formatNum(d.costPerHour)}</h3><p>التكلفة/ساعة</p></div></div>
    </div>
    <div class="card"><div class="card-header"><h3 class="card-title">تفصيل التكلفة</h3></div>
      <div class="card-body">
        <div class="report-metric">
          <div class="metric-box" style="border-right-color:var(--primary);"><div class="label">إيجار</div>
            <div class="value" style="color:var(--primary);">${formatNum(bd.rent)}</div>
            <div class="sub">${((bd.rent / sum) * 100).toFixed(1)}%</div></div>
          <div class="metric-box" style="border-right-color:var(--danger);"><div class="label">ديزل</div>
            <div class="value" style="color:var(--danger);">${formatNum(bd.diesel)}</div>
            <div class="sub">${((bd.diesel / sum) * 100).toFixed(1)}%</div></div>
          <div class="metric-box" style="border-right-color:var(--warning);"><div class="label">صيانة</div>
            <div class="value" style="color:var(--warning);">${formatNum(bd.maintenance)}</div>
            <div class="sub">${((bd.maintenance / sum) * 100).toFixed(1)}%</div></div>
          <div class="metric-box" style="border-right-color:#a855f7;"><div class="label">إهلاك</div>
            <div class="value" style="color:#a855f7;">${formatNum(bd.depreciation)}</div>
            <div class="sub">${((bd.depreciation / sum) * 100).toFixed(1)}%</div></div>
        </div>
      </div>
    </div>
  `;
}

async function loadWorkerProductivity() {
  const res = await apiGet('getWorkerProductivityReport', { from: getValue('wpFrom'), to: getValue('wpTo') });
  if (!res.success) { showToast('خطأ', 'error'); return; }
  const d = res.data;
  document.getElementById('wpStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon green"><i class="fas fa-check"></i></div>
      <div class="stat-info"><h3>${d.totals.totalPresent}</h3><p>حضور</p></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fas fa-times"></i></div>
      <div class="stat-info"><h3>${d.totals.totalAbsent}</h3><p>غياب</p></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-clock"></i></div>
      <div class="stat-info"><h3>${d.totals.totalOvertime}</h3><p>إضافي</p></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-coins"></i></div>
      <div class="stat-info"><h3>${formatCurrency(d.totals.totalNetWage)}</h3><p>الأجور</p></div></div>
  `;
  document.getElementById('wpTable').innerHTML = d.workers.length === 0
    ? '<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد بيانات</td></tr>'
    : d.workers.map((w, i) => `
      <tr>
        <td>${i+1}</td><td><strong>${escapeHtml(w.name)}</strong></td>
        <td><span class="tag tag-info">${escapeHtml(w.job || '')}</span></td>
        <td style="color:var(--success);font-weight:700;">${w.presentDays}</td>
        <td style="color:var(--danger);font-weight:700;">${w.absentDays}</td>
        <td style="color:var(--warning);font-weight:700;">${w.leaveDays}</td>
        <td><span class="tag tag-info">${w.totalOvertime || 0} س</span></td>
        <td><span class="tag ${w.attendanceRate >= 90 ? 'tag-success' : w.attendanceRate >= 70 ? 'tag-warning' : 'tag-danger'}">${w.attendanceRate}%</span></td>
        <td><strong style="color:var(--primary);">${formatNum(w.netWage)}</strong></td>
      </tr>
    `).join('');
}

async function loadAnomalies() {
  document.getElementById('anomaliesTable').innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;"><span class="loader" style="border-top-color:var(--primary);"></span></td></tr>';
  const res = await apiGet('detectAnomalies');
  if (!res.success) { showToast('خطأ', 'error'); return; }
  const d = res;
  document.getElementById('anomalyStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-list"></i></div>
      <div class="stat-info"><h3>${d.summary.total}</h3><p>إجمالي</p></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fas fa-fire"></i></div>
      <div class="stat-info"><h3>${d.summary.high}</h3><p>حرجة</p></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-exclamation"></i></div>
      <div class="stat-info"><h3>${d.summary.medium}</h3><p>متوسطة</p></div></div>
  `;
  const typeNames = { 'DWL_DUPLICATE': 'تكرار سجل عامل', 'CE_DUPLICATE': 'تكرار مصروف', 'INV_MISMATCH': 'فاتورة غير متطابقة', 'ORPHAN_FUEL': 'وقود بسجل معدوم', 'NEGATIVE': 'قيمة سالبة', 'INVALID_HOURS': 'ساعات غير منطقية' };
  document.getElementById('anomaliesTable').innerHTML = d.issues.length === 0
    ? '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--success);font-weight:700;">✅ لا توجد مشاكل</td></tr>'
    : d.issues.map((issue, i) => `
      <tr class="${issue.severity === 'high' ? 'row-red' : 'row-yellow'}">
        <td>${i+1}</td>
        <td>${issue.severity === 'high' ? '<span class="tag tag-danger">🔴</span>' : '<span class="tag tag-warning">🟡</span>'}</td>
        <td><span class="tag tag-info">${escapeHtml(typeNames[issue.type] || issue.type)}</span></td>
        <td>${escapeHtml(issue.message)}</td>
        <td style="font-size:12px;color:var(--text-muted);">${escapeHtml((issue.refs || []).join(', '))}</td>
      </tr>
    `).join('');
}

// ═══════════════════════════════════════════════════════════
// 💰 كشف الرواتب الشهري
// ═══════════════════════════════════════════════════════════
async function loadMonthlySalaries() {
  const year = Number(getValue('salYear'));
  const month = Number(getValue('salMonth'));
  if (!year || !month) return;

  const tbody = document.getElementById('salTable');
  tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:30px;"><span class="loader" style="border-top-color:var(--primary);"></span></td></tr>';

  const res = await apiGet('getMonthlySalaryStatement', { year, month });
  if (!res.success) { showToast(res.error, 'error'); return; }

  const d = res.data;
  salariesData = d.workers;

  document.getElementById('salStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-users"></i></div>
      <div class="stat-info"><h3>${d.workers.length}</h3><p>عدد العمال</p></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fas fa-check"></i></div>
      <div class="stat-info"><h3>${d.totals.totalPresent}</h3><p>أيام حضور</p></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-coins"></i></div>
      <div class="stat-info"><h3>${formatCurrency(d.totals.totalWages)}</h3><p>إجمالي اليوميات</p></div></div>
    <div class="stat-card"><div class="stat-icon cyan"><i class="fas fa-clock"></i></div>
      <div class="stat-info"><h3>${formatCurrency(d.totals.totalOvertime || 0)}</h3><p>الساعات الإضافية</p></div></div>
    <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-money-bill"></i></div>
      <div class="stat-info"><h3>${formatCurrency(d.totals.totalMonthly)}</h3><p>الرواتب</p></div></div>
    <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-calculator"></i></div>
      <div class="stat-info"><h3>${formatCurrency(d.totals.totalNet)}</h3><p>صافي الإجمالي</p></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fas fa-hourglass"></i></div>
      <div class="stat-info"><h3>${formatCurrency(d.totals.totalRemaining)}</h3><p>المتبقي</p></div></div>
  `;

  tbody.innerHTML = d.workers.length === 0
    ? '<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد بيانات</td></tr>'
    : d.workers.map((w, i) => {
      const statusTag = w.status === 'مسدد' ? 'tag-success' : w.status === 'جزئي' ? 'tag-warning' : 'tag-danger';
      const dailyDisplay = w.totalOvertimeAmount > 0
        ? `${formatNum(w.dailyNet)} <br><small style="color:var(--info);font-size:11px;">(يشمل إضافي ${formatNum(w.totalOvertimeAmount)})</small>`
        : formatNum(w.dailyNet);
      return `<tr>
        <td>${i+1}</td>
        <td><strong>${escapeHtml(w.name)}</strong></td>
        <td><span class="tag tag-info">${escapeHtml(w.job || '')}</span></td>
        <td style="color:var(--success);font-weight:700;">${w.presentDays}</td>
        <td>${dailyDisplay}</td>
        <td><strong style="color:var(--purple);">${formatNum(w.salaryDue)}</strong>
            <br><small style="color:var(--text-muted);font-size:11px;">${escapeHtml(w.salaryStatus)}</small></td>
        <td style="color:${w.previousPending > 0 ? 'var(--danger)' : 'var(--text-muted)'};font-weight:700;">
          ${w.previousPending > 0 ? formatNum(w.previousPending) : '-'}
        </td>
        <td><strong style="color:var(--gold);font-size:15px;">${formatNum(w.grandTotal)}</strong></td>
        <td style="color:var(--success);">${formatNum(w.paid)}</td>
        <td style="color:var(--danger);font-weight:700;">${formatNum(w.remaining)}</td>
        <td><span class="tag ${statusTag}">${w.status}</span></td>
        <td class="actions-cell">
          <button type="button" class="btn-icon edit" title="دفع" onclick='openSalaryPayModal(${JSON.stringify(w).replace(/'/g, "\\'")})'>
            <i class="fas fa-money-bill"></i>
          </button>
        </td>
      </tr>`;
    }).join('');

  setText('salTotalWages', formatNum(d.totals.totalWages));
  setText('salTotalMonthly', formatNum(d.totals.totalMonthly));
  setText('salTotalPending', formatNum(d.totals.totalPending));
  setText('salTotalNet', formatNum(d.totals.totalNet));
  setText('salTotalPaid', formatNum(d.totals.totalPaid));
  setText('salTotalRemaining', formatNum(d.totals.totalRemaining));
}

async function openSalaryPayModal(worker) {
  const year = Number(getValue('salYear'));
  const month = Number(getValue('salMonth'));
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  document.getElementById('sp_workerId').value = worker.workerId;
  document.getElementById('sp_month').value = monthStr;
  document.getElementById('sp_netSalary').value = worker.grandTotal;
  document.getElementById('sp_baseSalary').value = worker.salary;
  document.getElementById('sp_presentDays').value = worker.presentDays;
  document.getElementById('sp_totalWages').value = worker.totalWages;
  document.getElementById('sp_totalDiscounts').value = worker.totalDiscounts;
  document.getElementById('sp_totalBonuses').value = worker.totalBonuses;

  const pendingInfo = worker.previousPending > 0
    ? `<br><small style="color:var(--danger);">يشمل سلفة معلقة: ${formatNum(worker.previousPending)} ر.ي</small>`
    : '';
  document.getElementById('sp_workerName').innerHTML = 
    escapeHtml(worker.name) + ' - ' + escapeHtml(worker.job || '') + pendingInfo;
  setText('sp_monthLabel', monthStr);
  setText('sp_netLabel', formatNum(worker.grandTotal) + ' ر.ي');
  setText('sp_paidLabel', formatNum(worker.paid) + ' ر.ي');
  setText('sp_remainingLabel', formatNum(worker.remaining) + ' ر.ي');
  setValue('sp_paid', Math.max(0, worker.remaining));
  setValue('sp_paidDate', new Date().toISOString().split('T')[0]);
  setValue('sp_notes', '');

  const limitRes = await apiGet('getWithdrawalLimit', {
    workerId: worker.workerId, month: monthStr,
    asOfDate: new Date().toISOString().split('T')[0]
  });
  
  if (limitRes.success) {
    const l = limitRes.data;
    setText('sp_limitValue', formatNum(l.maxWithdrawal) + ' ر.ي');
    setText('sp_netLabel', formatNum(l.totalDueThisMonth || worker.grandTotal) + ' ر.ي');
    setText('sp_paidLabel', formatNum(l.totalPaidThisMonth || worker.paid) + ' ر.ي');
    setText('sp_remainingLabel', formatNum(l.remainingThisMonth || worker.remaining) + ' ر.ي');
    setValue('sp_paid', Math.max(0, l.maxWithdrawal));
    const box = document.getElementById('sp_limitBox');
    if (l.maxWithdrawal <= 0) box.classList.add('warning');
    else box.classList.remove('warning');
  }

  const histRes = await apiGet('getWithdrawalsHistory', { workerId: worker.workerId, month: monthStr });
  if (histRes.success && histRes.data.withdrawals.length > 0) {
    const box = document.getElementById('sp_historyBox');
    box.style.display = 'block';
    document.getElementById('sp_historyList').innerHTML = histRes.data.withdrawals.map(w =>
      `<div class="withdrawal-item"><span class="date">${escapeHtml(w.date)}</span><span class="amount">${formatNum(w.amount)} ر.ي</span></div>`
    ).join('');
  } else {
    document.getElementById('sp_historyBox').style.display = 'none';
  }

  document.getElementById('salaryPayModal').classList.add('active');
}

async function confirmSalaryPayment() {
  const data = {
    workerId: getValue('sp_workerId'),
    month: getValue('sp_month'),
    netSalary: getValue('sp_netSalary'),
    baseSalary: getValue('sp_baseSalary'),
    presentDays: getValue('sp_presentDays'),
    totalWages: getValue('sp_totalWages'),
    totalDiscounts: getValue('sp_totalDiscounts'),
    totalBonuses: getValue('sp_totalBonuses'),
    paid: getValue('sp_paid'),
    paidDate: getValue('sp_paidDate'),
    notes: getValue('sp_notes')
  };
  if (!data.paid || Number(data.paid) <= 0) { showToast('أدخل المبلغ', 'warning'); return; }

  const result = await apiPost('saveSalaryWithdrawal', {
    workerId: data.workerId, month: data.month,
    amount: data.paid, paidDate: data.paidDate,
    notes: data.notes, baseSalary: data.baseSalary
  });

  if (result.success) {
    closeModalById('salaryPayModal');
    showToast('✅ ' + result.message, 'success');
    loadMonthlySalaries();
  } else {
    if (result.maxAllowed !== undefined) {
      showToast(`❌ تجاوز السقف. المتاح: ${formatNum(result.maxAllowed)} ر.ي`, 'error');
    } else showToast(result.error, 'error');
  }
}

// ═══════════════════════════════════════════════════════════
// كشف حساب شخص
// ═══════════════════════════════════════════════════════════
async function loadPersonsForStatement() {
  await loadWorkers();
  const sel = document.getElementById('psWorkerId');
  sel.innerHTML = '<option value="">اختر العامل</option>' +
    workersData.map(w => `<option value="${escapeAttr(w.workerId)}">${escapeHtml(w.name)} - ${escapeHtml(w.job || '')}</option>`).join('');
}

function filterPersonList() {
  const q = String(getValue('psSearchBox')).toLowerCase().trim();
  const sel = document.getElementById('psWorkerId');
  const filtered = q ? workersData.filter(w => String(w.name).toLowerCase().includes(q)) : workersData;
  sel.innerHTML = '<option value="">اختر العامل</option>' +
    filtered.map(w => `<option value="${escapeAttr(w.workerId)}">${escapeHtml(w.name)} - ${escapeHtml(w.job || '')}</option>`).join('');
}

async function loadPersonStatement() {
  const workerId = getValue('psWorkerId');
  if (!workerId) { document.getElementById('psContent').innerHTML = '<div class="empty-state"><i class="fas fa-user-tie"></i><h3>اختر عاملاً</h3></div>'; return; }
  document.getElementById('psContent').innerHTML = '<div style="text-align:center;padding:40px;"><span class="loader" style="border-top-color:var(--primary);"></span></div>';

  const res = await apiGet('getPersonStatement', { workerId });
  if (!res.success) { showToast(res.error, 'error'); return; }
  const d = res.data;
  const t = d.totals;

  const rows = d.movements.map((m, i) => `
    <tr>
      <td>${i+1}</td>
      <td>${escapeHtml(m.date)}</td>
      <td><span class="tag ${m.category === 'راتب شهري' ? 'tag-purple' : 'tag-info'}">${escapeHtml(m.type)}</span></td>
      <td>${escapeHtml(m.description)}</td>
      <td style="color:var(--primary);font-weight:700;">${m.debit ? formatNum(m.debit) : '-'}</td>
      <td style="color:var(--success);font-weight:700;">${m.credit ? formatNum(m.credit) : '-'}</td>
      <td>${m.paymentStatus ? statusBadge(m.paymentStatus) : '-'}</td>
    </tr>
  `).join('');

  document.getElementById('psContent').innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="fas fa-user-tie"></i>
          <span>${escapeHtml(d.person.name)}</span>
          <span class="tag tag-info" style="margin-right:10px;">${escapeHtml(d.person.job || '')}</span>
        </h3>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:15px;">
          <div><strong>رقم الجوال:</strong> ${escapeHtml(d.person.phone || '-')}</div>
          <div><strong>مصاريف يومية:</strong> ${formatNum(d.person.dailyWage)} ر.ي</div>
          <div><strong>الراتب الشهري:</strong> ${formatNum(d.person.salary)} ر.ي</div>
          <div><strong>الحالة:</strong> ${statusBadge(d.person.status)}</div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-coins"></i><span>المصاريف اليومية</span></h3></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:10px;font-size:14px;">
            <div style="display:flex;justify-content:space-between;"><span>أيام الحضور:</span><strong>${t.presentDays}</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>إجمالي اليوميات:</span><strong>${formatNum(t.dailyWages)}</strong></div>
            ${t.totalOvertimeAmount > 0 ? `<div style="display:flex;justify-content:space-between;"><span>الساعات الإضافية:</span><strong style="color:var(--info);">+ ${formatNum(t.totalOvertimeAmount)}</strong></div>` : ''}
            <div style="display:flex;justify-content:space-between;"><span>الخصومات:</span><strong style="color:var(--danger);">- ${formatNum(t.dailyDiscounts)}</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>الحوافز:</span><strong style="color:var(--success);">+ ${formatNum(t.dailyBonuses)}</strong></div>
            <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border);">
              <span><strong>صافي اليوميات:</strong></span>
              <strong style="color:var(--primary);font-size:16px;">${formatNum(t.dailyNet)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;"><span>المدفوع:</span><strong style="color:var(--success);">${formatNum(t.dailyPaid)}</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>المتبقي:</span><strong style="color:var(--danger);">${formatNum(t.dailyRemaining)}</strong></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title"><i class="fas fa-file-invoice-dollar"></i><span>الرواتب الشهرية</span></h3></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:10px;font-size:14px;">
            <div style="display:flex;justify-content:space-between;"><span>عدد الشهور:</span><strong>${t.monthsCount}</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>إجمالي الرواتب:</span><strong>${formatNum(t.monthlySalaries)}</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>المدفوع:</span><strong style="color:var(--success);">${formatNum(t.monthlySalariesPaid)}</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>المتبقي:</span><strong style="color:var(--danger);">${formatNum(t.monthlySalariesRemaining)}</strong></div>
            <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border);margin-top:8px;">
              <span><strong>الصافي الإجمالي:</strong></span>
              <strong style="color:var(--gold);font-size:16px;">${formatNum(t.totalNet)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;"><span>إجمالي المدفوع:</span><strong style="color:var(--success);">${formatNum(t.totalPaid)}</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>إجمالي المتبقي:</span><strong style="color:var(--danger);font-size:16px;">${formatNum(t.grandRemaining)}</strong></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title"><i class="fas fa-list-ul"></i><span>الحركات المالية</span></h3></div>
      <div class="table-wrapper">
        <table class="table">
          <thead><tr>
            <th>#</th><th>التاريخ</th><th>النوع</th><th>الوصف</th>
            <th>له (مدين)</th><th>عليه (دائن)</th><th>الحالة</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">لا توجد حركات</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// كشف حساب معدة
// ═══════════════════════════════════════════════════════════
async function loadEquipmentForStatement() {
  await loadEquipment();
  const sel = document.getElementById('esEquipId');
  sel.innerHTML = '<option value="">اختر المعدة</option>' +
    equipmentData.map(e => `<option value="${escapeAttr(e.equipId)}">${escapeHtml(e.name)} (${escapeHtml(e.type || '')})</option>`).join('');
}

function filterEquipmentList() {
  const q = String(getValue('esSearchBox')).toLowerCase().trim();
  const sel = document.getElementById('esEquipId');
  const filtered = q ? equipmentData.filter(e => String(e.name).toLowerCase().includes(q)) : equipmentData;
  sel.innerHTML = '<option value="">اختر المعدة</option>' +
    filtered.map(e => `<option value="${escapeAttr(e.equipId)}">${escapeHtml(e.name)} (${escapeHtml(e.type || '')})</option>`).join('');
}

async function loadEquipmentStatement() {
  const equipId = getValue('esEquipId');
  if (!equipId) { document.getElementById('esContent').innerHTML = '<div class="empty-state"><i class="fas fa-truck"></i><h3>اختر معدة</h3></div>'; return; }
  document.getElementById('esContent').innerHTML = '<div style="text-align:center;padding:40px;"><span class="loader" style="border-top-color:var(--primary);"></span></div>';
  const res = await apiGet('getEquipmentStatement', { equipId });
  if (!res.success) { showToast(res.error, 'error'); return; }
  const d = res.data;

  const rows = d.movements.map((m, i) => `
    <tr>
      <td>${i+1}</td><td>${escapeHtml(m.date)}</td>
      <td><span class="tag tag-info">${escapeHtml(m.type)}</span></td>
      <td>${escapeHtml(m.description)}</td>
      <td style="color:var(--danger);font-weight:700;">${formatNum(m.cost)}</td>
    </tr>
  `).join('');

  document.getElementById('esContent').innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title"><i class="fas fa-truck"></i><span>${escapeHtml(d.equipment.name)}</span>
        <span class="tag tag-info" style="margin-right:10px;">${escapeHtml(d.equipment.type || '')}</span></h3>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:15px;">
          <div><strong>الموديل:</strong> ${escapeHtml(d.equipment.model || '-')}</div>
          <div><strong>اللوحة:</strong> ${escapeHtml(d.equipment.plateNumber || '-')}</div>
          <div><strong>المالك:</strong> ${escapeHtml(d.equipment.owner || '-')}</div>
          <div><strong>المشغل:</strong> ${escapeHtml(d.equipment.operator || '-')}</div>
          <div><strong>سعر الساعة:</strong> ${formatNum(d.equipment.hourlyRate)} ر.ي</div>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-calendar"></i></div>
        <div class="stat-info"><h3>${d.totals.workDays}</h3><p>أيام عمل</p></div></div>
      <div class="stat-card"><div class="stat-icon cyan"><i class="fas fa-clock"></i></div>
        <div class="stat-info"><h3>${d.totals.totalHours}</h3><p>ساعات</p></div></div>
      <div class="stat-card"><div class="stat-icon red"><i class="fas fa-gas-pump"></i></div>
        <div class="stat-info"><h3>${formatCurrency(d.totals.totalDiesel)}</h3><p>وقود</p></div></div>
      <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-tools"></i></div>
        <div class="stat-info"><h3>${formatCurrency(d.totals.totalMaint)}</h3><p>صيانة</p></div></div>
      <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-hand-holding-usd"></i></div>
        <div class="stat-info"><h3>${formatCurrency(d.totals.totalRent)}</h3><p>إيجار</p></div></div>
      <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-coins"></i></div>
        <div class="stat-info"><h3>${formatCurrency(d.totals.totalCost)}</h3><p>الإجمالي</p></div></div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title"><i class="fas fa-list-ul"></i><span>الحركات</span></h3></div>
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>#</th><th>التاريخ</th><th>النوع</th><th>الوصف</th><th>التكلفة</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-muted);">لا توجد حركات</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;
}

function printPersonStatement() {
  const content = document.getElementById('psContent').innerHTML;
  if (!content || content.includes('empty-state')) { showToast('اختر عاملاً أولاً', 'warning'); return; }
  const w = window.open('', 'PrintPerson', 'width=900,height=700,noopener,noreferrer');
  if (!w) { showToast('⚠️ يرجى السماح بالنوافذ', 'warning'); return; }
  w.document.write(`<html dir="rtl"><head><title>كشف حساب شخص</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
    <style>body{font-family:Tajawal,sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:8px;text-align:right;} h3{color:#2563eb;}</style>
    </head><body><h2>كشف حساب شخص</h2>${content}<script>setTimeout(()=>window.print(),500)<\/script></body></html>`);
  w.document.close();
}

function printEquipmentStatement() {
  const content = document.getElementById('esContent').innerHTML;
  if (!content || content.includes('empty-state')) { showToast('اختر معدة أولاً', 'warning'); return; }
  const w = window.open('', 'PrintEquip', 'width=900,height=700,noopener,noreferrer');
  if (!w) { showToast('⚠️ يرجى السماح بالنوافذ', 'warning'); return; }
  w.document.write(`<html dir="rtl"><head><title>كشف حساب معدة</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
    <style>body{font-family:Tajawal,sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:8px;text-align:right;} h3{color:#2563eb;}</style>
    </head><body><h2>كشف حساب معدة</h2>${content}<script>setTimeout(()=>window.print(),500)<\/script></body></html>`);
  w.document.close();
}

function exportSalariesPDF() {
  if (salariesData.length === 0) { showToast('اعرض البيانات أولاً', 'warning'); return; }
  const year = getValue('salYear');
  const month = getValue('salMonth');
  const content = document.getElementById('salTableWrapper').outerHTML;
  const w = window.open('', 'PrintSalaries', 'width=1400,height=700,noopener,noreferrer');
  if (!w) { showToast('⚠️ يرجى السماح بالنوافذ', 'warning'); return; }
  w.document.write(`<html dir="rtl"><head><title>كشف الرواتب ${year}-${month}</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
    <style>body{font-family:Tajawal,sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;font-size:11px;} th,td{border:1px solid #ccc;padding:6px;text-align:right;} h2{color:#2563eb;}</style>
    </head><body><h2>كشف الرواتب - ${year}/${month}</h2>${content}<script>setTimeout(()=>window.print(),500)<\/script></body></html>`);
  w.document.close();
}

console.log('📈 reports.js تم التحميل');
