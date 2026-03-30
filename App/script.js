// ตั้งค่าการเชื่อมต่อ Supabase
const SUPABASE_URL = 'https://pxtwpyqkvxtkmelzrraa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dHdweXFrdnh0a21lbHpycmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTIwMDYsImV4cCI6MjA5MDQyODAwNn0.d_A_nh7Olk-GhEoJ3EqisZPCGTB35jR_ZD79hYtdvtQ';

// 🚀 ฟังก์ชันตัวกลางสำหรับเรียก API ของ Supabase
async function fetchSupabase(endpoint, options = {}) {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
  
  // ให้คืนค่า Data กลับมาด้วยเวลาที่มีการ Insert (POST) หรือ Update (PATCH)
  if (options.method === 'POST' || options.method === 'PATCH') {
    headers['Prefer'] = 'return=representation';
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.details || 'เกิดข้อผิดพลาดจากฐานข้อมูล');
  }
  return response;
}

document.addEventListener('DOMContentLoaded', () => {
  navigate('dashboard');
  checkApiStatus();
});

async function checkApiStatus() {
  try {
    // Supabase ไม่มี /health ตรงๆ เลยใช้วิธีดึงข้อมูลตาราง departments มา 1 แถวเพื่อเช็คการเชื่อมต่อ
    await fetchSupabase('departments?select=DEPARTMENT_ID&limit=1');
    document.getElementById('apiDot').style.backgroundColor = '#4caf82';
    document.getElementById('apiStatus').innerText = 'Connected to Supabase';
  } catch {
    document.getElementById('apiDot').style.backgroundColor = '#e05c5c';
    document.getElementById('apiStatus').innerText = 'Connection Failed';
  }
}

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
  if (pageId === 'departments') loadDepartments();
}

function fmt(n) { return Number(n || 0).toLocaleString('th-TH'); }

function shiftLabel(name) {
  if (!name) return '-';
  const n = name.toLowerCase();
  if (n.includes('morning') || n.includes('day'))       return '🌅 กะเช้า';
  if (n.includes('evening') || n.includes('afternoon')) return '☀️ กะเย็น';
  if (n.includes('night'))                              return '🌙 กะมืด';
  return '🔄 ' + name;
}
function shiftIcon(name) {
  if (!name) return '🔄';
  const n = name.toLowerCase();
  if (n.includes('morning') || n.includes('day'))       return '🌅';
  if (n.includes('evening') || n.includes('afternoon')) return '☀️';
  if (n.includes('night'))                              return '🌙';
  return '🔄';
}

const DEPT_CLASS = { 'Front Office':'dept-fo','Housekeeping':'dept-hk','F&B':'dept-fb','Maintenance':'dept-mt','Security':'dept-sc' };
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
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

// ─── DASHBOARD ───────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [statsData, employees] = await Promise.all([
      // ⚠️ หมายเหตุ: ถ้าไม่มี View ชื่อ 'stats' จะ Error แนะนำให้สร้าง View รวมสถิติใน Supabase ไว้ครับ
      fetchSupabase('stats?select=*').then(r => r.json()).catch(() => ([{}])),
      fetchSupabase('employees?select=*&limit=5').then(r => r.json()),
    ]);
    const stats = statsData[0] || { totalEmployees: 0, departments: 0, nightShiftRecords: 0, attendanceRecords: 0 };
    
    document.getElementById('dashStats').innerHTML = `
      <div class="stat-card"><div class="stat-label">พนักงานทั้งหมด</div><div class="stat-value">${stats.totalEmployees || 0}</div><div class="stat-sub">Active</div></div>
      <div class="stat-card"><div class="stat-label">แผนกทั้งหมด</div><div class="stat-value">${stats.departments || 0}</div><div class="stat-sub">แผนกหลัก</div></div>
      <div class="stat-card"><div class="stat-label">บันทึกกะดึก</div><div class="stat-value">${stats.nightShiftRecords || 0}</div><div class="stat-sub">+30% Premium</div></div>
      <div class="stat-card"><div class="stat-label">บันทึกเวลาทั้งหมด</div><div class="stat-value">${stats.attendanceRecords || 0}</div><div class="stat-sub">รายการ</div></div>
    `;
    const tbody = document.getElementById('dashRecentBody');
    tbody.innerHTML = (Array.isArray(employees) ? employees : []).map(e => `
      <tr>
        <td style="color:var(--muted);font-size:12px">${e.EMPLOYEE_ID}</td>
        <td style="font-weight:500;color:var(--cream)">${e.FIRST_NAME} ${e.LAST_NAME}</td>
        <td>${deptBadge(e.DEPARTMENT_NAME)}</td>
        <td style="font-size:12px">${e.POSITION_NAME || '-'}</td>
        <td style="font-size:12px">${shiftLabel(e.SHIFT_TYPE)}</td>
        <td class="${e.STATUS === 'Active' ? 'status-active' : 'status-inactive'}">${e.STATUS || '-'}</td>
      </tr>`).join('');
  } catch (err) {
    showToast('โหลด Dashboard ไม่สำเร็จ', 'error');
  }
}

