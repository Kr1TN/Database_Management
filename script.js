const API = 'http://localhost:3000/api';

// ─── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  navigate('dashboard');
  checkApiStatus();
});

// ─── API STATUS ──────────────────────────────────────────────
async function checkApiStatus() {
  try {
    const r = await fetch(`${API}/health`);
    const ok = r.ok;
    document.getElementById('apiDot').style.backgroundColor = ok ? '#4caf82' : '#e05c5c';
    document.getElementById('apiStatus').innerText = ok ? 'Connected to Oracle' : 'Connection Failed';
  } catch {
    document.getElementById('apiDot').style.backgroundColor = '#e05c5c';
    document.getElementById('apiStatus').innerText = 'Connection Failed';
  }
}

// ─── NAVIGATION ──────────────────────────────────────────────
function navigate(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pg = document.getElementById(`page-${pageId}`);
  if (pg) pg.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(pageId))
      item.classList.add('active');
  });

  if (pageId === 'dashboard')   loadDashboard();
  if (pageId === 'employees')   { loadEmployees(); loadDropdowns(); }
  if (pageId === 'attendance')  { loadAttendance(); loadShiftDropdown(); loadEmpDropdown(); }
  if (pageId === 'salary')      {} // user clicks "ประมวลผล"
  if (pageId === 'departments') loadDepartments();
}

// ─── HELPERS ─────────────────────────────────────────────────
function fmt(n) { return Number(n || 0).toLocaleString('th-TH'); }
function shiftIcon(name) {
  if (!name) return '🔄';
  const n = name.toLowerCase();
  if (n.includes('morning') || n.includes('day')) return '🌅';
  if (n.includes('evening') || n.includes('afternoon')) return '☀️';
  if (n.includes('night')) return '🌙';
  return '🔄';
}
const DEPT_CLASS = { 'Front Office':'dept-fo', 'Housekeeping':'dept-hk', 'F&B':'dept-fb', 'Maintenance':'dept-mt', 'Security':'dept-sc' };
function deptBadge(name) {
  return `<span class="dept-badge ${DEPT_CLASS[name] || ''}">${name || '-'}</span>`;
}

function showToast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  const d = document.createElement('div');
  d.className = `toast ${type}`;
  d.innerHTML = (type === 'success' ? '✅ ' : '❌ ') + msg;
  c.appendChild(d);
  setTimeout(() => d.remove(), 3500);
}

// ─── MODAL ───────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

// ─── DASHBOARD ───────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [stats, employees] = await Promise.all([
      fetch(`${API}/stats`).then(r => r.json()),
      fetch(`${API}/employees`).then(r => r.json()),
    ]);

    document.getElementById('dashStats').innerHTML = `
      <div class="stat-card"><div class="stat-label">พนักงานทั้งหมด</div><div class="stat-value">${stats.totalEmployees}</div><div class="stat-sub">${stats.activeEmployees} Active</div></div>
      <div class="stat-card"><div class="stat-label">แผนกทั้งหมด</div><div class="stat-value">${stats.departments}</div><div class="stat-sub">5 แผนกหลัก</div></div>
      <div class="stat-card"><div class="stat-label">บันทึกกะดึก</div><div class="stat-value">${stats.nightShiftRecords}</div><div class="stat-sub">+30% Premium</div></div>
      <div class="stat-card"><div class="stat-label">บันทึกเวลาทั้งหมด</div><div class="stat-value">${stats.attendanceRecords}</div><div class="stat-sub">รายการ</div></div>
    `;

    const tbody = document.getElementById('dashRecentBody');
    tbody.innerHTML = (Array.isArray(employees) ? employees.slice(0, 5) : []).map(e => `
      <tr>
        <td style="color:var(--muted);font-size:12px">${e.EMPLOYEE_ID}</td>
        <td style="font-weight:500;color:var(--cream)">${e.FIRST_NAME} ${e.LAST_NAME}</td>
        <td>${deptBadge(e.DEPARTMENT_NAME)}</td>
        <td style="font-size:12px">${e.POSITION_NAME || '-'}</td>
        <td style="font-size:12px">${shiftIcon(e.SHIFT_TYPE)} ${e.SHIFT_TYPE || '-'}</td>
        <td class="${e.STATUS === 'Active' ? 'status-active' : 'status-inactive'}">${e.STATUS || '-'}</td>
      </tr>`).join('');
  } catch (err) {
    console.error('Dashboard error:', err);
    showToast('โหลด Dashboard ไม่สำเร็จ', 'error');
  }
}

