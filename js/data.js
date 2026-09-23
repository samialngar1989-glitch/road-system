// ═══════════════════════════════════════════════════════════
// 📊 لوحة التحكم
// ═══════════════════════════════════════════════════════════
async function loadDashboard() {
  const stats = await apiGet('getDashboardStats');
  if (!stats.success) return;
  const d = stats.data;
  setText('statProjects', d.projects.total);
  setText('statActiveProjects', d.projects.active);
  setText('statEquipment', d.equipment.working);
  setText('statWorkers', d.workers.present);
  setText('statRevenue', formatCurrency(d.finance.revenue));
  setText('statLowStock', d.materials.lowStock);
  setText('statProfit', formatCurrency(d.finance.profit));
  setText('statSafety', d.safety.total);
  const chartData = await apiGet('getChartData');
  if (chartData.success) renderCharts(chartData.data);
}

function renderCharts(data) {
  const ctx1 = document.getElementById('chartMonthly');
  if (ctx1) {
    if (charts.monthly) charts.monthly.destroy();
    charts.monthly = new Chart(ctx1, {
      type: 'line',
      data: { labels: data.monthly.labels, datasets: [{ label: 'الإيرادات', data: data.monthly.data,
        borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.1)', tension: .4, fill: true }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }
  const ctx2 = document.getElementById('chartProjects');
  if (ctx2) {
    if (charts.projects) charts.projects.destroy();
    charts.projects = new Chart(ctx2, {
      type: 'doughnut',
      data: { labels: data.projectsByStatus.labels, datasets: [{ data: data.projectsByStatus.data,
        backgroundColor: ['#f59e0b','#22c55e','#2563eb','#ef4444'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }
  const ctx3 = document.getElementById('chartMaterials');
  if (ctx3) {
    if (charts.materials) charts.materials.destroy();
    charts.materials = new Chart(ctx3, {
      type: 'bar',
      data: { labels: data.materialsStock.labels, datasets: [{ label: 'المخزون', data: data.materialsStock.data,
        backgroundColor: '#06b6d4', borderRadius: 8 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }
  const ctx4 = document.getElementById('chartExpenses');
  if (ctx4) {
    if (charts.expenses) charts.expenses.destroy();
    charts.expenses = new Chart(ctx4, {
      type: 'pie',
      data: { labels: data.expensesByCategory.labels, datasets: [{ data: data.expensesByCategory.data,
        backgroundColor: ['#2563eb','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }
}

// ═══════════════════════════════════════════════════════════
// 📁 المشاريع
// ═══════════════════════════════════════════════════════════
async function loadProjects() {
  const res = await apiGet('getProjects');
  if (!res.success) return;
  projectsData = res.data || [];
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  if (projectsData.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-road"></i><h3>لا توجد مشاريع</h3></div>`;
    return;
  }
  grid.innerHTML = projectsData.map(p => `
    <div class="project-card">
      <div style="display:flex;justify-content:space-between;margin-bottom:15px;gap:10px;">
        <div><div style="font-size:17px;font-weight:700;margin-bottom:5px;">${escapeHtml(p.name)}</div>
        <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(p.projectId)}</div></div>
        ${statusBadge(p.status)}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:15px;font-size:13px;color:var(--text-muted);">
        <span><i class="fas fa-user" style="width:16px;color:var(--primary);"></i>${escapeHtml(p.client)}</span>
        <span><i class="fas fa-map-marker-alt" style="width:16px;color:var(--primary);"></i>${escapeHtml(p.location)}</span>
        <span><i class="fas fa-ruler-horizontal" style="width:16px;color:var(--primary);"></i>${p.length || 0} كم</span>
        <span><i class="fas fa-money-bill" style="width:16px;color:var(--primary);"></i>${formatCurrency(p.contractValue)}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${p.progress || 0}%"></div></div>
      <div style="text-align:center;margin-top:8px;font-size:12px;color:var(--text-muted);font-weight:700;">${p.progress || 0}% مكتمل</div>
    </div>
  `).join('');
}

function openProjectModal() {
  document.getElementById('projectId').value = '';
  ['proj_name','proj_client','proj_location','proj_length','proj_roadWidth','proj_contractValue','proj_startDate','proj_endDate','proj_manager','proj_engineer','proj_progress','proj_description'].forEach(id => setValue(id, ''));
  document.getElementById('projectModalTitle').textContent = 'مشروع جديد';
  document.getElementById('projectModal').classList.add('active');
}

async function saveProject() {
  const data = {
    projectId: getValue('projectId'), name: getValue('proj_name'),
    client: getValue('proj_client'), location: getValue('proj_location'),
    length: getValue('proj_length'), roadWidth: getValue('proj_roadWidth'),
    roadType: getValue('proj_roadType'), contractValue: getValue('proj_contractValue'),
    startDate: getValue('proj_startDate'), endDate: getValue('proj_endDate'),
    manager: getValue('proj_manager'), engineer: getValue('proj_engineer'),
    status: getValue('proj_status'), progress: getValue('proj_progress'),
    description: getValue('proj_description')
  };
  if (!data.name || !data.client) { showToast('أكمل الحقول المطلوبة', 'warning'); return; }
  const result = await apiPost('addProject', data);
  if (result.success) { closeModalById('projectModal'); showToast('تم الحفظ', 'success'); loadProjects(); loadDashboard(); }
  else showToast(result.error, 'error');
}

// ═══════════════════════════════════════════════════════════
// 📍 المواقع
// ═══════════════════════════════════════════════════════════
async function loadSites() {
  const res = await apiGet('getSites');
  if (!res.success) return;
  sitesData = res.data || [];
  const tbody = document.getElementById('sitesTable');
  if (!tbody) return;
  if (sitesData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد مواقع</td></tr>';
    return;
  }
  tbody.innerHTML = sitesData.map((s, i) => {
    const proj = projectsData.find(p => p.projectId === s.projectId);
    return `<tr>
      <td>${i+1}</td><td><strong>${escapeHtml(s.name)}</strong></td>
      <td>${escapeHtml(proj ? proj.name : s.projectId)}</td>
      <td>${s.fromKm || 0}</td><td>${s.toKm || 0}</td><td>${s.length || 0} كم</td>
      <td>${statusBadge(s.status)}</td><td>${escapeHtml(s.supervisor || '-')}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon delete" onclick="deleteSite('${escapeAttr(s.siteId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function openSiteModal() {
  document.getElementById('siteId').value = '';
  fillProjectSelect('site_projectId');
  ['site_name','site_fromKm','site_toKm','site_supervisor','site_notes'].forEach(id => setValue(id, ''));
  document.getElementById('siteModal').classList.add('active');
}

async function saveSite() {
  const data = {
    projectId: getValue('site_projectId'), name: getValue('site_name'),
    fromKm: getValue('site_fromKm'), toKm: getValue('site_toKm'),
    status: getValue('site_status'), supervisor: getValue('site_supervisor'),
    notes: getValue('site_notes')
  };
  if (!data.projectId || !data.name) { showToast('أكمل الحقول', 'warning'); return; }
  const result = await apiPost('addSite', data);
  if (result.success) { closeModalById('siteModal'); showToast('تم الحفظ', 'success'); loadSites(); }
  else showToast(result.error, 'error');
}

function deleteSite(id) {
  showConfirm('حذف الموقع؟', async () => {
    const res = await apiPost('deleteSite', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadSites(); }
  });
}

// ═══════════════════════════════════════════════════════════
// BOQ
// ═══════════════════════════════════════════════════════════
async function loadBOQPage() {
  await loadProjects();
  fillProjectFilter('boqProjectFilter');
  await loadBOQ();
}

async function loadBOQ() {
  const projectId = getValue('boqProjectFilter');
  const res = await apiGet('getBOQSummary', { projectId });
  if (!res.success) return;
  const d = res.data;
  boqData = d.items;

  const summaryBox = document.getElementById('boqSummaryBox');
  if (summaryBox) {
    summaryBox.innerHTML = `
      <div class="boq-summary">
        <div class="boq-summary-item"><div class="label">عدد البنود</div><div class="value">${d.totals.itemsCount}</div></div>
        <div class="boq-summary-item"><div class="label">إجمالي التعاقدي</div><div class="value">${formatCurrency(d.totals.totalContract)}</div></div>
        <div class="boq-summary-item"><div class="label">إجمالي المنفذ</div><div class="value" style="color:var(--success);">${formatCurrency(d.totals.totalExecuted)}</div></div>
        <div class="boq-summary-item"><div class="label">إجمالي المتبقي</div><div class="value" style="color:var(--danger);">${formatCurrency(d.totals.totalRemaining)}</div></div>
        <div class="boq-summary-item"><div class="label">نسبة الإنجاز</div><div class="value" style="color:${d.totals.overallProgress >= 70 ? 'var(--success)' : d.totals.overallProgress >= 30 ? 'var(--warning)' : 'var(--danger)'};">${d.totals.overallProgress}%</div></div>
      </div>
    `;
  }

  const tbody = document.getElementById('boqTable');
  if (!tbody) return;
  if (d.items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد بنود</td></tr>';
    return;
  }
  tbody.innerHTML = d.items.map((item, i) => {
    const color = item.progressPercent >= 100 ? 'var(--success)' : item.progressPercent >= 50 ? 'var(--primary)' : item.progressPercent > 0 ? 'var(--warning)' : 'var(--text-muted)';
    return `<tr>
      <td>${i+1}</td>
      <td><span class="tag tag-gray">${escapeHtml(item.itemCode || '-')}</span></td>
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td><span class="tag tag-info">${escapeHtml(item.unit || '')}</span></td>
      <td>${formatNum(item.contractQty)}</td>
      <td>${formatNum(item.unitPrice)}</td>
      <td style="font-weight:700;">${formatNum(item.totalPrice)}</td>
      <td style="color:var(--success);font-weight:700;">${formatNum(item.executedQty)}</td>
      <td style="color:var(--danger);font-weight:700;">${formatNum(item.remainingQty)}</td>
      <td>
        <div style="font-size:12px;font-weight:700;margin-bottom:4px;">${item.progressPercent}%</div>
        <div class="progress-bar" style="height:8px;"><div class="progress-fill" style="width:${item.progressPercent}%;background:${color};"></div></div>
      </td>
      <td>${statusBadge(item.status)}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon edit" onclick="openBOQModal('${escapeAttr(item.boqId)}')"><i class="fas fa-edit"></i></button>
        <button type="button" class="btn-icon delete" onclick="deleteBOQItem('${escapeAttr(item.boqId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function openBOQModal(boqId) {
  document.getElementById('boqId').value = boqId || '';
  fillProjectSelect('boq_projectId');
  const item = boqId ? boqData.find(x => x.boqId === boqId) : null;
  setValue('boq_itemCode', item ? item.itemCode : '');
  setValue('boq_name', item ? item.name : '');
  setValue('boq_unit', item ? item.unit : 'م³');
  setValue('boq_contractQty', item ? item.contractQty : '');
  setValue('boq_unitPrice', item ? item.unitPrice : '');
  setValue('boq_executedQty', item ? item.executedQty : '0');
  setValue('boq_notes', item ? item.notes : '');
  if (item) setValue('boq_projectId', item.projectId);
  calcBOQTotal();
  document.getElementById('boqModalTitle').textContent = item ? 'تعديل البند' : 'بند جديد';
  document.getElementById('boqModal').classList.add('active');
}

function calcBOQTotal() {
  const qty = Number(getValue('boq_contractQty')) || 0;
  const price = Number(getValue('boq_unitPrice')) || 0;
  setText('boq_totalDisplay', formatNum(qty * price) + ' ر.ي');
}

async function saveBOQItem() {
  const data = {
    boqId: getValue('boqId'), projectId: getValue('boq_projectId'),
    itemCode: getValue('boq_itemCode'), name: getValue('boq_name'),
    unit: getValue('boq_unit'), contractQty: getValue('boq_contractQty'),
    unitPrice: getValue('boq_unitPrice'), executedQty: getValue('boq_executedQty'),
    notes: getValue('boq_notes')
  };
  if (!data.projectId || !data.name || !data.contractQty) { showToast('أكمل الحقول', 'warning'); return; }
  const action = data.boqId ? 'updateBOQItem' : 'addBOQItem';
  const result = await apiPost(action, data);
  if (result.success) { closeModalById('boqModal'); showToast('تم الحفظ', 'success'); loadBOQ(); }
  else showToast(result.error, 'error');
}

function deleteBOQItem(id) {
  showConfirm('حذف البند؟', async () => {
    const res = await apiPost('deleteBOQItem', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadBOQ(); }
  });
}

async function recalcBOQ() {
  showToast('⏳ جاري إعادة الحساب...', 'info');
  const res = await apiPost('recalcBOQProgress', {});
  if (res.success) { showToast('✅ ' + res.message, 'success'); loadBOQ(); }
  else showToast(res.error, 'error');
}

// ═══════════════════════════════════════════════════════════
// 🚜 المعدات
// ═══════════════════════════════════════════════════════════
async function loadEquipment() {
  const res = await apiGet('getEquipment');
  if (!res.success) return;
  equipmentData = res.data || [];
  const tbody = document.getElementById('equipmentTable');
  if (!tbody) return;
  if (equipmentData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد معدات</td></tr>';
    return;
  }
  tbody.innerHTML = equipmentData.map((e, i) => `
    <tr>
      <td>${i+1}</td><td><strong>${escapeHtml(e.name)}</strong></td>
      <td>${escapeHtml(e.type)}</td><td>${escapeHtml(e.model || '-')}</td>
      <td>${escapeHtml(e.plateNumber || '-')}</td><td>${escapeHtml(e.owner || '-')}</td>
      <td>${statusBadge(e.status)}</td><td>${escapeHtml(e.operator || '-')}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon edit" onclick="openEquipmentModal('${escapeAttr(e.equipId)}')"><i class="fas fa-edit"></i></button>
        <button type="button" class="btn-icon delete" onclick="deleteEquipment('${escapeAttr(e.equipId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function openEquipmentModal(equipId) {
  document.getElementById('equipId').value = equipId || '';
  const e = equipId ? equipmentData.find(x => x.equipId === equipId) : null;
  setValue('equip_name', e ? e.name : '');
  setValue('equip_type', e ? e.type : 'بوكلين');
  setValue('equip_model', e ? e.model : '');
  setValue('equip_plateNumber', e ? e.plateNumber : '');
  setValue('equip_year', e ? e.year : '');
  setValue('equip_status', e ? e.status : 'يعمل');
  setValue('equip_currentSite', e ? e.currentSite : '');
  setValue('equip_operator', e ? e.operator : '');
  setValue('equip_owner', e ? e.owner : '');
  setValue('equip_ownerType', e ? e.ownerType : 'شركة');
  setValue('equip_usageType', e ? e.usageType : 'مملوكة');
  setValue('equip_hourlyRate', e ? e.hourlyRate : '');
  setValue('equip_workStartDate', e ? e.workStartDate : '');
  setValue('equip_purchasePrice', e ? e.purchasePrice : '');
  setValue('equip_lastMaintenance', e ? e.lastMaintenance : '');
  setValue('equip_nextMaintenance', e ? e.nextMaintenance : '');
  document.getElementById('equipmentModalTitle').textContent = e ? 'تعديل المعدة' : 'إضافة معدة';
  document.getElementById('equipmentModal').classList.add('active');
}

async function saveEquipment() {
  const data = {
    equipId: getValue('equipId'), name: getValue('equip_name'),
    type: getValue('equip_type'), model: getValue('equip_model'),
    plateNumber: getValue('equip_plateNumber'), year: getValue('equip_year'),
    status: getValue('equip_status'), currentSite: getValue('equip_currentSite'),
    operator: getValue('equip_operator'),
    owner: getValue('equip_owner'), ownerType: getValue('equip_ownerType'),
    usageType: getValue('equip_usageType'), hourlyRate: getValue('equip_hourlyRate'),
    workStartDate: getValue('equip_workStartDate'),
    purchasePrice: getValue('equip_purchasePrice'),
    lastMaintenance: getValue('equip_lastMaintenance'),
    nextMaintenance: getValue('equip_nextMaintenance')
  };
  if (!data.name || !data.type) { showToast('أكمل الحقول', 'warning'); return; }
  const action = data.equipId ? 'updateEquipment' : 'addEquipment';
  const result = await apiPost(action, data);
  if (result.success) { closeModalById('equipmentModal'); showToast('تم الحفظ', 'success'); loadEquipment(); loadDashboard(); }
  else showToast(result.error, 'error');
}

function deleteEquipment(id) {
  showConfirm('حذف المعدة؟', async () => {
    const res = await apiPost('deleteEquipment', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadEquipment(); loadDashboard(); }
  });
}

// ═══════════════════════════════════════════════════════════
// 🔧 الصيانة
// ═══════════════════════════════════════════════════════════
async function loadMaintenance() {
  const res = await apiGet('getMaintenance');
  if (!res.success) return;
  maintenanceData = res.data || [];
  const tbody = document.getElementById('maintenanceTable');
  if (!tbody) return;
  if (maintenanceData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد سجلات صيانة</td></tr>';
    return;
  }
  tbody.innerHTML = maintenanceData.map((m, i) => {
    const eq = equipmentData.find(x => x.equipId === m.equipId);
    const rowClass = 'row-' + (m.colorStatus || 'gray');
    let statusTag = '';
    if (m.colorStatus === 'green') statusTag = '<span class="tag tag-success">🟢 تمت اليوم</span>';
    else if (m.colorStatus === 'red') statusTag = '<span class="tag tag-danger">🔴 حان وقتها</span>';
    else if (m.colorStatus === 'yellow') statusTag = '<span class="tag tag-warning">🟡 قريبة</span>';
    else statusTag = '<span class="tag tag-gray">عادي</span>';
    const attCount = (m.attachments || '').split(',').filter(Boolean).length;
    return `<tr class="${rowClass}">
      <td>${i+1}</td>
      <td><strong>${escapeHtml(eq ? eq.name : m.equipId)}</strong></td>
      <td>${escapeHtml(m.date)}</td><td>${escapeHtml(m.type)}</td>
      <td>${escapeHtml((m.description || '').slice(0, 40))}</td>
      <td>${formatCurrency(m.cost)} ر.ي</td>
      <td>${escapeHtml(m.nextDate || '-')}</td>
      <td>${statusTag}</td>
      <td>${attCount > 0 ? `<button type="button" class="btn-icon camera" onclick="viewAttachments('maintenance','${escapeAttr(m.maintId)}')"><i class="fas fa-camera"></i> ${attCount}</button>` : '-'}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon delete" onclick="deleteMaintenance('${escapeAttr(m.maintId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function openMaintenanceModal() {
  const select = document.getElementById('mt_equipId');
  select.innerHTML = '<option value="">اختر المعدة</option>' +
    equipmentData.map(e => `<option value="${escapeAttr(e.equipId)}">${escapeHtml(e.name)}</option>`).join('');
  setValue('mt_date', new Date().toISOString().split('T')[0]);
  ['mt_description','mt_cost','mt_workshop','mt_mechanic','mt_nextDate'].forEach(id => setValue(id, ''));
  clearUploads('mt');
  document.getElementById('maintenanceModal').classList.add('active');
}

async function saveMaintenance() {
  const att = await uploadAttachments('mt', 'maintenance', '');
  const data = {
    equipId: getValue('mt_equipId'), date: getValue('mt_date'),
    type: getValue('mt_type'), description: getValue('mt_description'),
    cost: getValue('mt_cost'), workshop: getValue('mt_workshop'),
    mechanic: getValue('mt_mechanic'), nextDate: getValue('mt_nextDate'),
    attachments: att
  };
  if (!data.equipId || !data.description) { showToast('أكمل الحقول', 'warning'); return; }
  const result = await apiPost('addMaintenance', data);
  if (result.success) { closeModalById('maintenanceModal'); showToast('تم الحفظ', 'success'); loadMaintenance(); loadEquipment(); }
  else showToast(result.error, 'error');
}

function deleteMaintenance(id) {
  showConfirm('حذف سجل الصيانة؟', async () => {
    const res = await apiPost('deleteMaintenance', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadMaintenance(); }
  });
}

// ═══════════════════════════════════════════════════════════
// 👷 العمال
// ═══════════════════════════════════════════════════════════
async function loadWorkers() {
  const res = await apiGet('getWorkers');
  if (!res.success) return;
  workersData = res.data || [];
  const tbody = document.getElementById('workersTable');
  if (!tbody) return;
  if (workersData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">لا يوجد عمال</td></tr>';
    return;
  }
  tbody.innerHTML = workersData.map((w, i) => `
    <tr>
      <td>${i+1}</td><td><strong>${escapeHtml(w.name)}</strong></td>
      <td><span class="tag tag-info">${escapeHtml(w.job || '')}</span></td>
      <td>${escapeHtml(w.phone || '-')}</td>
      <td style="color:var(--primary);font-weight:700;">${formatNum(w.dailyWage)} ر.ي</td>
      <td style="color:var(--purple);font-weight:700;">${formatNum(w.salary)} ر.ي</td>
      <td>${statusBadge(w.status)}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon edit" onclick="openWorkerModal('${escapeAttr(w.workerId)}')"><i class="fas fa-edit"></i></button>
        <button type="button" class="btn-icon delete" onclick="deleteWorker('${escapeAttr(w.workerId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function openWorkerModal(workerId) {
  document.getElementById('workerId').value = workerId || '';
  const w = workerId ? workersData.find(x => x.workerId === workerId) : null;
  setValue('worker_name', w ? w.name : '');
  setValue('worker_nationalId', w ? w.nationalId : '');
  setValue('worker_job', w ? w.job : '');
  setValue('worker_phone', w ? w.phone : '');
  setValue('worker_salary', w ? w.salary : '');
  setValue('worker_dailyWage', w ? w.dailyWage : '');
  setValue('worker_joinDate', w ? w.joinDate : '');
  setValue('worker_status', w ? w.status : 'يعمل');
  document.getElementById('workerModalTitle').textContent = w ? 'تعديل العامل' : 'إضافة عامل';
  document.getElementById('workerModal').classList.add('active');
}

async function saveWorker() {
  const data = {
    workerId: getValue('workerId'), name: getValue('worker_name'),
    nationalId: getValue('worker_nationalId'), job: getValue('worker_job'),
    phone: getValue('worker_phone'), salary: getValue('worker_salary'),
    dailyWage: getValue('worker_dailyWage'), joinDate: getValue('worker_joinDate'),
    status: getValue('worker_status')
  };
  if (!data.name || !data.job || !data.phone) { showToast('أكمل الحقول', 'warning'); return; }
  const action = data.workerId ? 'updateWorker' : 'addWorker';
  const result = await apiPost(action, data);
  if (result.success) { closeModalById('workerModal'); showToast('تم الحفظ', 'success'); loadWorkers(); loadDashboard(); }
  else showToast(result.error, 'error');
}

function deleteWorker(id) {
  showConfirm('حذف العامل؟', async () => {
    const res = await apiPost('deleteWorker', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadWorkers(); loadDashboard(); }
  });
}

// ═══════════════════════════════════════════════════════════
// 📦 المواد
// ═══════════════════════════════════════════════════════════
async function loadMaterials() {
  const res = await apiGet('getMaterials');
  if (!res.success) return;
  materialsData = res.data || [];
  const tbody = document.getElementById('materialsTable');
  if (!tbody) return;
  if (materialsData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد مواد</td></tr>';
    return;
  }
  tbody.innerHTML = materialsData.map((m, i) => {
    const stock = Number(m.stock) || 0;
    const minStock = Number(m.minStock) || 0;
    let stockBadge = `<span class="tag tag-success">${stock}</span>`;
    if (stock < minStock) stockBadge = `<span class="tag tag-danger">${stock} ⚠️</span>`;
    else if (stock < minStock * 1.5) stockBadge = `<span class="tag tag-warning">${stock}</span>`;
    return `<tr>
      <td>${i+1}</td><td><strong>${escapeHtml(m.name)}</strong></td>
      <td><span class="tag tag-gray">${escapeHtml(m.unit || '')}</span></td>
      <td>${formatCurrency(m.price)} ر.ي</td>
      <td>${stockBadge}</td><td>${minStock}</td>
      <td>${escapeHtml(m.supplier || '-')}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon edit" onclick="openMaterialModal('${escapeAttr(m.matId)}')"><i class="fas fa-edit"></i></button>
        <button type="button" class="btn-icon delete" onclick="deleteMaterial('${escapeAttr(m.matId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function openMaterialModal(matId) {
  document.getElementById('matId').value = matId || '';
  const m = matId ? materialsData.find(x => x.matId === matId) : null;
  setValue('mat_name', m ? m.name : '');
  setValue('mat_unit', m ? m.unit : 'م³');
  setValue('mat_price', m ? m.price : '');
  setValue('mat_stock', m ? m.stock : '0');
  setValue('mat_minStock', m ? m.minStock : '');
  setValue('mat_location', m ? m.location : '');
  document.getElementById('materialModalTitle').textContent = m ? 'تعديل المادة' : 'إضافة مادة';
  document.getElementById('materialModal').classList.add('active');
}

async function saveMaterial() {
  const data = {
    matId: getValue('matId'), name: getValue('mat_name'),
    unit: getValue('mat_unit'), price: getValue('mat_price'),
    stock: getValue('mat_stock'), minStock: getValue('mat_minStock'),
    location: getValue('mat_location')
  };
  if (!data.name || !data.price) { showToast('أكمل الحقول', 'warning'); return; }
  const action = data.matId ? 'updateMaterial' : 'addMaterial';
  const result = await apiPost(action, data);
  if (result.success) { closeModalById('materialModal'); showToast('تم الحفظ', 'success'); loadMaterials(); loadDashboard(); }
  else showToast(result.error, 'error');
}

function deleteMaterial(id) {
  showConfirm('حذف المادة؟', async () => {
    const res = await apiPost('deleteMaterial', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadMaterials(); loadDashboard(); }
  });
}

// ═══════════════════════════════════════════════════════════
// 🏪 الموردين
// ═══════════════════════════════════════════════════════════
async function loadSuppliers() {
  const res = await apiGet('getSuppliers');
  if (!res.success) return;
  suppliersData = res.data || [];
  const tbody = document.getElementById('suppliersTable');
  if (!tbody) return;
  if (suppliersData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">لا يوجد موردون</td></tr>';
    return;
  }
  tbody.innerHTML = suppliersData.map((s, i) => `
    <tr>
      <td>${i+1}</td><td><strong>${escapeHtml(s.name)}</strong></td>
      <td><span class="tag tag-info">${escapeHtml(s.type || '')}</span></td>
      <td>${escapeHtml(s.phone || '-')}</td>
      <td style="color:var(--primary);font-weight:700;">${formatNum(s.suppliedTotal)}</td>
      <td style="color:var(--danger);font-weight:700;">${formatNum(s.purchasedTotal)}</td>
      <td style="color:var(--success);font-weight:800;font-size:16px;">${formatNum(s.currentBalance)}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon view" onclick="showSupplierLedger('${escapeAttr(s.supplierId)}')"><i class="fas fa-file-invoice"></i></button>
        <button type="button" class="btn-icon edit" onclick="openSupplierModal('${escapeAttr(s.supplierId)}')"><i class="fas fa-edit"></i></button>
        <button type="button" class="btn-icon delete" onclick="deleteSupplier('${escapeAttr(s.supplierId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function openSupplierModal(supId) {
  document.getElementById('supId').value = supId || '';
  const s = supId ? suppliersData.find(x => x.supplierId === supId) : null;
  setValue('sup_name', s ? s.name : '');
  setValue('sup_type', s ? s.type : 'مواد');
  setValue('sup_contact', s ? s.contact : '');
  setValue('sup_phone', s ? s.phone : '');
  setValue('sup_address', s ? s.address : '');
  setValue('sup_notes', s ? s.notes : '');
  document.getElementById('supplierModalTitle').textContent = s ? 'تعديل المورد' : 'مورد جديد';
  document.getElementById('supplierModal').classList.add('active');
}

async function saveSupplier() {
  const data = {
    supplierId: getValue('supId'), name: getValue('sup_name'),
    type: getValue('sup_type'), contact: getValue('sup_contact'),
    phone: getValue('sup_phone'), address: getValue('sup_address'),
    notes: getValue('sup_notes')
  };
  if (!data.name || !data.phone) { showToast('أكمل الحقول', 'warning'); return; }
  const action = data.supplierId ? 'updateSupplier' : 'addSupplier';
  const result = await apiPost(action, data);
  if (result.success) { closeModalById('supplierModal'); showToast('تم الحفظ', 'success'); loadSuppliers(); }
  else showToast(result.error, 'error');
}

function deleteSupplier(id) {
  showConfirm('حذف المورد؟', async () => {
    const res = await apiPost('deleteSupplier', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadSuppliers(); }
  });
}

async function showSupplierLedger(supplierId) {
  const s = suppliersData.find(x => x.supplierId === supplierId);
  if (!s) return;
  document.getElementById('ledgerTitle').textContent = 'كشف حساب: ' + s.name;
  document.getElementById('ledgerBody').innerHTML = '<div style="text-align:center;padding:30px;"><span class="loader" style="border-top-color:var(--primary);"></span></div>';
  document.getElementById('ledgerModal').classList.add('active');
  const res = await apiGet('getSupplierLedger', { supplierId });
  if (!res.success) { document.getElementById('ledgerBody').innerHTML = '<div class="empty-state">خطأ</div>'; return; }
  const d = res.data;
  let html = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:20px;">
      <div style="padding:15px;background:rgba(37,99,235,.1);border:2px solid var(--primary);border-radius:8px;text-align:center;">
        <div style="font-size:12px;color:var(--text-muted);">إجمالي التوريدات</div>
        <div style="font-size:22px;font-weight:800;color:var(--primary);">${formatNum(d.totals.supplied)}</div>
      </div>
      <div style="padding:15px;background:rgba(239,68,68,.1);border:2px solid var(--danger);border-radius:8px;text-align:center;">
        <div style="font-size:12px;color:var(--text-muted);">المشتريات</div>
        <div style="font-size:22px;font-weight:800;color:var(--danger);">${formatNum(d.totals.purchased)}</div>
      </div>
      <div style="padding:15px;background:rgba(34,197,94,.1);border:2px solid var(--success);border-radius:8px;text-align:center;">
        <div style="font-size:12px;color:var(--text-muted);">صافي المستحق</div>
        <div style="font-size:22px;font-weight:800;color:var(--success);">${formatNum(d.totals.netDue)}</div>
      </div>
    </div>
    <div class="table-wrapper" style="max-height:400px;overflow:auto;">
      <table class="table">
        <thead><tr><th>#</th><th>التاريخ</th><th>النوع</th><th>المادة</th><th>الكمية</th><th>المبلغ</th></tr></thead>
        <tbody>
  `;
  if (d.ledger.length === 0) {
    html += '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">لا توجد حركات</td></tr>';
  } else {
    d.ledger.forEach((row, i) => {
      const tag = row.type === 'توريد' ? 'tag-info' : 'tag-danger';
      html += `<tr>
        <td>${i+1}</td><td>${escapeHtml(row.date)}</td>
        <td><span class="tag ${tag}">${escapeHtml(row.type)}</span></td>
        <td>${escapeHtml(row.matName || '')}</td>
        <td>${row.totalQuantity || ''}</td>
        <td style="font-weight:700;">${formatNum(row.cost)}</td>
      </tr>`;
    });
  }
  html += '</tbody></table></div>';
  document.getElementById('ledgerBody').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// 💰 الفواتير
// ═══════════════════════════════════════════════════════════
async function loadInvoices() {
  const res = await apiGet('getInvoices');
  if (!res.success) return;
  invoicesData = res.data || [];
  const tbody = document.getElementById('invoicesTable');
  if (!tbody) return;
  if (invoicesData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد فواتير</td></tr>';
    return;
  }
  tbody.innerHTML = invoicesData.map((inv, i) => {
    const attCount = (inv.attachments || '').split(',').filter(Boolean).length;
    return `<tr>
      <td>${i+1}</td><td>${escapeHtml(inv.date || '')}</td>
      <td><span class="tag tag-info">${escapeHtml(inv.type || '')}</span></td>
      <td>${escapeHtml(inv.party || '')}</td>
      <td><strong>${formatCurrency(inv.amount)}</strong></td>
      <td style="color:var(--success);">${formatCurrency(inv.paid)}</td>
      <td style="color:var(--danger);">${formatCurrency(inv.remaining)}</td>
      <td>${statusBadge(inv.status)}</td>
      <td>${attCount > 0 ? `<button type="button" class="btn-icon camera" onclick="viewAttachments('invoice','${escapeAttr(inv.invoiceId)}')"><i class="fas fa-camera"></i> ${attCount}</button>` : '-'}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon delete" onclick="deleteInvoice('${escapeAttr(inv.invoiceId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function calcInvoiceRemaining() {
  const amount = Number(getValue('inv_amount')) || 0;
  const paid = Number(getValue('inv_paid')) || 0;
  setValue('inv_remaining', Math.max(0, amount - paid));
}

function openInvoiceModal() {
  document.getElementById('invId').value = '';
  fillProjectSelect('inv_projectId');
  ['inv_party','inv_description','inv_amount','inv_dueDate'].forEach(id => setValue(id, ''));
  setValue('inv_paid', '0');
  setValue('inv_remaining', '0');
  setValue('inv_date', new Date().toISOString().split('T')[0]);
  clearUploads('inv');
  document.getElementById('invoiceModal').classList.add('active');
}

async function saveInvoice() {
  const att = await uploadAttachments('inv', 'invoice', '');
  const data = {
    invoiceId: getValue('invId'), type: getValue('inv_type'),
    date: getValue('inv_date'), projectId: getValue('inv_projectId'),
    party: getValue('inv_party'), description: getValue('inv_description'),
    amount: getValue('inv_amount'), paid: getValue('inv_paid'),
    dueDate: getValue('inv_dueDate'), attachments: att
  };
  if (!data.type || !data.party || !data.amount) { showToast('أكمل الحقول', 'warning'); return; }
  const result = await apiPost('addInvoice', data);
  if (result.success) { closeModalById('invoiceModal'); showToast('تم الحفظ', 'success'); loadInvoices(); loadDashboard(); }
  else showToast(result.error, 'error');
}

function deleteInvoice(id) {
  showConfirm('حذف الفاتورة؟', async () => {
    const res = await apiPost('deleteInvoice', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadInvoices(); }
  });
}

// ═══════════════════════════════════════════════════════════
// 💵 المصروفات
// ═══════════════════════════════════════════════════════════
async function loadExpenses() {
  const res = await apiGet('getExpenses');
  if (!res.success) return;
  expensesData = res.data || [];
  const tbody = document.getElementById('expensesTable');
  if (!tbody) return;
  if (expensesData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد مصروفات</td></tr>';
    return;
  }
  tbody.innerHTML = expensesData.map((e, i) => {
    const attCount = (e.attachments || '').split(',').filter(Boolean).length;
    return `<tr>
      <td>${i+1}</td><td>${escapeHtml(e.date)}</td>
      <td><span class="tag tag-warning">${escapeHtml(e.category)}</span></td>
      <td>${escapeHtml((e.description || '').slice(0, 50))}</td>
      <td><strong style="color:var(--danger);">${formatCurrency(e.amount)}</strong></td>
      <td>${escapeHtml(e.paidBy || '-')}</td>
      <td>${attCount > 0 ? `<button type="button" class="btn-icon camera" onclick="viewAttachments('receipt','${escapeAttr(e.expId)}')"><i class="fas fa-camera"></i> ${attCount}</button>` : '-'}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon delete" onclick="deleteExpense('${escapeAttr(e.expId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function openExpenseModal() {
  document.getElementById('expId').value = '';
  fillProjectSelect('exp_projectId');
  ['exp_description','exp_amount','exp_paidBy'].forEach(id => setValue(id, ''));
  setValue('exp_date', new Date().toISOString().split('T')[0]);
  clearUploads('exp');
  document.getElementById('expenseModal').classList.add('active');
}

async function saveExpense() {
  const att = await uploadAttachments('exp', 'receipt', '');
  const data = {
    date: getValue('exp_date'), category: getValue('exp_category'),
    projectId: getValue('exp_projectId'), description: getValue('exp_description'),
    amount: getValue('exp_amount'), paidBy: getValue('exp_paidBy'),
    attachments: att
  };
  if (!data.date || !data.category || !data.amount) { showToast('أكمل الحقول', 'warning'); return; }
  const result = await apiPost('addExpense', data);
  if (result.success) { closeModalById('expenseModal'); showToast('تم الحفظ', 'success'); loadExpenses(); loadDashboard(); }
  else showToast(result.error, 'error');
}

function deleteExpense(id) {
  showConfirm('حذف المصروف؟', async () => {
    const res = await apiPost('deleteExpense', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadExpenses(); loadDashboard(); }
  });
}

// ═══════════════════════════════════════════════════════════
// ⚠️ السلامة / ✅ الجودة / 📈 الإنجاز
// ═══════════════════════════════════════════════════════════
async function loadSafety() {
  const res = await apiGet('getSafety');
  if (!res.success) return;
  safetyData = res.data || [];
  const tbody = document.getElementById('safetyTable');
  if (!tbody) return;
  if (safetyData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد تقارير</td></tr>';
    return;
  }
  const sevColor = { 'منخفض': 'tag-success', 'متوسط': 'tag-warning', 'عالي': 'tag-danger', 'حرج': 'tag-danger' };
  tbody.innerHTML = safetyData.map((s, i) => `
    <tr>
      <td>${i+1}</td><td>${escapeHtml(s.date)}</td>
      <td><span class="tag tag-info">${escapeHtml(s.type)}</span></td>
      <td>${escapeHtml((s.description || '').slice(0, 60))}</td>
      <td><span class="tag ${sevColor[s.severity] || 'tag-gray'}">${escapeHtml(s.severity || '')}</span></td>
      <td>${escapeHtml(s.responsible || '-')}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon delete" onclick="deleteSafety('${escapeAttr(s.reportId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function openSafetyModal() {
  fillProjectSelect('saf_projectId');
  ['saf_description','saf_responsible','saf_action'].forEach(id => setValue(id, ''));
  setValue('saf_date', new Date().toISOString().split('T')[0]);
  document.getElementById('safetyModal').classList.add('active');
}

async function saveSafety() {
  const data = {
    date: getValue('saf_date'), type: getValue('saf_type'),
    projectId: getValue('saf_projectId'), description: getValue('saf_description'),
    severity: getValue('saf_severity'), responsible: getValue('saf_responsible'),
    action: getValue('saf_action')
  };
  if (!data.date || !data.description) { showToast('أكمل الحقول', 'warning'); return; }
  const result = await apiPost('addSafety', data);
  if (result.success) { closeModalById('safetyModal'); showToast('تم الحفظ', 'success'); loadSafety(); loadDashboard(); }
  else showToast(result.error, 'error');
}

function deleteSafety(id) {
  showConfirm('حذف التقرير؟', async () => {
    const res = await apiPost('deleteSafety', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadSafety(); }
  });
}

async function loadQuality() {
  const res = await apiGet('getQuality');
  if (!res.success) return;
  qualityData = res.data || [];
  const tbody = document.getElementById('qualityTable');
  if (!tbody) return;
  if (qualityData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد فحوصات</td></tr>';
    return;
  }
  tbody.innerHTML = qualityData.map((q, i) => {
    const proj = projectsData.find(p => p.projectId === q.projectId);
    return `<tr>
      <td>${i+1}</td><td>${escapeHtml(q.date)}</td>
      <td>${escapeHtml(q.testType)}</td>
      <td>${escapeHtml(proj ? proj.name : '-')}</td>
      <td><strong>${escapeHtml(q.result)}</strong></td>
      <td>${q.status === 'مطابق' ? '<span class="tag tag-success">مطابق ✓</span>' : '<span class="tag tag-danger">غير مطابق ✗</span>'}</td>
      <td>${escapeHtml(q.engineer || '-')}</td>
    </tr>`;
  }).join('');
}

function openQualityModal() {
  fillProjectSelect('qty_projectId');
  ['qty_result','qty_engineer'].forEach(id => setValue(id, ''));
  setValue('qty_date', new Date().toISOString().split('T')[0]);
  document.getElementById('qualityModal').classList.add('active');
}

async function saveQuality() {
  const data = {
    date: getValue('qty_date'), testType: getValue('qty_testType'),
    projectId: getValue('qty_projectId'), result: getValue('qty_result'),
    status: getValue('qty_status'), engineer: getValue('qty_engineer')
  };
  if (!data.date || !data.result) { showToast('أكمل الحقول', 'warning'); return; }
  const result = await apiPost('addQuality', data);
  if (result.success) { closeModalById('qualityModal'); showToast('تم الحفظ', 'success'); loadQuality(); }
  else showToast(result.error, 'error');
}

async function loadProgress() {
  const res = await apiGet('getProgress');
  if (!res.success) return;
  progressData = res.data || [];
  const tbody = document.getElementById('progressTable');
  if (!tbody) return;
  if (progressData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد تقارير</td></tr>';
    return;
  }
  tbody.innerHTML = progressData.map((p, i) => {
    const proj = projectsData.find(x => x.projectId === p.projectId);
    const boq = boqData.find(x => x.boqId === p.boqItemId);
    return `<tr>
      <td>${i+1}</td><td>${escapeHtml(p.date)}</td>
      <td>${escapeHtml(proj ? proj.name : '-')}</td>
      <td>${escapeHtml(p.siteId || '-')}</td>
      <td>${boq ? `<span class="tag tag-info">${escapeHtml(boq.name)}</span>` : '<span class="tag tag-gray">غير محدد</span>'}</td>
      <td><span class="tag tag-info">${escapeHtml(p.layer || '-')}</span></td>
      <td><strong>${formatNum(p.quantity || 0)}</strong> ${boq ? escapeHtml(boq.unit || '') : ''}</td>
      <td>${escapeHtml(p.supervisor || '-')}</td>
    </tr>`;
  }).join('');
}

async function openProgressModal() {
  await loadProjects();
  document.getElementById('prgId').value = '';
  fillProjectSelect('prg_projectId');
  ['prg_notes','prg_supervisor','prg_quantity','prg_workedKm','prg_siteId'].forEach(id => setValue(id, ''));
  setValue('prg_date', new Date().toISOString().split('T')[0]);
  document.getElementById('progressModal').classList.add('active');
}

async function loadBOQForProgress() {
  const projectId = getValue('prg_projectId');
  if (!projectId) {
    document.getElementById('prg_boqItemId').innerHTML = '<option value="">اختر البند</option>';
    return;
  }
  const res = await apiGet('getBOQ', { projectId });
  if (!res.success) return;
  const items = res.data || [];
  document.getElementById('prg_boqItemId').innerHTML = '<option value="">اختر البند</option>' +
    items.map(b => `<option value="${escapeAttr(b.boqId)}" data-unit="${escapeAttr(b.unit || '')}">${escapeHtml(b.name)} (${b.progressPercent}%)</option>`).join('');
}

function fillBOQUnit() {
  const sel = document.getElementById('prg_boqItemId');
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.dataset.unit) document.getElementById('prg_unitHint').textContent = 'الوحدة: ' + opt.dataset.unit;
  else document.getElementById('prg_unitHint').textContent = 'الوحدة: —';
}

async function saveProgress() {
  const data = {
    date: getValue('prg_date'), projectId: getValue('prg_projectId'),
    siteId: getValue('prg_siteId'), boqItemId: getValue('prg_boqItemId'),
    layer: getValue('prg_layer'), quantity: getValue('prg_quantity'),
    workedKm: getValue('prg_workedKm'),
    supervisor: getValue('prg_supervisor'), notes: getValue('prg_notes')
  };
  if (!data.date || !data.projectId || !data.supervisor || !data.quantity) { showToast('أكمل الحقول', 'warning'); return; }
  const result = await apiPost('addProgress', data);
  if (result.success) { closeModalById('progressModal'); showToast('تم الحفظ', 'success'); loadProgress(); }
  else showToast(result.error, 'error');
}

console.log('📊 data.js تم التحميل');