// ─── EMPLOYEES ───────────────────────────────────────────────
let _empData      = [];
let _empFilter    = 'ALL';
let _editingEmpId = null;
let _allDepts     = [];
let _allPositions = [];

async function loadEmployees() {
  const q = document.getElementById('empSearch')?.value || '';
  try {
    let endpoint = 'employees?select=*';
    if (q) endpoint += `&FIRST_NAME=ilike.*${q}*`; // ค้นหาชื่อที่มีคำนั้นๆ (Supabase format)
    if (_empFilter !== 'ALL') endpoint += `&DEPARTMENT_ID=eq.${_empFilter}`;

    const data = await fetchSupabase(endpoint).then(r => r.json());
    _empData = Array.isArray(data) ? data : [];
    renderEmployeeTable(_empData);
  } catch (err) {
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
      <td style="font-size:12px">${shiftLabel(e.SHIFT_TYPE)}</td>
      <td style="color:var(--gold);font-size:12px">${fmt(e.ACTUAL_SALARY || e.MIN_SALARY)} ฿</td>
      <td class="${e.STATUS === 'Active' ? 'status-active' : 'status-inactive'}">${e.STATUS}</td>
      <td>
        <button class="action-btn" onclick="editEmployee('${e.EMPLOYEE_ID}')" title="แก้ไข">✏️</button>
        <button class="action-btn" onclick="deleteEmployee('${e.EMPLOYEE_ID}')" title="ลบ">🗑️</button>
      </td>
    </tr>`).join('');
}

function filterEmp(dept, btn) {
  _empFilter = dept;
  document.querySelectorAll('#page-employees .btn').forEach(b => b.style.borderColor = '');
  if (btn) btn.style.borderColor = 'var(--gold)';
  loadEmployees();
}

async function loadDropdowns() {
  try {
    const [depts, positions, shifts] = await Promise.all([
      fetchSupabase('departments?select=*').then(r => r.json()),
      fetchSupabase('positions?select=*').then(r => r.json()),
      fetchSupabase('shifts?select=*').then(r => r.json()),
    ]);
    _allDepts     = depts;
    _allPositions = positions;

    const dSel = document.getElementById('empDeptId');
    if (dSel) {
      dSel.innerHTML = depts.map(d =>
        `<option value="${d.DEPARTMENT_ID}">${d.DEPARTMENT_NAME}</option>`
      ).join('');
      dSel.onchange = () => updatePositionsByDept();
    }

    const pSel = document.getElementById('empPositionId');
    if (pSel) pSel.onchange = () => updateShiftAndSalaryInfo();

    const sSel = document.getElementById('empShiftId');
    if (sSel) {
      sSel.innerHTML = shifts.map(s => {
        const label = s.SHIFT_NAME?.toLowerCase().includes('morning') ? 'กะเช้า'
                    : s.SHIFT_NAME?.toLowerCase().includes('afternoon') || s.SHIFT_NAME?.toLowerCase().includes('evening') ? 'กะเย็น'
                    : s.SHIFT_NAME?.toLowerCase().includes('night') ? 'กะมืด'
                    : s.SHIFT_NAME;
        return `<option value="${s.SHIFT_ID}">${shiftIcon(s.SHIFT_NAME)} ${label} (${s.START_TIME}–${s.END_TIME})</option>`;
      }).join('');
    }

    updatePositionsByDept();
  } catch (err) {
    console.error('Dropdown error:', err);
  }
}

function updatePositionsByDept() {
  const dSel = document.getElementById('empDeptId');
  const pSel = document.getElementById('empPositionId');
  if (!dSel || !pSel) return;

  const deptId = dSel.value;
  const posId  = 'P0' + deptId;
  const matched = _allPositions.filter(p => p.POSITION_ID === posId);

  pSel.innerHTML = (matched.length ? matched : _allPositions)
    .map(p => `<option value="${p.POSITION_ID}">${p.POSITION_NAME}</option>`)
    .join('');

  updateShiftAndSalaryInfo();
}

function updateShiftAndSalaryInfo() {
  const pSel      = document.getElementById('empPositionId');
  const shiftInfo = document.getElementById('empShiftInfo');
  const salRange  = document.getElementById('empSalaryRange');
  if (!pSel) return;

  const pos = _allPositions.find(p => p.POSITION_ID === pSel.value);
  if (!pos) return;

  if (shiftInfo) shiftInfo.innerText = shiftLabel(pos.SHIFT_TYPE);
  if (salRange)  salRange.innerText  = `ช่วงเงินเดือน: ${fmt(pos.MIN_SALARY)} – ${fmt(pos.MAX_SALARY)} ฿`;
}

function openEmpModal() {
  _editingEmpId = null;
  document.getElementById('empModalTitle').innerText = 'เพิ่มพนักงานใหม่';
  ['empFirstName','empLastName','empPhone','empEmail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('empHireDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('empStatus').value   = 'Active';
  updatePositionsByDept();
  openModal('empModal');
}

async function editEmployee(id) {
  try {
    // Supabase ค้นหาเจาะจงใช้ ?column_name=eq.value
    const data = await fetchSupabase(`employees?EMPLOYEE_ID=eq.${id}&select=*`).then(r => r.json());
    if (!data.length) throw new Error('ไม่พบข้อมูลพนักงาน');
    const e = data[0]; 

    _editingEmpId = id;
    document.getElementById('empModalTitle').innerText = 'แก้ไขข้อมูลพนักงาน';
    document.getElementById('empFirstName').value = e.FIRST_NAME || '';
    document.getElementById('empLastName').value  = e.LAST_NAME  || '';
    document.getElementById('empPhone').value     = e.PHONE      || '';
    document.getElementById('empHireDate').value  = e.HIRE_DATE  || '';
    document.getElementById('empStatus').value    = e.STATUS     || 'Active';

    const dSel = document.getElementById('empDeptId');
    if (dSel) dSel.value = e.DEPARTMENT_ID || '';
    updatePositionsByDept();
    const pSel = document.getElementById('empPositionId');
    if (pSel) pSel.value = e.POSITION_ID || '';
    updateShiftAndSalaryInfo();

    openModal('empModal');
  } catch (err) {
    showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
  }
}

async function saveEmployee() {
  const fn     = document.getElementById('empFirstName').value.trim();
  const ln     = document.getElementById('empLastName').value.trim();
  const deptId = document.getElementById('empDeptId').value;
  const posId  = document.getElementById('empPositionId').value;
  const hd     = document.getElementById('empHireDate').value;

  if (!fn || !ln || !deptId || !posId || !hd) {
    showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
    return;
  }
  if (new Date(hd) > new Date()) {
    showToast('วันที่เริ่มงานต้องไม่เป็นอนาคต', 'error');
    return;
  }

  // ⚠️ ข้อควรระวัง: Key ต้องพิมพ์ใหญ่ตรงกับชื่อ Column ใน Database เป๊ะๆ
  const body = {
    FIRST_NAME:    fn,
    LAST_NAME:     ln,
    PHONE:         document.getElementById('empPhone').value || null,
    HIRE_DATE:     hd,
    STATUS:        document.getElementById('empStatus').value,
    DEPARTMENT_ID: deptId,
    POSITION_ID:   posId,
    SHIFT_ID:      document.getElementById('empShiftId')?.value || null,
  };

  try {
    // Update ใช้ PATCH, Insert ใช้ POST
    const method   = _editingEmpId ? 'PATCH' : 'POST';
    const endpoint = _editingEmpId ? `employees?EMPLOYEE_ID=eq.${_editingEmpId}` : `employees`;
    
    await fetchSupabase(endpoint, { method, body: JSON.stringify(body) });
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
    await fetchSupabase(`employees?EMPLOYEE_ID=eq.${id}`, { method: 'DELETE' });
    showToast('ลบพนักงานเรียบร้อยแล้ว');
    loadEmployees();
  } catch {
    showToast('ลบไม่สำเร็จ — อาจมีข้อมูลเชื่อมโยงกันอยู่ (FK)', 'error');
  }
}

// ─── ATTENDANCE ───────────────────────────────────────────────
async function loadAttendance() {
  const q = document.getElementById('attSearch')?.value || '';
  try {
    let endpoint = 'attendance?select=*';
    if (q) endpoint += `&EMP_NAME=ilike.*${q}*`;

    const data = await fetchSupabase(endpoint).then(r => r.json());
    renderAttendanceTable(Array.isArray(data) ? data : []);
  } catch (err) {
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
    const isNight = a.IS_NIGHT === 1 || a.IS_NIGHT === true;
    return `<tr>
      <td style="font-size:12px">${a.WORK_DATE}</td>
      <td style="color:var(--muted);font-size:12px">${a.EMPLOYEE_ID}</td>
      <td style="font-weight:500">${a.EMP_NAME}</td>
      <td>${shiftLabel(a.SHIFT_NAME)}${isNight ? ' <span style="color:#b464ff;font-size:10px">+30%</span>' : ''}</td>
      <td>${a.CLOCK_IN  || '-'}</td>
      <td>${a.CLOCK_OUT || '-'}</td>
      <td>${a.WORK_HOURS} ชม.</td>
      <td style="color:${a.OT_HOURS > 0 ? 'var(--warning)' : 'var(--muted)'}">${a.OT_HOURS > 0 ? a.OT_HOURS + ' ชม.' : '-'}</td>
      <td class="${a.OT_HOURS > 0 ? 'att-late' : 'att-present'}">${a.OT_HOURS > 0 ? 'OT' : 'ปกติ'}</td>
      <td><button class="action-btn" onclick="deleteAttendance('${a.ATTENDANCE_ID}')">🗑️</button></td>
    </tr>`;
  }).join('');
}

async function loadShiftDropdown() {
  try {
    const shifts = await fetchSupabase('shifts?select=*').then(r => r.json());
    const sel = document.getElementById('attShiftId');
    if (sel) sel.innerHTML = shifts.map(s => {
      const label = s.SHIFT_NAME?.toLowerCase().includes('morning') ? 'กะเช้า'
                  : s.SHIFT_NAME?.toLowerCase().includes('afternoon') || s.SHIFT_NAME?.toLowerCase().includes('evening') ? 'กะเย็น'
                  : s.SHIFT_NAME?.toLowerCase().includes('night') ? 'กะมืด'
                  : s.SHIFT_NAME;
      return `<option value="${s.SHIFT_ID}">${shiftIcon(s.SHIFT_NAME)} ${label} (${s.START_TIME}–${s.END_TIME})</option>`;
    }).join('');
  } catch (err) { console.error(err); }
}

async function loadEmpDropdown() {
  try {
    const emps = await fetchSupabase('employees?select=*').then(r => r.json());
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

  if (!empId || !date || !timeIn || !timeOut) {
    showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
    return;
  }

  const [h1, m1] = timeIn.split(':').map(Number);
  const [h2, m2] = timeOut.split(':').map(Number);
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  const workHours = Math.min(mins / 60, 8);
  const otHours   = Math.max((mins / 60) - 8, 0);
  const isNight   = shiftId === 'S03' ? 1 : 0;

  try {
    const body = {
      EMPLOYEE_ID: empId, // เปลี่ยน Key ให้ตรงกับ Column ใน Database
      SHIFT_ID: shiftId,
      WORK_DATE: date,
      CLOCK_IN: timeIn,
      CLOCK_OUT: timeOut,
      WORK_HOURS: Math.round(workHours),
      OT_HOURS:   Math.round(otHours),
      IS_NIGHT:   isNight,
    };

    await fetchSupabase('attendance', {
      method: 'POST',
      body: JSON.stringify(body)
    });
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
    await fetchSupabase(`attendance?ATTENDANCE_ID=eq.${id}`, { method: 'DELETE' });
    showToast('ลบรายการเรียบร้อย');
    loadAttendance();
  } catch {
    showToast('ลบไม่สำเร็จ', 'error');
  }
}

// ─── SALARY ──────────────────────────────────────────────────
async function loadSalary() {
  const month = document.getElementById('salaryMonth').value;
  const year  = document.getElementById('salaryYear').value;
  try {
    // ค้นหาเดือนและปี
    const data = await fetchSupabase(`salary?SALARY_MONTH=eq.${month}&SALARY_YEAR=eq.${year}&select=*`).then(r => r.json());
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
        <td style="color:${s.OT_PAY > 0 ? 'var(--warning)' : 'var(--muted)'}">${s.OT_PAY > 0 ? fmt(s.OT_PAY)+' ฿' : '-'}</td>
        <td style="color:${s.NIGHT_PAY > 0 ? '#b464ff' : 'var(--muted)'}">${s.NIGHT_PAY > 0 ? fmt(s.NIGHT_PAY)+' ฿' : '-'}</td>
        <td style="color:${s.SERVICE_CHARGE > 0 ? 'var(--success)' : 'var(--muted)'}">${s.SERVICE_CHARGE > 0 ? fmt(s.SERVICE_CHARGE)+' ฿' : '-'}</td>
        <td style="color:var(--danger)">${fmt(s.DEDUCTION)} ฿</td>
        <td style="color:var(--gold);font-weight:600">${fmt(s.NET_SALARY)} ฿</td>
        <td><button class="btn btn-outline" style="padding:4px 10px;font-size:11px" onclick="showSalaryDetail('${s.SALARY_ID}')">📄 สลิป</button></td>
      </tr>`).join('');
    showToast(`โหลดข้อมูลเงินเดือนสำเร็จ — ${data.length} รายการ`);
  } catch (err) {
    showToast('โหลดข้อมูลเงินเดือนไม่สำเร็จ', 'error');
  }
}