// ─── EMPLOYEES ───────────────────────────────────────────────
let _empData = [];
let _empFilter = 'ALL';
let _editingEmpId = null;

async function loadEmployees() {
  const q = document.getElementById('empSearch')?.value || '';
  try {
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    if (_empFilter !== 'ALL') params.set('dept', _empFilter);
    const data = await fetch(`${API}/employees?${params}`).then(r => r.json());
    _empData = Array.isArray(data) ? data : [];
    renderEmployeeTable(_empData);
  } catch (err) {
    console.error(err);
    showToast('โหลดข้อมูลพนักงานไม่สำเร็จ', 'error');
  }
}

function renderEmployeeTable(data) {
  const tbody = document.getElementById('empTableBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="loading">ไม่พบข้อมูลพนักงาน</div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(e => `
    <tr>
      <td style="color:var(--muted);font-size:12px">${e.EMPLOYEE_ID}</td>
      <td style="font-weight:500;color:var(--cream)">${e.FIRST_NAME} ${e.LAST_NAME}</td>
      <td>${deptBadge(e.DEPARTMENT_NAME)}</td>
      <td style="font-size:12px">${e.POSITION_NAME || '-'}</td>
      <td style="font-size:12px">${shiftIcon(e.SHIFT_TYPE)} ${e.SHIFT_TYPE || '-'}</td>
      <td style="color:var(--gold)">${fmt(e.ACTUAL_SALARY)} ฿</td>
      <td class="${e.STATUS === 'Active' ? 'status-active' : 'status-inactive'}">${e.STATUS}</td>
      <td>
        <button class="action-btn" onclick="editEmployee(${e.EMPLOYEE_ID})" title="แก้ไข">✏️</button>
        <button class="action-btn" onclick="deleteEmployee(${e.EMPLOYEE_ID})" title="ลบ">🗑️</button>
      </td>
    </tr>`).join('');
}

function filterEmp(dept, btn) {
  _empFilter = dept;
  document.querySelectorAll('#page-employees .btn').forEach(b => b.style.borderColor = '');
  if (btn) btn.style.borderColor = 'var(--gold)';
  loadEmployees();
}

// ─── ฟังก์ชันดึงข้อมูลใส่ Dropdown ────────────────────────────────
async function loadDropdowns() {
  try {
    // 💡 1. สั่งให้ไปดึงข้อมูล "กะ" (shifts) จากเซิร์ฟเวอร์มาด้วย
    const [depts, positions, shifts] = await Promise.all([
      fetch(`${API}/departments`).then(r => r.json()),
      fetch(`${API}/positions`).then(r => r.json()),
      fetch(`${API}/shifts`).then(r => r.json()) 
    ]);

    const dSel = document.getElementById('empDeptId');
    const pSel = document.getElementById('empPositionId');
    const sSel = document.getElementById('empShiftId'); // ช่องกะ

    // ใส่ข้อมูลลงใน Dropdown
    if (dSel) dSel.innerHTML = depts.map(d => `<option value="${d.DEPARTMENT_ID}">${d.DEPARTMENT_NAME}</option>`).join('');
    if (pSel) pSel.innerHTML = positions.map(p => `<option value="${p.POSITION_ID}">${p.POSITION_NAME}</option>`).join('');
    
    // 💡 2. เอาข้อมูลกะมาใส่ใน Dropdown ให้เลือกได้แล้ว!
    if (sSel) sSel.innerHTML = shifts.map(s => `<option value="${s.SHIFT_ID}">${s.SHIFT_NAME} (${s.START_TIME}-${s.END_TIME})</option>`).join('');

    // 💡 3. ทำให้ แผนก และ ตำแหน่ง เปลี่ยนตามกันอัตโนมัติ
    if (dSel && pSel) {
      dSel.onchange = () => {
         // ฐานข้อมูลคุณออกแบบไว้ แผนก 1 = P01, แผนก 2 = P02 
         pSel.value = 'P0' + dSel.value;
      };
    }
  } catch (err) { console.error('Dropdown error:', err); }
}

// ─── ตอนกดปุ่มเพิ่มพนักงาน ───────────────────────────────────
function openEmpModal() {
  _editingEmpId = null;
  document.getElementById('empModalTitle').innerText = 'เพิ่มพนักงานใหม่';
  
  // ล้างค่าในช่องกรอกให้ว่างเปล่า
  ['empFirstName','empLastName','empPhone','empSalary','empEmail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  
  document.getElementById('empHireDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('empStatus').value = 'Active';

  // 💡 4. รีเซ็ตให้ "ตำแหน่ง" ตรงกับ "แผนก" ค่าเริ่มต้นทันทีที่เปิดหน้าต่าง
  const dSel = document.getElementById('empDeptId');
  const pSel = document.getElementById('empPositionId');
  if (dSel && pSel) pSel.value = 'P0' + dSel.value;

  openModal('empModal');
}

// ─── ตอนกดปุ่มแก้ไขพนักงาน ───────────────────────────────────
async function editEmployee(id) {
  try {
    const e = await fetch(`${API}/employees/${id}`).then(r => r.json());
    _editingEmpId = id;
    document.getElementById('empModalTitle').innerText = 'แก้ไขข้อมูลพนักงาน';
    document.getElementById('empFirstName').value = e.FIRST_NAME || '';
    document.getElementById('empLastName').value  = e.LAST_NAME  || '';
    document.getElementById('empPhone').value     = e.PHONE      || '';
    document.getElementById('empHireDate').value  = e.HIRE_DATE  || '';
    document.getElementById('empStatus').value    = e.STATUS     || 'Active';
    document.getElementById('empDeptId').value    = e.DEPARTMENT_ID || '';
    
    // 💡 5. แปลงรหัสตำแหน่งให้กลับไปตรงกับใน Dropdown (เช่น 1 แปลงเป็น P01)
    document.getElementById('empPositionId').value = e.POSITION_ID ? 'P0' + e.POSITION_ID : '';
    
    document.getElementById('empSalary').value    = e.ACTUAL_SALARY || e.MIN_SALARY || ''; 
    openModal('empModal');
  } catch (err) {
    showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
  }
}

async function saveEmployee() {
  const fn  = document.getElementById('empFirstName').value.trim();
  const ln  = document.getElementById('empLastName').value.trim();
  const deptId = document.getElementById('empDeptId').value;
  const posId  = document.getElementById('empPositionId').value;
  const hd     = document.getElementById('empHireDate').value;
  const salary = document.getElementById('empSalary').value; // 💡 1. ดึงตัวเลขเงินเดือนมาจาก Modal

  if (!fn || !ln || !deptId || !posId || !hd) {
    showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
    return;
  }

  const body = {
    firstName:    fn,
    lastName:     ln,
    phone:        document.getElementById('empPhone').value || null,
    hireDate:     hd,
    status:       document.getElementById('empStatus').value,
    departmentId: deptId,
    positionId:   posId.replace('P',''), 
    baseSalary:   salary ? parseInt(salary) : 0 // 💡 2. แพ็คเงินเดือนใส่กล่องส่งไปให้เซิร์ฟเวอร์
  };

  try {
    const method = _editingEmpId ? 'PUT' : 'POST';
    const url    = _editingEmpId ? `${API}/employees/${_editingEmpId}` : `${API}/employees`;
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
    showToast(_editingEmpId ? 'อัปเดตข้อมูลเรียบร้อย' : 'เพิ่มพนักงานใหม่เรียบร้อย');
    closeModal('empModal');
    loadEmployees();
  } catch (err) {
    showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
  }
}

async function deleteEmployee(id) {
  if (!confirm(`ยืนยันการลบพนักงาน ID: ${id}?`)) return;
  try {
    const r = await fetch(`${API}/employees/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error();
    showToast('ลบพนักงานเรียบร้อยแล้ว');
    loadEmployees();
  } catch {
    showToast('ลบไม่สำเร็จ — อาจมี FK constraint', 'error');
  }
}

