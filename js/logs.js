// ═══════════════════════════════════════════════════════════
// 🚜 سجل المعدات اليومي
// ═══════════════════════════════════════════════════════════
async function loadDailyEquipLog() {
  const date = getValue('filterEquipDate');
  const projectId = getValue('filterEquipProject');
  const res = await apiGet('getDailyEquipLog', { date, projectId });
  if (!res.success) return;
  dailyEquipData = res.data || [];
  const tbody = document.getElementById('dailyEquipTable');
  if (!tbody) return;
  if (dailyEquipData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد سجلات</td></tr>';
    return;
  }
  tbody.innerHTML = dailyEquipData.map((log, i) => {
    const eq = equipmentData.find(e => e.equipId === log.equipId);
    const morning = (log.morningFrom || '-') + ' - ' + (log.morningTo || '-');
    const evening = (log.eveningFrom || '-') + ' - ' + (log.eveningTo || '-');
    const attCount = (log.attachments || '').split(',').filter(Boolean).length;
    return `<tr>
      <td>${i+1}</td><td>${escapeHtml(log.date)}</td>
      <td><strong>${escapeHtml(eq ? eq.name : log.equipId)}</strong></td>
      <td>${escapeHtml(log.siteId || '-')}</td>
      <td>${escapeHtml(morning)}</td><td>${escapeHtml(evening)}</td>
      <td><span class="tag tag-info">${log.workingHours} س</span></td>
      <td>${log.dieselQty} ل</td><td>${formatCurrency(log.dieselCost)}</td>
      <td><strong>${log.workedQty || 0}</strong></td>
      <td>${attCount > 0 ? `<button type="button" class="btn-icon camera" onclick="viewAttachments('daily-equip','${escapeAttr(log.logId)}')"><i class="fas fa-camera"></i> ${attCount}</button>` : '-'}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon edit" onclick="editDailyEquip('${escapeAttr(log.logId)}')"><i class="fas fa-edit"></i></button>
        <button type="button" class="btn-icon delete" onclick="deleteDailyEquip('${escapeAttr(log.logId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function openDailyEquipModal() {
  document.getElementById('delLogId').value = '';
  ['del_morningFrom','del_morningTo','del_eveningFrom','del_eveningTo','del_dieselQty','del_workedQty','del_workDescription','del_notes','del_siteId','del_operator'].forEach(id => setValue(id, ''));
  setValue('del_date', new Date().toISOString().split('T')[0]);
  const eqSelect = document.getElementById('del_equipId');
  eqSelect.innerHTML = '<option value="">اختر</option>' +
    equipmentData.map(e => `<option value="${escapeAttr(e.equipId)}" data-operator="${escapeAttr(e.operator || '')}">${escapeHtml(e.name)}</option>`).join('');
  const projSelect = document.getElementById('del_projectId');
  projSelect.innerHTML = '<option value="">اختر</option>' +
    projectsData.map(p => `<option value="${escapeAttr(p.projectId)}">${escapeHtml(p.name)}</option>`).join('');
  clearUploads('del');
  document.getElementById('dailyEquipTitle').textContent = 'تسجيل عمل معدة';
  document.getElementById('dailyEquipModal').classList.add('active');
}

function fillEquipOperator() {
  const sel = document.getElementById('del_equipId');
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.dataset.operator) document.getElementById('del_operator').value = opt.dataset.operator;
}

async function saveDailyEquipLog() {
  const att = await uploadAttachments('del', 'daily-equip', '');
  const data = {
    logId: getValue('delLogId'), date: getValue('del_date'),
    equipId: getValue('del_equipId'), projectId: getValue('del_projectId'),
    siteId: getValue('del_siteId'), operator: getValue('del_operator'),
    morningFrom: getValue('del_morningFrom'), morningTo: getValue('del_morningTo'),
    eveningFrom: getValue('del_eveningFrom'), eveningTo: getValue('del_eveningTo'),
    dieselQty: getValue('del_dieselQty'), workedQty: getValue('del_workedQty'),
    workDescription: getValue('del_workDescription'),
    supervisor: getValue('del_supervisor'), notes: getValue('del_notes'),
    attachments: att
  };
  if (!data.date || !data.equipId || !data.projectId) { showToast('أكمل الحقول', 'warning'); return; }
  const action = data.logId ? 'updateDailyEquipLog' : 'addDailyEquipLog';
  const result = await apiPost(action, data);
  if (result.success) { closeModalById('dailyEquipModal'); showToast('تم الحفظ', 'success'); loadDailyEquipLog(); }
  else showToast(result.error, 'error');
}

function editDailyEquip(logId) {
  const log = dailyEquipData.find(x => x.logId === logId);
  if (!log) return;
  document.getElementById('delLogId').value = log.logId;
  setValue('del_date', log.date);
  setValue('del_siteId', log.siteId);
  setValue('del_operator', log.operator);
  setValue('del_morningFrom', log.morningFrom);
  setValue('del_morningTo', log.morningTo);
  setValue('del_eveningFrom', log.eveningFrom);
  setValue('del_eveningTo', log.eveningTo);
  setValue('del_dieselQty', log.dieselQty);
  setValue('del_workedQty', log.workedQty);
  setValue('del_workDescription', log.workDescription);
  setValue('del_supervisor', log.supervisor);
  setValue('del_notes', log.notes);
  const eqSelect = document.getElementById('del_equipId');
  eqSelect.innerHTML = '<option value="">اختر</option>' +
    equipmentData.map(e => `<option value="${escapeAttr(e.equipId)}">${escapeHtml(e.name)}</option>`).join('');
  eqSelect.value = log.equipId;
  const projSelect = document.getElementById('del_projectId');
  projSelect.innerHTML = '<option value="">اختر</option>' +
    projectsData.map(p => `<option value="${escapeAttr(p.projectId)}">${escapeHtml(p.name)}</option>`).join('');
  projSelect.value = log.projectId;
  clearUploads('del');
  document.getElementById('dailyEquipTitle').textContent = 'تعديل السجل';
  document.getElementById('dailyEquipModal').classList.add('active');
}

function deleteDailyEquip(id) {
  showConfirm('حذف السجل؟', async () => {
    const res = await apiPost('deleteDailyEquipLog', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadDailyEquipLog(); }
  });
}

// ═══════════════════════════════════════════════════════════
// 👷 سجل العمال اليومي
// ═══════════════════════════════════════════════════════════
async function loadDailyWorkersLog() {
  const date = getValue('filterWorkerDate');
  const projectId = getValue('filterWorkerProject');
  const paymentStatus = getValue('filterPaymentStatus');
  const res = await apiGet('getDailyWorkersLog', { date, projectId, paymentStatus });
  if (!res.success) return;
  dailyWorkersData = res.data || [];
  const tbody = document.getElementById('dailyWorkersTable');
  if (!tbody) return;
  if (dailyWorkersData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد سجلات</td></tr>';
    return;
  }
  tbody.innerHTML = dailyWorkersData.map((log, i) => {
    const w = workersData.find(x => x.workerId === log.workerId);
    const base = Number(log.baseDailyWage) || Number(log.dailyWage) || 0;
    const ot = Number(log.overtime) || 0;
    const otAmount = ot * (base / CONFIG.WORKDAY_HOURS) * CONFIG.OVERTIME_MULTIPLIER;
    const net = base + otAmount - (Number(log.discount) || 0) + (Number(log.bonus) || 0);
    const attTag = log.attendance === 'حاضر' ? 'tag-success' : (log.attendance === 'إجازة' ? 'tag-warning' : 'tag-danger');
    const isPaid = log.paymentStatus === 'استلم';
    const attCount = (log.attachments || '').split(',').filter(Boolean).length;
    const otDisplay = ot > 0 ? `<span class="tag tag-info">+${ot} س</span>` : '-';
    return `<tr>
      <td>${i+1}</td><td>${escapeHtml(log.date)}</td>
      <td><strong>${escapeHtml(w ? w.name : log.workerId)}</strong></td>
      <td>${escapeHtml(w ? w.job : '-')}</td>
      <td><span class="tag ${attTag}">${escapeHtml(log.attendance)}</span></td>
      <td>${log.hours || 0} س</td><td>${formatNum(base)}</td>
      <td>${otDisplay}</td>
      <td style="color:var(--danger);">${log.discount ? '-' + formatNum(log.discount) : '-'}</td>
      <td style="color:var(--success);">${log.bonus ? '+' + formatNum(log.bonus) : '-'}</td>
      <td><strong style="color:var(--primary);">${formatNum(net)}</strong></td>
      <td class="check-cell">
        <input type="checkbox" ${isPaid ? 'checked' : ''} onchange="toggleWorkerPayment('${escapeAttr(log.logId)}', this.checked)">
      </td>
      <td>${attCount > 0 ? `<button type="button" class="btn-icon camera" onclick="viewAttachments('worker','${escapeAttr(log.logId)}')"><i class="fas fa-camera"></i> ${attCount}</button>` : '-'}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon edit" onclick="editDailyWorker('${escapeAttr(log.logId)}')"><i class="fas fa-edit"></i></button>
        <button type="button" class="btn-icon delete" onclick="deleteDailyWorker('${escapeAttr(log.logId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

async function toggleWorkerPayment(logId, isPaid) {
  const res = await apiPost('confirmWorkerPayment', {
    logId: logId, paidDate: new Date().toISOString().split('T')[0]
  });
  if (res.success) showToast(isPaid ? '✅ تم التأكيد' : 'تم الإلغاء', 'success');
  else { showToast('خطأ', 'error'); loadDailyWorkersLog(); }
}

function recalcWorkerNet() {
  const baseWage = Number(getValue('dwl_baseDailyWage')) || Number(getValue('dwl_dailyWage')) || 0;
  const disc = Number(getValue('dwl_discount')) || 0;
  const bon = Number(getValue('dwl_bonus')) || 0;
  const ot = Number(getValue('dwl_overtime')) || 0;
  
  const hourlyRate = baseWage / CONFIG.WORKDAY_HOURS;
  const overtimeAmount = ot * hourlyRate * CONFIG.OVERTIME_MULTIPLIER;
  const net = baseWage + overtimeAmount - disc + bon;
  
  document.getElementById('dwl_netDisplay').textContent = formatNum(net) + ' ر.ي';
  
  const breakdown = document.getElementById('dwl_breakdown');
  if (breakdown) {
    if (ot > 0) {
      breakdown.innerHTML = `أساسي: ${formatNum(baseWage)} + إضافي (${ot} س × ${formatNum(hourlyRate)} × 1.5 = ${formatNum(overtimeAmount)}) ${disc > 0 ? '- خصم ' + formatNum(disc) : ''} ${bon > 0 ? '+ حافز ' + formatNum(bon) : ''}`;
    } else {
      breakdown.innerHTML = `أساسي: ${formatNum(baseWage)} ${disc > 0 ? '- خصم ' + formatNum(disc) : ''} ${bon > 0 ? '+ حافز ' + formatNum(bon) : ''}`;
    }
  }
}

function openDailyWorkerModal() {
  document.getElementById('dwlLogId').value = '';
  document.getElementById('dwl_baseDailyWage').value = '';
  ['dwl_workDescription','dwl_notes','dwl_siteId','dwl_dailyWage'].forEach(id => setValue(id, ''));
  setValue('dwl_date', new Date().toISOString().split('T')[0]);
  setValue('dwl_overtime', '0');
  setValue('dwl_discount', '0');
  setValue('dwl_bonus', '0');
  setValue('dwl_attendance', 'حاضر');
  setValue('dwl_paymentStatus', 'لم يستلم');
  recalcWorkerNet();
  const workerSelect = document.getElementById('dwl_workerId');
  workerSelect.innerHTML = '<option value="">اختر</option>' +
    workersData.map(w => `<option value="${escapeAttr(w.workerId)}" data-job="${escapeAttr(w.job || '')}" data-salary="${escapeAttr(w.dailyWage || 0)}">${escapeHtml(w.name)}</option>`).join('');
  const projSelect = document.getElementById('dwl_projectId');
  projSelect.innerHTML = '<option value="">اختر</option>' +
    projectsData.map(p => `<option value="${escapeAttr(p.projectId)}">${escapeHtml(p.name)}</option>`).join('');
  clearUploads('dwl');
  document.getElementById('dailyWorkerTitle').textContent = 'تسجيل عمل عامل';
  document.getElementById('dailyWorkerModal').classList.add('active');
}

function fillWorkerJob() {
  const sel = document.getElementById('dwl_workerId');
  const opt = sel.options[sel.selectedIndex];
  if (opt) {
    if (opt.dataset.job) document.getElementById('dwl_job').value = opt.dataset.job;
    if (opt.dataset.salary) {
      const baseWage = opt.dataset.salary;
      document.getElementById('dwl_dailyWage').value = baseWage;
      document.getElementById('dwl_baseDailyWage').value = baseWage;
      recalcWorkerNet();
    }
  }
}

async function saveDailyWorkersLog() {
  const att = await uploadAttachments('dwl', 'worker', '');
  const baseWage = getValue('dwl_baseDailyWage') || getValue('dwl_dailyWage');
  const data = {
    logId: getValue('dwlLogId'), date: getValue('dwl_date'),
    workerId: getValue('dwl_workerId'), projectId: getValue('dwl_projectId'),
    siteId: getValue('dwl_siteId'), attendance: getValue('dwl_attendance'),
    overtime: getValue('dwl_overtime'),
    dailyWage: baseWage,
    baseDailyWage: baseWage,
    discount: getValue('dwl_discount'), bonus: getValue('dwl_bonus'),
    workDescription: getValue('dwl_workDescription'),
    supervisor: getValue('dwl_supervisor'), notes: getValue('dwl_notes'),
    paymentStatus: getValue('dwl_paymentStatus'), attachments: att
  };
  if (!data.date || !data.workerId) { showToast('أكمل الحقول', 'warning'); return; }
  const action = data.logId ? 'updateDailyWorkersLog' : 'addDailyWorkersLog';
  const result = await apiPost(action, data);
  if (result.success) { closeModalById('dailyWorkerModal'); showToast('تم الحفظ', 'success'); loadDailyWorkersLog(); }
  else showToast(result.error, 'error');
}

function editDailyWorker(logId) {
  const log = dailyWorkersData.find(x => x.logId === logId);
  if (!log) return;
  document.getElementById('dwlLogId').value = log.logId;
  const baseWage = log.baseDailyWage || log.dailyWage || 0;
  document.getElementById('dwl_baseDailyWage').value = baseWage;
  setValue('dwl_date', log.date);
  setValue('dwl_siteId', log.siteId);
  setValue('dwl_attendance', log.attendance);
  setValue('dwl_dailyWage', baseWage);
  setValue('dwl_discount', log.discount || 0);
  setValue('dwl_bonus', log.bonus || 0);
  setValue('dwl_overtime', log.overtime || 0);
  setValue('dwl_workDescription', log.workDescription);
  setValue('dwl_supervisor', log.supervisor);
  setValue('dwl_notes', log.notes);
  setValue('dwl_paymentStatus', log.paymentStatus || 'لم يستلم');
  recalcWorkerNet();
  const workerSelect = document.getElementById('dwl_workerId');
  workerSelect.innerHTML = '<option value="">اختر</option>' +
    workersData.map(w => `<option value="${escapeAttr(w.workerId)}" data-job="${escapeAttr(w.job || '')}" data-salary="${escapeAttr(w.dailyWage || 0)}">${escapeHtml(w.name)}</option>`).join('');
  workerSelect.value = log.workerId;
  const projSelect = document.getElementById('dwl_projectId');
  projSelect.innerHTML = '<option value="">اختر</option>' +
    projectsData.map(p => `<option value="${escapeAttr(p.projectId)}">${escapeHtml(p.name)}</option>`).join('');
  projSelect.value = log.projectId;
  clearUploads('dwl');
  document.getElementById('dailyWorkerTitle').textContent = 'تعديل السجل';
  document.getElementById('dailyWorkerModal').classList.add('active');
}

function deleteDailyWorker(id) {
  showConfirm('حذف السجل؟', async () => {
    const res = await apiPost('deleteDailyWorkersLog', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadDailyWorkersLog(); }
  });
}

// ═══════════════════════════════════════════════════════════
// الحضور الجماعي
// ═══════════════════════════════════════════════════════════
async function loadGroupAttendance() {
  const date = getValue('attendanceDate');
  if (!date) return;
  await loadWorkers();
  const res = await apiGet('getDailyWorkersLog', { date });
  const dayLogs = res.success ? (res.data || []) : [];
  const tbody = document.getElementById('groupAttendanceBody');
  if (!tbody) return;

  const activeWorkers = workersData.filter(w => w.status !== 'منتهي');
  if (activeWorkers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted);">لا يوجد عمال</td></tr>';
    return;
  }

  groupAttendanceData = activeWorkers.map(w => {
    const log = dayLogs.find(l => l.workerId === w.workerId);
    let defaultStatus = 'حاضر';
    if (w.status === 'إجازة') defaultStatus = 'إجازة';
    return {
      workerId: w.workerId, name: w.name, job: w.job,
      attendance: log ? log.attendance : defaultStatus,
      notes: log ? (log.notes || '') : '',
      logId: log ? log.logId : ''
    };
  });

  tbody.innerHTML = groupAttendanceData.map((w, i) => `
    <tr>
      <td>${i+1}</td>
      <td>
        <div style="font-weight:700;">${escapeHtml(w.name)}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${escapeHtml(w.job || '')}</div>
      </td>
      <td>
        <select style="padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);font-family:inherit;font-size:13px;cursor:pointer;" onchange="updateAttendanceStatus(${i}, this.value)">
          <option value="حاضر" ${w.attendance === 'حاضر' ? 'selected' : ''}>✅ حاضر</option>
          <option value="غائب" ${w.attendance === 'غائب' ? 'selected' : ''}>❌ غائب</option>
          <option value="إجازة" ${w.attendance === 'إجازة' ? 'selected' : ''}>🌴 إجازة</option>
        </select>
      </td>
      <td>
        <input type="text" class="form-input" style="padding:8px;font-size:13px;"
          value="${escapeAttr(w.notes)}" onchange="updateAttendanceNotes(${i}, this.value)" placeholder="ملاحظات...">
      </td>
    </tr>
  `).join('');
}

function updateAttendanceStatus(index, value) { if (groupAttendanceData[index]) groupAttendanceData[index].attendance = value; }
function updateAttendanceNotes(index, value) { if (groupAttendanceData[index]) groupAttendanceData[index].notes = value; }

async function saveGroupAttendance() {
  const date = getValue('attendanceDate');
  const projectId = getValue('attendanceProject');
  if (!date) { showToast('اختر التاريخ', 'warning'); return; }
  if (groupAttendanceData.length === 0) { showToast('لا يوجد عمال', 'warning'); return; }
  const workers = groupAttendanceData.map(w => ({
    workerId: w.workerId, attendance: w.attendance,
    notes: w.notes, projectId: projectId || '', siteId: ''
  }));
  showToast('⏳ جاري الحفظ...', 'info');
  const result = await apiPost('saveGroupAttendance', { date, workers });
  if (result.success) { showToast('✅ ' + result.message, 'success'); loadGroupAttendance(); }
  else showToast(result.error, 'error');
}

function showMonthlyAttendance() {
  const now = new Date();
  document.getElementById('monthlyYear').value = now.getFullYear();
  document.getElementById('monthlyMonth').value = now.getMonth() + 1;
  document.getElementById('monthlyAttendanceContent').innerHTML = '';
  document.getElementById('monthlyAttendanceModal').classList.add('active');
}

async function loadMonthlyAttendance() {
  const year = parseInt(document.getElementById('monthlyYear').value);
  const month = parseInt(document.getElementById('monthlyMonth').value);
  const container = document.getElementById('monthlyAttendanceContent');
  container.innerHTML = '<div style="text-align:center;padding:30px;"><span class="loader" style="border-top-color:var(--primary);"></span></div>';
  const res = await apiGet('getMonthlyAttendance', { year, month });
  if (!res.success) { container.innerHTML = '<div class="empty-state">خطأ</div>'; return; }
  const d = res.data;
  const days = [];
  for (let i = 1; i <= d.daysInMonth; i++) days.push(i);

  let html = '<table style="border-collapse:collapse;width:100%;min-width:900px;font-size:12px;"><thead><tr><th style="border:1px solid var(--border);padding:6px;background:var(--bg);">العامل</th>';
  days.forEach(day => { html += `<th style="border:1px solid var(--border);padding:6px;background:var(--bg);">${day}</th>`; });
  html += '<th style="border:1px solid var(--border);padding:6px;background:var(--bg);">حاضر</th><th style="border:1px solid var(--border);padding:6px;background:var(--bg);">غائب</th><th style="border:1px solid var(--border);padding:6px;background:var(--bg);">إجازة</th></tr></thead><tbody>';

  d.workers.forEach(w => {
    html += `<tr><td style="text-align:right;padding:8px;font-weight:700;background:var(--bg-hover);border:1px solid var(--border);">${escapeHtml(w.name)}</td>`;
    days.forEach(day => {
      const dayStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const att = w.attendance[dayStr] || '';
      let bg = '';
      if (att === 'حاضر') bg = 'background:rgba(34,197,94,.2);color:var(--success);font-weight:700;';
      else if (att === 'غائب') bg = 'background:rgba(239,68,68,.2);color:var(--danger);font-weight:700;';
      else if (att === 'إجازة') bg = 'background:rgba(245,158,11,.2);color:var(--warning);font-weight:700;';
      const sym = att === 'حاضر' ? '✓' : (att === 'غائب' ? '✗' : (att === 'إجازة' ? '🌴' : ''));
      html += `<td style="border:1px solid var(--border);padding:6px 4px;text-align:center;${bg}">${sym}</td>`;
    });
    html += `<td style="border:1px solid var(--border);padding:6px;color:var(--success);font-weight:700;text-align:center;">${w.presentDays}</td>`;
    html += `<td style="border:1px solid var(--border);padding:6px;color:var(--danger);font-weight:700;text-align:center;">${w.absentDays}</td>`;
    html += `<td style="border:1px solid var(--border);padding:6px;color:var(--warning);font-weight:700;text-align:center;">${w.leaveDays}</td>`;
    html += '</tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

function printMonthlyAttendance() {
  const content = document.getElementById('monthlyAttendanceContent');
  if (!content || !content.innerHTML.trim() || content.innerHTML.includes('loader')) {
    showToast('⚠️ اعرض التقرير أولاً قبل الطباعة', 'warning');
    return;
  }
  
  const year = document.getElementById('monthlyYear').value;
  const month = document.getElementById('monthlyMonth').value;
  const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const monthName = monthNames[parseInt(month) - 1] || month;
  
  const w = window.open('', 'PrintMonthlyAttendance', 'width=1400,height=900,noopener,noreferrer');
  if (!w) { showToast('⚠️ يرجى السماح بالنوافذ المنبثقة', 'warning'); return; }
  
  w.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>التقرير الشهري للحضور - ${monthName} ${year}</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'Tajawal', sans-serif; padding: 20px; background: #fff; color: #0f172a; direction: rtl; }
    .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #2563eb; }
    .header h1 { margin: 0; color: #2563eb; font-size: 24px; }
    .header .subtitle { margin: 8px 0 0 0; color: #64748b; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
    th { background: #2563eb !important; color: #fff !important; padding: 8px 4px; text-align: center; font-weight: 700; border: 1px solid #1d4ed8; font-size: 11px; }
    td { border: 1px solid #cbd5e1; padding: 5px 3px; text-align: center; font-size: 10px; }
    td:first-child { text-align: right; padding-right: 10px; font-weight: 700; background: #f1f5f9; min-width: 130px; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
    @media print { @page { size: A4 landscape; margin: 8mm; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛣️ شركة الطرق للهندسة والمقاولات</h1>
    <p class="subtitle">التقرير الشهري للحضور والغياب - ${monthName} ${year}</p>
  </div>
  ${content.innerHTML}
  <div class="footer">
    نظام شركة هندسة الطرقات v${CONFIG.VERSION} — ${new Date().toLocaleString('ar-YE')}
  </div>
  <script>setTimeout(() => window.print(), 800);<\/script>
</body>
</html>`);
  w.document.close();
}

// ═══════════════════════════════════════════════════════════
// 📦 توريد المواد
// ═══════════════════════════════════════════════════════════
async function loadMaterialSupply() {
  const date = getValue('filterSupplyDate');
  const toProjectId = getValue('filterSupplyProject');
  const res = await apiGet('getMaterialSupply', { date, toProjectId });
  if (!res.success) return;
  supplyData = res.data || [];
  const tbody = document.getElementById('materialSupplyTable');
  if (!tbody) return;
  if (supplyData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد سجلات</td></tr>';
    return;
  }
  tbody.innerHTML = supplyData.map((s, i) => {
    const attCount = (s.attachments || '').split(',').filter(Boolean).length;
    return `<tr>
      <td>${i+1}</td><td>${escapeHtml(s.date)}</td>
      <td><strong>${escapeHtml(s.matName)}</strong></td>
      <td>${escapeHtml(s.fromLocation || '-')}</td>
      <td><span class="tag tag-info">${s.zafatCount} زفة</span></td>
      <td>${s.zafaSize}</td>
      <td><strong style="color:var(--success);">${s.totalQuantity}</strong></td>
      <td>${escapeHtml(s.unit || '')}</td>
      <td>${escapeHtml(s.driverName || '-')}</td>
      <td>${formatCurrency(s.cost)}</td>
      <td>${attCount > 0 ? `<button type="button" class="btn-icon camera" onclick="viewAttachments('material-supply','${escapeAttr(s.supplyId)}')"><i class="fas fa-camera"></i> ${attCount}</button>` : '-'}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon edit" onclick="editMaterialSupply('${escapeAttr(s.supplyId)}')"><i class="fas fa-edit"></i></button>
        <button type="button" class="btn-icon delete" onclick="deleteMaterialSupply('${escapeAttr(s.supplyId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

async function openMaterialSupplyModal() {
  if (materialsData.length === 0) await loadMaterials();
  if (suppliersData.length === 0) await loadSuppliers();

  document.getElementById('msSupplyId').value = '';
  ['ms_fromLocation','ms_toSiteId','ms_zafatCount','ms_zafaSize','ms_totalQuantity','ms_truckNumber','ms_cost','ms_notes'].forEach(id => setValue(id, ''));
  setValue('ms_date', new Date().toISOString().split('T')[0]);

  const matSelect = document.getElementById('ms_matId');
  matSelect.innerHTML = '<option value="">اختر</option>' +
    materialsData.map(m => `<option value="${escapeAttr(m.matId)}" data-unit="${escapeAttr(m.unit || '')}" data-name="${escapeAttr(m.name || '')}" data-price="${escapeAttr(m.price || 0)}">${escapeHtml(m.name)}</option>`).join('');

  const projSelect = document.getElementById('ms_toProjectId');
  projSelect.innerHTML = '<option value="">اختر</option>' +
    projectsData.map(p => `<option value="${escapeAttr(p.projectId)}">${escapeHtml(p.name)}</option>`).join('');

  const supSelect = document.getElementById('ms_supplierId');
  supSelect.innerHTML = '<option value="">اختر</option>' +
    suppliersData.map(s => `<option value="${escapeAttr(s.supplierId)}">${escapeHtml(s.name)}</option>`).join('');

  const driversRes = await apiGet('getDriversForSupply');
  const drivers = driversRes.success ? driversRes.data : [];
  const driverSelect = document.getElementById('ms_driverName');
  driverSelect.innerHTML = '<option value="">اختر السائق</option>' +
    drivers.map(d => `<option value="${escapeAttr(d.name)}">${escapeHtml(d.name)} - ${escapeHtml(d.job || '')}</option>`).join('');

  clearUploads('ms');
  document.getElementById('materialSupplyModal').classList.add('active');
}

function fillMaterialName() {
  const sel = document.getElementById('ms_matId');
  const opt = sel.options[sel.selectedIndex];
  if (!opt) return;
  if (opt.dataset.unit) document.getElementById('ms_unit').value = opt.dataset.unit;
  const price = Number(opt.dataset.price) || 0;
  const qty = Number(getValue('ms_totalQuantity')) || 0;
  if (price && qty) setValue('ms_cost', price * qty);
}

function calcSupplyTotal() {
  const count = Number(getValue('ms_zafatCount')) || 0;
  const size = Number(getValue('ms_zafaSize')) || 0;
  const total = count * size;
  setValue('ms_totalQuantity', total);
  const sel = document.getElementById('ms_matId');
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.dataset.price) {
    const price = Number(opt.dataset.price) || 0;
    setValue('ms_cost', price * total);
  }
}

async function saveMaterialSupply() {
  const matSelect = document.getElementById('ms_matId');
  const matOpt = matSelect.options[matSelect.selectedIndex];
  const att = await uploadAttachments('ms', 'material-supply', '');
  const data = {
    supplyId: getValue('msSupplyId'), date: getValue('ms_date'),
    matId: getValue('ms_matId'), matName: matOpt ? matOpt.dataset.name : '',
    fromLocation: getValue('ms_fromLocation'),
    toProjectId: getValue('ms_toProjectId'), toSiteId: getValue('ms_toSiteId'),
    zafatCount: getValue('ms_zafatCount'), zafaSize: getValue('ms_zafaSize'),
    unit: getValue('ms_unit'), supplierId: getValue('ms_supplierId'),
    driverName: getValue('ms_driverName'), truckNumber: getValue('ms_truckNumber'),
    cost: getValue('ms_cost'), notes: getValue('ms_notes'), attachments: att
  };
  if (!data.date || !data.matId) { showToast('أكمل الحقول', 'warning'); return; }
  const action = data.supplyId ? 'updateMaterialSupply' : 'addMaterialSupply';
  const result = await apiPost(action, data);
  if (result.success) { closeModalById('materialSupplyModal'); showToast('تم الحفظ', 'success'); loadMaterialSupply(); loadMaterials(); }
  else showToast(result.error, 'error');
}

function editMaterialSupply(supplyId) {
  const s = supplyData.find(x => x.supplyId === supplyId);
  if (!s) return;
  document.getElementById('msSupplyId').value = s.supplyId;
  setValue('ms_date', s.date);
  setValue('ms_unit', s.unit);
  setValue('ms_fromLocation', s.fromLocation);
  setValue('ms_toSiteId', s.toSiteId);
  setValue('ms_zafatCount', s.zafatCount);
  setValue('ms_zafaSize', s.zafaSize);
  setValue('ms_totalQuantity', s.totalQuantity);
  setValue('ms_truckNumber', s.truckNumber);
  setValue('ms_cost', s.cost);
  setValue('ms_notes', s.notes);
  const matSelect = document.getElementById('ms_matId');
  matSelect.innerHTML = '<option value="">اختر</option>' +
    materialsData.map(m => `<option value="${escapeAttr(m.matId)}" data-unit="${escapeAttr(m.unit || '')}" data-name="${escapeAttr(m.name || '')}" data-price="${escapeAttr(m.price || 0)}">${escapeHtml(m.name)}</option>`).join('');
  matSelect.value = s.matId;
  const projSelect = document.getElementById('ms_toProjectId');
  projSelect.innerHTML = '<option value="">اختر</option>' +
    projectsData.map(p => `<option value="${escapeAttr(p.projectId)}">${escapeHtml(p.name)}</option>`).join('');
  projSelect.value = s.toProjectId;
  const supSelect = document.getElementById('ms_supplierId');
  supSelect.innerHTML = '<option value="">اختر</option>' +
    suppliersData.map(x => `<option value="${escapeAttr(x.supplierId)}">${escapeHtml(x.name)}</option>`).join('');
  supSelect.value = s.supplierId;

  apiGet('getDriversForSupply').then(r => {
    const drivers = r.success ? r.data : [];
    const driverSelect = document.getElementById('ms_driverName');
    driverSelect.innerHTML = '<option value="">اختر السائق</option>' +
      drivers.map(d => `<option value="${escapeAttr(d.name)}">${escapeHtml(d.name)} - ${escapeHtml(d.job || '')}</option>`).join('');
    driverSelect.value = s.driverName;
  });

  clearUploads('ms');
  document.getElementById('materialSupplyModal').classList.add('active');
}

function deleteMaterialSupply(id) {
  showConfirm('حذف التوريد؟', async () => {
    const res = await apiPost('deleteMaterialSupply', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadMaterialSupply(); loadMaterials(); }
  });
}

// ═══════════════════════════════════════════════════════════
// ⛽ المحروقات
// ═══════════════════════════════════════════════════════════
async function loadFuelLog() {
  const date = getValue('filterFuelDate');
  const res = await apiGet('getFuelLog', { date });
  if (!res.success) return;
  fuelData = res.data || [];
  const tbody = document.getElementById('fuelTable');
  if (!tbody) return;
  if (fuelData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد سجلات</td></tr>';
    return;
  }
  tbody.innerHTML = fuelData.map((f, i) => {
    const eq = equipmentData.find(e => e.equipId === f.equipId);
    const srcTag = f.sourceType === 'equipLog' ? '<span class="tag tag-info">تلقائي</span>' : '<span class="tag tag-gray">يدوي</span>';
    const attCount = (f.attachments || '').split(',').filter(Boolean).length;
    return `<tr>
      <td>${i+1}</td><td>${escapeHtml(f.date)}</td>
      <td>${escapeHtml(eq ? eq.name : f.equipId || '-')}</td>
      <td><span class="tag tag-info">${escapeHtml(f.fuelType)}</span></td>
      <td><strong>${f.quantity}</strong> لتر</td>
      <td>${formatNum(f.pricePerLiter)}</td>
      <td style="color:var(--danger);font-weight:700;">${formatNum(f.totalCost)}</td>
      <td>${srcTag}</td>
      <td>${attCount > 0 ? `<button type="button" class="btn-icon camera" onclick="viewAttachments('fuel','${escapeAttr(f.fuelId)}')"><i class="fas fa-camera"></i> ${attCount}</button>` : '-'}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon delete" onclick="deleteFuel('${escapeAttr(f.fuelId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function openFuelModal() {
  ['fl_quantity','fl_receiptNumber','fl_driver','fl_notes'].forEach(id => setValue(id, ''));
  setValue('fl_date', new Date().toISOString().split('T')[0]);
  setValue('fl_pricePerLiter', '1080');
  setValue('fl_totalCost', '0');
  const eqSelect = document.getElementById('fl_equipId');
  eqSelect.innerHTML = '<option value="">اختر</option>' +
    equipmentData.map(e => `<option value="${escapeAttr(e.equipId)}">${escapeHtml(e.name)}</option>`).join('');
  clearUploads('fl');
  document.getElementById('fuelModal').classList.add('active');
}

function calcFuelTotal() {
  const qty = Number(getValue('fl_quantity')) || 0;
  const price = Number(getValue('fl_pricePerLiter')) || 0;
  setValue('fl_totalCost', qty * price);
}

async function saveFuelLog() {
  const att = await uploadAttachments('fl', 'fuel', '');
  const data = {
    date: getValue('fl_date'), equipId: getValue('fl_equipId'),
    fuelType: getValue('fl_fuelType'), quantity: getValue('fl_quantity'),
    pricePerLiter: getValue('fl_pricePerLiter'),
    location: getValue('fl_location'), receiptNumber: getValue('fl_receiptNumber'),
    driver: getValue('fl_driver'), notes: getValue('fl_notes'), attachments: att
  };
  if (!data.date || !data.equipId || !data.quantity) { showToast('أكمل الحقول', 'warning'); return; }
  const result = await apiPost('addFuelLog', data);
  if (result.success) { closeModalById('fuelModal'); showToast('تم الحفظ', 'success'); loadFuelLog(); }
  else showToast(result.error, 'error');
}

function deleteFuel(id) {
  showConfirm('حذف السجل؟', async () => {
    const res = await apiPost('deleteFuelLog', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadFuelLog(); }
  });
}

// ═══════════════════════════════════════════════════════════
// 🛒 المشتريات
// ═══════════════════════════════════════════════════════════
async function loadPurchases() {
  const date = getValue('filterPurchaseDate');
  const res = await apiGet('getPurchases', { date });
  if (!res.success) return;
  purchasesData = res.data || [];
  const tbody = document.getElementById('purchasesTable');
  if (!tbody) return;
  if (purchasesData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد مشتريات</td></tr>';
    return;
  }
  tbody.innerHTML = purchasesData.map((p, i) => {
    const sup = suppliersData.find(s => s.supplierId === p.supplierId);
    const attCount = (p.attachments || '').split(',').filter(Boolean).length;
    return `<tr>
      <td>${i+1}</td><td>${escapeHtml(p.date)}</td>
      <td><strong>${escapeHtml(p.itemName)}</strong></td>
      <td><span class="tag tag-gray">${escapeHtml(p.category)}</span></td>
      <td>${p.quantity} ${escapeHtml(p.unit || '')}</td>
      <td>${formatCurrency(p.price)}</td>
      <td style="color:var(--danger);font-weight:700;">${formatCurrency(p.totalCost)}</td>
      <td>${escapeHtml(sup ? sup.name : '-')}</td>
      <td>${attCount > 0 ? `<button type="button" class="btn-icon camera" onclick="viewAttachments('purchase','${escapeAttr(p.purchaseId)}')"><i class="fas fa-camera"></i> ${attCount}</button>` : '-'}</td>
      <td class="actions-cell">
        <button type="button" class="btn-icon edit" onclick="editPurchase('${escapeAttr(p.purchaseId)}')"><i class="fas fa-edit"></i></button>
        <button type="button" class="btn-icon delete" onclick="deletePurchase('${escapeAttr(p.purchaseId)}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function openPurchaseModal() {
  ['pur_itemName','pur_quantity','pur_price','pur_totalCost','pur_invoiceNumber','pur_notes','pur_unit'].forEach(id => setValue(id, ''));
  setValue('pur_date', new Date().toISOString().split('T')[0]);
  setValue('pur_paid', '0');
  setValue('pur_remaining', '0');
  const supSelect = document.getElementById('pur_supplierId');
  supSelect.innerHTML = '<option value="">بدون مورد</option>' +
    suppliersData.map(s => `<option value="${escapeAttr(s.supplierId)}">${escapeHtml(s.name)}</option>`).join('');
  clearUploads('pur');
  document.getElementById('purchaseModal').classList.add('active');
}

function calcPurchaseTotal() {
  const qty = Number(getValue('pur_quantity')) || 0;
  const price = Number(getValue('pur_price')) || 0;
  const total = qty * price;
  setValue('pur_totalCost', total);
  const paid = Number(getValue('pur_paid')) || 0;
  setValue('pur_remaining', Math.max(0, total - paid));
}

async function savePurchase() {
  const att = await uploadAttachments('pur', 'purchase', '');
  const data = {
    date: getValue('pur_date'), supplierId: getValue('pur_supplierId'),
    itemName: getValue('pur_itemName'), category: getValue('pur_category'),
    quantity: getValue('pur_quantity'), unit: getValue('pur_unit'),
    price: getValue('pur_price'), invoiceNumber: getValue('pur_invoiceNumber'),
    paid: getValue('pur_paid'), notes: getValue('pur_notes'), attachments: att
  };
  if (!data.date || !data.itemName || !data.quantity || !data.price) { showToast('أكمل الحقول', 'warning'); return; }
  const result = await apiPost('addPurchase', data);
  if (result.success) { closeModalById('purchaseModal'); showToast('تم الحفظ', 'success'); loadPurchases(); loadSuppliers(); }
  else showToast(result.error, 'error');
}

function editPurchase(purchaseId) {
  const p = purchasesData.find(x => x.purchaseId === purchaseId);
  if (!p) return;
  setValue('pur_date', p.date);
  setValue('pur_itemName', p.itemName);
  setValue('pur_category', p.category);
  setValue('pur_quantity', p.quantity);
  setValue('pur_unit', p.unit);
  setValue('pur_price', p.price);
  setValue('pur_totalCost', p.totalCost);
  setValue('pur_invoiceNumber', p.invoiceNumber);
  setValue('pur_paid', p.paid);
  setValue('pur_remaining', p.remaining);
  setValue('pur_notes', p.notes);
  const supSelect = document.getElementById('pur_supplierId');
  supSelect.innerHTML = '<option value="">بدون مورد</option>' +
    suppliersData.map(s => `<option value="${escapeAttr(s.supplierId)}">${escapeHtml(s.name)}</option>`).join('');
  supSelect.value = p.supplierId;
  clearUploads('pur');
  document.getElementById('purchaseModal').classList.add('active');
}

function deletePurchase(id) {
  showConfirm('حذف المشترى؟', async () => {
    const res = await apiPost('deletePurchase', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadPurchases(); loadSuppliers(); }
  });
}

// ═══════════════════════════════════════════════════════════
// 💰 المصروفات الموحدة
// ═══════════════════════════════════════════════════════════
async function loadConsolidatedExpenses() {
  const from = getValue('consoFrom');
  const to = getValue('consoTo');
  const sourceType = getValue('consoType');
  const res = await apiGet('getConsolidatedExpenses', { from, to, sourceType });
  if (!res.success) return;
  consoExpensesData = res.data || [];
  const tbody = document.getElementById('consolidatedExpensesTable');
  if (!tbody) return;

  if (consoExpensesData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">لا توجد مصروفات</td></tr>';
    document.getElementById('consoTotal').textContent = '0 ر.ي';
    return;
  }

  const typeColors = { 'وقود': 'tag-warning', 'عمال': 'tag-info', 'مواد': 'tag-success', 'مشتريات': 'tag-gray', 'يدوي': 'tag-danger', 'إيجار': 'tag-warning' };
  let html = '';
  let grandTotal = 0;
  let sumFuel = 0, sumWorkers = 0, sumMaterials = 0, sumPurchases = 0, sumManual = 0;

  consoExpensesData.forEach((e, i) => {
    const amount = Number(e.amount) || 0;
    grandTotal += amount;
    if (e.sourceType === 'وقود') sumFuel += amount;
    else if (e.sourceType === 'عمال') sumWorkers += amount;
    else if (e.sourceType === 'مواد') sumMaterials += amount;
    else if (e.sourceType === 'مشتريات') sumPurchases += amount;
    else if (e.sourceType === 'يدوي') sumManual += amount;
    const proj = projectsData.find(p => p.projectId === e.projectId);
    html += `<tr>
      <td>${i+1}</td><td>${escapeHtml(e.date)}</td>
      <td><span class="tag ${typeColors[e.sourceType] || 'tag-gray'}">${escapeHtml(e.sourceType || '')}</span></td>
      <td>${escapeHtml(e.description || '')}</td>
      <td>${escapeHtml(e.category || '')}</td>
      <td><strong style="color:var(--danger);">${amount.toLocaleString('en-US')}</strong></td>
      <td>${escapeHtml(proj ? proj.name : '-')}</td>
    </tr>`;
  });
  tbody.innerHTML = html;
  setText('statFuelCost', formatCurrency(sumFuel));
  setText('statWagesCost', formatCurrency(sumWorkers));
  setText('statMaterialsCost', formatCurrency(sumMaterials));
  setText('statPurchasesCost', formatCurrency(sumPurchases));
  setText('statManualCost', formatCurrency(sumManual));
  setText('statGrandTotal', formatCurrency(grandTotal));
  setText('consoTotal', grandTotal.toLocaleString('en-US') + ' ر.ي');
}

async function rebuildExpenses() {
  if (!confirm('سيتم مسح المصروفات وإعادة تجميعها؟')) return;
  showToast('⏳ جاري إعادة التجميع...', 'info');
  const res = await apiPost('rebuildConsolidatedExpenses', {});
  if (res.success) { showToast('✅ ' + res.message, 'success'); loadConsolidatedExpenses(); }
  else showToast(res.error, 'error');
}

// ═══════════════════════════════════════════════════════════
// 💾 أسعار المحروقات
// ═══════════════════════════════════════════════════════════
async function saveFuelPrices() {
  const data = {
    dieselPrice: getValue('setDieselPrice'),
    petrolPrice: getValue('setPetrolPrice'),
    oilPrice: getValue('setOilPrice')
  };
  const result = await apiPost('updateSettings', data);
  if (result.success) showToast('✅ تم الحفظ', 'success');
  else showToast(result.error, 'error');
}

async function loadFuelPrices() {
  const result = await apiGet('getFuelPrices');
  if (result.success) {
    setValue('setDieselPrice', result.data.dieselPrice);
    setValue('setPetrolPrice', result.data.petrolPrice);
    setValue('setOilPrice', result.data.oilPrice);
  }
}

// ═══════════════════════════════════════════════════════════
// 📷 المرفقات
// ═══════════════════════════════════════════════════════════
async function loadAttachments() {
  const refType = getValue('attFilterType');
  const grid = document.getElementById('attachmentsGrid');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;"><span class="loader" style="border-top-color:var(--primary);"></span></div>';
  const res = await apiGet('getAttachments', { refType });
  if (!res.success) { showToast('خطأ', 'error'); return; }
  attachmentsData = res.data || [];
  if (attachmentsData.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);"><i class="fas fa-images" style="font-size:60px;opacity:.3;display:block;margin-bottom:20px;"></i><h3>لا توجد مرفقات</h3></div>';
    return;
  }
  const typeNames = { 'invoice': 'فاتورة', 'receipt': 'سند', 'daily-equip': 'سجل معدة', 'maintenance': 'صيانة', 'purchase': 'مشترى', 'fuel': 'محروقات', 'material-supply': 'توريد', 'worker': 'عمال', 'other': 'أخرى' };
  grid.innerHTML = attachmentsData.map(a => {
    const thumb = 'https://drive.google.com/thumbnail?id=' + a.fileId + '&sz=w400';
    const isPdf = String(a.fileName).toLowerCase().endsWith('.pdf');
    return `
      <div class="project-card" style="cursor:default;">
        <div style="height:180px;background:var(--bg-hover);border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;margin-bottom:12px;cursor:pointer;" onclick="viewImage('${escapeAttr(a.fileUrl)}')">
          ${isPdf ? `<i class="fas fa-file-pdf" style="font-size:60px;color:var(--danger);"></i>` : `<img src="${thumb}" style="max-width:100%;max-height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><i class="fas fa-image" style="font-size:60px;color:var(--text-muted);display:none;"></i>`}
        </div>
        <div style="font-weight:700;font-size:14px;margin-bottom:5px;word-break:break-all;">${escapeHtml(a.fileName || 'ملف')}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">${escapeHtml(a.date || '')}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
          <span class="tag tag-info">${escapeHtml(typeNames[a.refType] || a.refType || '')}</span>
        </div>
        <div class="actions-cell" style="justify-content:flex-end;">
          <a class="btn-icon view" href="${escapeAttr(a.fileUrl)}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i></a>
          <button type="button" class="btn-icon delete" onclick="deleteAttachment('${escapeAttr(a.attachId)}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

function viewImage(url) {
  const img = document.getElementById('viewImageEl');
  const link = document.getElementById('downloadImageLink');
  const fileIdMatch = url.match(/\/d\/([^/]+)/);
  const fileId = fileIdMatch ? fileIdMatch[1] : '';
  img.src = fileId ? 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200' : url;
  link.href = url;
  document.getElementById('imageViewModal').classList.add('active');
}

async function viewAttachments(refType, refId) {
  const res = await apiGet('getAttachments', { refType, refId });
  if (!res.success || !res.data || res.data.length === 0) { showToast('لا توجد مرفقات', 'info'); return; }
  const urls = res.data.map(a => a.fileUrl);
  if (urls.length === 1) viewImage(urls[0]);
  else window.open(urls[0], '_blank');
}

async function deleteAttachment(id) {
  showConfirm('حذف المرفق؟', async () => {
    const res = await apiPost('deleteAttachment', { id });
    if (res.success) { showToast('تم الحذف', 'success'); loadAttachments(); }
    else showToast(res.error, 'error');
  });
}

function openUploadModal() {
  setValue('up_refType', 'invoice');
  setValue('up_refId', '');
  setValue('up_notes', '');
  document.getElementById('up_file').value = '';
  document.getElementById('up_preview').innerHTML = '<i class="fas fa-image" style="font-size:40px;color:var(--text-muted);"></i><p style="color:var(--text-muted);font-size:13px;margin-top:10px;">لا يوجد ملف</p>';
  document.getElementById('uploadModal').classList.add('active');
}

document.addEventListener('change', function(e) {
  if (e.target && e.target.id === 'up_file') {
    const file = e.target.files[0];
    const preview = document.getElementById('up_preview');
    if (!file) { preview.innerHTML = '<i class="fas fa-image" style="font-size:40px;color:var(--text-muted);"></i>'; return; }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => { preview.innerHTML = `<img src="${ev.target.result}" style="max-width:100%;max-height:200px;border-radius:8px;">`; };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = `<i class="fas fa-file-pdf" style="font-size:40px;color:var(--danger);"></i><p style="font-size:13px;">${escapeHtml(file.name)}</p>`;
    }
  }
});

async function doUpload() {
  const file = document.getElementById('up_file').files[0];
  if (!file) { showToast('اختر ملفاً', 'warning'); return; }
  if (file.size > 5 * 1024 * 1024) { showToast('الحد 5MB', 'warning'); return; }
  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loader"></span> جاري الرفع...';
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const result = await apiPost('uploadFileToDrive', {
      fileData: ev.target.result, fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      refType: getValue('up_refType'), refId: getValue('up_refId'),
      notes: getValue('up_notes')
    });
    if (result.success) { closeModalById('uploadModal'); showToast('✅ تم الرفع', 'success'); loadAttachments(); }
    else showToast(result.error, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-upload"></i> رفع';
  };
  reader.readAsDataURL(file);
}

console.log('📋 logs.js تم التحميل');