async function showSalaryDetail(salaryId) {
  try {
    // ระบบหลังบ้านเดิมอาจจะเคยทำเส้นทาง /detail เอาไว้ แต่ถ้าต่อตรงต้องดึงจาก 2 ตาราง
    // หมายเหตุ: โค้ดนี้สมมติว่าคุณมี View หรือโครงสร้างเก็บ Detail ไว้
    const data = await fetchSupabase(`salary?SALARY_ID=eq.${salaryId}&select=*`).then(r => r.json());
    const s = data[0];
    if(!s) throw new Error();

    // ดึงรายละเอียดการหัก/เพิ่มเงิน สมมติว่ามีตาราง salary_details
    const details = await fetchSupabase(`salary_details?SALARY_ID=eq.${salaryId}&select=*`).then(r => r.json()).catch(() => []);

    document.getElementById('salDetailBody').innerHTML = `
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-family:'Playfair Display',serif;font-size:16px;color:var(--gold2)">Grand Palace Hotel</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">${s.EMP_NAME} (${s.EMPLOYEE_ID})</div>
        <div style="font-size:12px;color:var(--muted)">${s.DEPARTMENT_NAME || '-'} | ${s.POSITION_NAME || '-'}</div>
        <div style="font-size:12px;color:var(--muted)">เดือน ${s.SALARY_MONTH}/${s.SALARY_YEAR}</div>
      </div>
      <div class="salary-breakdown">
        <div class="salary-row"><span>เงินเดือนพื้นฐาน</span><span class="plus">${fmt(s.BASE_SALARY)} ฿</span></div>
        <div class="salary-row"><span>ค่าล่วงเวลา (OT)</span><span class="plus">${fmt(s.OT_PAY)} ฿</span></div>
        <div class="salary-row"><span>ค่ากะดึก (Night Pay)</span><span class="plus">${fmt(s.NIGHT_PAY)} ฿</span></div>
        <div class="salary-row"><span>ค่าบริการ (Service Charge)</span><span class="plus">${fmt(s.SERVICE_CHARGE)} ฿</span></div>
        <div class="salary-row"><span>หักรายการต่างๆ</span><span class="minus">-${fmt(s.DEDUCTION)} ฿</span></div>
        ${details.map(dt => `<div class="salary-row" style="padding-left:16px;font-size:11px;color:var(--muted)"><span>↳ ${dt.DETAIL_TYPE}</span><span>${fmt(dt.AMOUNT)} ฿</span></div>`).join('')}
        <div class="salary-row"><span>💰 เงินเดือนสุทธิ</span><span>${fmt(s.NET_SALARY)} ฿</span></div>
      </div>`;
    openModal('salDetailModal');
  } catch (err) {
    showToast('โหลดสลิปไม่สำเร็จ', 'error');
  }
}

// ─── DEPARTMENTS ─────────────────────────────────────────────
async function loadDepartments() {
  const ICONS = { 'Front Office':'🛎️','Housekeeping':'🛏️','F&B':'🍽️','Maintenance':'🔧','Security':'🔒' };
  try {
    const data = await fetchSupabase('departments?select=*').then(r => r.json());
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
            <span class="dept-badge ${DEPT_CLASS[d.DEPARTMENT_NAME] || ''}" style="margin-top:4px">${d.EMPLOYEE_COUNT || 0} คน</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:13px">
          <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">ผู้จัดการ</span><span>${d.MANAGER_NAME || '-'}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">ที่ตั้ง</span><span>${d.LOCATION || '-'}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">โทรภายใน</span><span style="color:var(--gold)">${d.INTERNAL_PHONE || '-'}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">พนักงาน</span><span style="color:var(--success)">${d.EMPLOYEE_COUNT || 0} คน</span></div>
        </div>
      </div>`).join('');
  } catch (err) {
    showToast('โหลดข้อมูลแผนกไม่สำเร็จ', 'error');
  }
}