// ─── ATTENDANCE ───────────────────────────────────────────────
async function loadAttendance() {
  const q = document.getElementById('attSearch')?.value || '';
  try {
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    const data = await fetch(`${API}/attendance?${params}`).then(r => r.json());
    renderAttendanceTable(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    showToast('โหลดข้อมูลบันทึกเวลาไม่สำเร็จ', 'error');
  }
}

function renderAttendanceTable(data) {
  const tbody = document.getElementById('attTableBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="loading">ไม่พบข้อมูล</div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(a => {
    const isNight = a.IS_NIGHT === 1;
    const statusClass = a.OT_HOURS > 0 ? 'att-late' : 'att-present';
    return `<tr>
      <td style="font-size:12px">${a.WORK_DATE}</td>
      <td style="color:var(--muted);font-size:12px">${a.EMPLOYEE_ID}</td>
      <td style="font-weight:500">${a.EMP_NAME}</td>
      <td>${shiftIcon(a.SHIFT_NAME)} ${a.SHIFT_NAME || a.SHIFT_ID}${isNight ? ' <span style="color:#b464ff;font-size:10px">+30%</span>' : ''}</td>
      <td>${a.CLOCK_IN  || '-'}</td>
      <td>${a.CLOCK_OUT || '-'}</td>
      <td>${a.WORK_HOURS} ชม.</td>
      <td style="color:${a.OT_HOURS > 0 ? 'var(--warning)' : 'var(--muted)'}">${a.OT_HOURS > 0 ? a.OT_HOURS + ' ชม.' : '-'}</td>
      <td class="${statusClass}">${a.OT_HOURS > 0 ? 'OT' : 'ปกติ'}</td>
      <td><button class="action-btn" onclick="deleteAttendance('${a.ATTENDANCE_ID}')">🗑️</button></td>
    </tr>`;
  }).join('');
}

async function loadShiftDropdown() {
  try {
    const shifts = await fetch(`${API}/shifts`).then(r => r.json());
    const sel = document.getElementById('attShiftId');
    if (sel) sel.innerHTML = shifts.map(s => `<option value="${s.SHIFT_ID}">${s.SHIFT_NAME} (${s.START_TIME}–${s.END_TIME})</option>`).join('');
  } catch (err) { console.error(err); }
}

async function loadEmpDropdown() {
  try {
    const emps = await fetch(`${API}/employees`).then(r => r.json());
    const sel = document.getElementById('attEmpId');
    if (sel) sel.innerHTML = emps.filter(e => e.STATUS === 'Active')
      .map(e => `<option value="${e.EMPLOYEE_ID}">${e.EMPLOYEE_ID} — ${e.FIRST_NAME} ${e.LAST_NAME}</option>`).join('');
  } catch (err) { console.error(err); }
}

function openAttModal() {
  document.getElementById('attDate').value = new Date().toISOString().split('T')[0];
  openModal('attModal');
}

async function saveAttendance() {
  const empId   = document.getElementById('attEmpId').value;
  const shiftId = document.getElementById('attShiftId').value;
  const date    = document.getElementById('attDate').value;
  const timeIn  = document.getElementById('attTimeIn').value;
  const timeOut = document.getElementById('attTimeOut').value;
  const status  = document.getElementById('attStatus').value;

  if (!empId || !date || !timeIn || !timeOut) {
    showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
    return;
  }

  // Calculate hours
  const [h1, m1] = timeIn.split(':').map(Number);
  const [h2, m2] = timeOut.split(':').map(Number);
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  const isNightShift = shiftId.includes('3') || shiftId.includes('S03');
  if (mins < 0) mins += 24 * 60; // overnight
  const totalHours = mins / 60;
  const workHours  = Math.min(totalHours, 8);
  const otHours    = Math.max(totalHours - 8, 0);

  // SHIFT table uses S01/S02/S03 but ATTENDANCE stores 1/2/3
  const shiftIdForDB = shiftId.replace('S', '').replace(/^0+/, '') || shiftId;

  try {
    const r = await fetch(`${API}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empId, shiftId: shiftIdForDB, workDate: date,
        clockIn: timeIn, clockOut: timeOut,
        workHours: Math.round(workHours),
        otHours:   Math.round(otHours),
        isNight:   isNightShift ? 1 : 0
      })
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
    showToast('บันทึกเวลาเรียบร้อยแล้ว');
    closeModal('attModal');
    loadAttendance();
  } catch (err) {
    showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
  }
}

async function deleteAttendance(id) {
  if (!confirm('ยืนยันการลบรายการนี้?')) return;
  try {
    await fetch(`${API}/attendance/${id}`, { method: 'DELETE' });
    showToast('ลบรายการเรียบร้อย');
    loadAttendance();
  } catch {
    showToast('ลบไม่สำเร็จ', 'error');
  }
}

// ─── SALARY ──────────────────────────────────────────────────
async function loadSalary() {
  const month = document.getElementById('salaryMonth').value;
  try {
    const data = await fetch(`${API}/salary?month=${month}&year=2023`).then(r => r.json());
    const tbody = document.getElementById('salaryTableBody');
    if (!Array.isArray(data) || !data.length) {
      tbody.innerHTML = `<tr><td colspan="10"><div class="loading">ไม่พบข้อมูลเงินเดือนเดือนนี้</div></td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(s => `
      <tr>
        <td style="color:var(--muted);font-size:12px">${s.EMPLOYEE_ID}</td>
        <td style="font-weight:500">${s.EMP_NAME}</td>
        <td>${deptBadge(s.DEPARTMENT_NAME)}</td>
        <td>${fmt(s.BASE_SALARY)} ฿</td>
        <td style="color:${s.OT_PAY > 0 ? 'var(--warning)' : 'var(--muted)'}">${s.OT_PAY > 0 ? fmt(s.OT_PAY) + ' ฿' : '-'}</td>
        <td style="color:${s.NIGHT_PAY > 0 ? '#b464ff' : 'var(--muted)'}">${s.NIGHT_PAY > 0 ? fmt(s.NIGHT_PAY) + ' ฿' : '-'}</td>
        <td style="color:${s.SERVICE_CHARGE > 0 ? 'var(--success)' : 'var(--muted)'}">${s.SERVICE_CHARGE > 0 ? fmt(s.SERVICE_CHARGE) + ' ฿' : '-'}</td>
        <td style="color:var(--danger)">${fmt(s.DEDUCTION)} ฿</td>
        <td style="color:var(--gold);font-weight:600">${fmt(s.NET_SALARY)} ฿</td>
        <td><button class="btn btn-outline" style="padding:4px 10px;font-size:11px" onclick="showSalaryDetail('${s.SALARY_ID}')">📄 สลิป</button></td>
      </tr>`).join('');
    showToast(`โหลดข้อมูลเงินเดือนสำเร็จ — ${data.length} รายการ`);
  } catch (err) {
    console.error(err);
    showToast('โหลดข้อมูลเงินเดือนไม่สำเร็จ', 'error');
  }
}

async function showSalaryDetail(salaryId) {
  try {
    const d = await fetch(`${API}/salary/${salaryId}/detail`).then(r => r.json());
    const s = d.salary;
    document.getElementById('salDetailBody').innerHTML = `
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-family:'Playfair Display',serif;font-size:16px;color:var(--gold2)">Grand Palace Hotel</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">${s.EMP_NAME} (${s.EMPLOYEE_ID})</div>
        <div style="font-size:12px;color:var(--muted)">${s.DEPARTMENT_NAME} | ${s.POSITION_NAME || '-'}</div>
        <div style="font-size:12px;color:var(--muted)">เดือน ${s.SALARY_MONTH}/${s.SALARY_YEAR}</div>
      </div>
      <div class="salary-breakdown">
        <div class="salary-row"><span>เงินเดือนพื้นฐาน</span><span class="plus">${fmt(s.BASE_SALARY)} ฿</span></div>
        <div class="salary-row"><span>ค่าล่วงเวลา (OT)</span><span class="plus">${fmt(s.OT_PAY)} ฿</span></div>
        <div class="salary-row"><span>ค่ากะดึก (Night Pay)</span><span class="plus">${fmt(s.NIGHT_PAY)} ฿</span></div>
        <div class="salary-row"><span>ค่าบริการ (Service Charge)</span><span class="plus">${fmt(s.SERVICE_CHARGE)} ฿</span></div>
        <div class="salary-row"><span>หักรายการต่างๆ</span><span class="minus">-${fmt(s.DEDUCTION)} ฿</span></div>
        ${d.details.map(dt => `<div class="salary-row" style="padding-left:16px;font-size:11px;color:var(--muted)"><span>↳ ${dt.DETAIL_TYPE}</span><span>${fmt(dt.AMOUNT)} ฿</span></div>`).join('')}
        <div class="salary-row"><span>💰 เงินเดือนสุทธิ</span><span>${fmt(s.NET_SALARY)} ฿</span></div>
      </div>`;
    openModal('salDetailModal');
  } catch (err) {
    showToast('โหลดสลิปไม่สำเร็จ', 'error');
  }
}

// ─── DEPARTMENTS ─────────────────────────────────────────────
async function loadDepartments() {
  const ICONS = { 'Front Office':'🛎️', 'Housekeeping':'🛏️', 'F&B':'🍽️', 'Maintenance':'🔧', 'Security':'🔒' };
  try {
    const data = await fetch(`${API}/departments`).then(r => r.json());
    const container = document.getElementById('deptCards');
    if (!Array.isArray(data) || !data.length) {
      container.innerHTML = '<div class="loading">ไม่พบข้อมูลแผนก</div>';
      return;
    }
    container.innerHTML = data.map(d => `
      <div class="table-card" style="padding:24px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="font-size:32px">${ICONS[d.DEPARTMENT_NAME] || '🏨'}</div>
          <div>
            <div style="font-weight:600;font-size:16px;color:var(--cream)">${d.DEPARTMENT_NAME}</div>
            <span class="dept-badge ${DEPT_CLASS[d.DEPARTMENT_NAME] || ''}" style="margin-top:4px">${d.EMPLOYEE_COUNT} คน</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:13px">
          <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">ผู้จัดการ</span><span>${d.MANAGER_NAME || '-'}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">ที่ตั้ง</span><span>${d.LOCATION || '-'}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">โทรภายใน</span><span style="color:var(--gold)">${d.INTERNAL_PHONE || '-'}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">พนักงาน</span><span style="color:var(--success)">${d.EMPLOYEE_COUNT} คน</span></div>
        </div>
      </div>`).join('');
  } catch (err) {
    console.error(err);
    showToast('โหลดข้อมูลแผนกไม่สำเร็จ', 'error');
  }
}