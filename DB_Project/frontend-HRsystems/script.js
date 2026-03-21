
// ========== DATA STORE ==========
const POSITIONS = {
  'Housekeeping': ['Housekeeper','Housekeeping Supervisor'],
  'F&B': ['Chef','Waiter/Waitress','Bartender','Bellboy'],
  'Front Office': ['Receptionist','Concierge','Duty Manager'],
  'Maintenance': ['Maintenance Technician','Engineer'],
  'Security': ['Security Guard','Security Supervisor']
};
const DEPT_COLORS = {
  'Housekeeping':'dept-hk','F&B':'dept-fb','Front Office':'dept-fo',
  'Maintenance':'dept-mt','Security':'dept-sc'
};
const DEPT_ICONS = {'Housekeeping':'🛏️','F&B':'🍽️','Front Office':'🛎️','Maintenance':'🔧','Security':'🔒'};
const SALARY_RANGE = {
  'Housekeeper':[12000,18000],'Housekeeping Supervisor':[18000,25000],
  'Chef':[25000,50000],'Waiter/Waitress':[12000,18000],'Bartender':[18000,28000],'Bellboy':[12000,16000],
  'Receptionist':[18000,28000],'Concierge':[20000,30000],'Duty Manager':[30000,45000],
  'Maintenance Technician':[18000,28000],'Engineer':[28000,42000],
  'Security Guard':[13000,18000],'Security Supervisor':[18000,26000]
};
const SERVICE_CHARGE_DEPTS = ['F&B','Housekeeping','Front Office'];

let employees = [
  {id:'EMP001',firstName:'สมชาย',lastName:'ใจดี',dept:'Housekeeping',position:'Housekeeper',shift:'Morning',salary:14000,phone:'081-234-5678',hireDate:'2023-01-15',status:'Active'},
  {id:'EMP002',firstName:'สุดา',lastName:'มีสุข',dept:'F&B',position:'Waiter/Waitress',shift:'Afternoon',salary:13000,phone:'089-876-5432',hireDate:'2022-06-01',status:'Active'},
  {id:'EMP003',firstName:'ประยุทธ์',lastName:'แสงทอง',dept:'Front Office',position:'Receptionist',shift:'Night',salary:20000,phone:'090-111-2222',hireDate:'2021-11-10',status:'Active'},
  {id:'EMP004',firstName:'มาลี',lastName:'ดวงดี',dept:'F&B',position:'Chef',shift:'Morning',salary:35000,phone:'084-555-6666',hireDate:'2020-03-20',status:'Active'},
  {id:'EMP005',firstName:'วิทยา',lastName:'เจริญกิจ',dept:'Maintenance',position:'Maintenance Technician',shift:'Afternoon',salary:22000,phone:'092-333-4444',hireDate:'2023-07-01',status:'Active'},
  {id:'EMP006',firstName:'นภา',lastName:'ร่มเย็น',dept:'Security',position:'Security Guard',shift:'Night',salary:15000,phone:'095-777-8888',hireDate:'2022-09-15',status:'Active'},
  {id:'EMP007',firstName:'กิตติ',lastName:'สมบูรณ์',dept:'Housekeeping',position:'Housekeeping Supervisor',shift:'Morning',salary:22000,phone:'087-999-0000',hireDate:'2019-05-05',status:'Active'},
  {id:'EMP008',firstName:'ปิยะ',lastName:'นิ่มนวล',dept:'Front Office',position:'Concierge',shift:'Afternoon',salary:24000,phone:'083-444-5555',hireDate:'2021-08-12',status:'Inactive'},
];

let attendance = [
  {id:'ATT001',empId:'EMP001',date:'2025-01-15',shift:'Morning',timeIn:'05:55',timeOut:'14:10',status:'มาทำงาน'},
  {id:'ATT002',empId:'EMP002',date:'2025-01-15',shift:'Afternoon',timeIn:'14:05',timeOut:'22:30',status:'มาทำงาน'},
  {id:'ATT003',empId:'EMP003',date:'2025-01-15',shift:'Night',timeIn:'22:15',timeOut:'06:00',status:'สาย'},
  {id:'ATT004',empId:'EMP004',date:'2025-01-15',shift:'Morning',timeIn:'06:00',timeOut:'15:00',status:'มาทำงาน'},
  {id:'ATT005',empId:'EMP005',date:'2025-01-15',shift:'Afternoon',timeIn:'14:00',timeOut:'22:00',status:'มาทำงาน'},
  {id:'ATT006',empId:'EMP006',date:'2025-01-16',shift:'Night',timeIn:'22:00',timeOut:'06:00',status:'มาทำงาน'},
];

let empFilter = 'ALL';
let empPage = 1;
const EMP_PER_PAGE = 5;
let editingEmpId = null;

// ========== UTILS ==========
function genId(prefix, arr) {
  const nums = arr.map(x=>parseInt(x.id.replace(prefix,''))).filter(Boolean);
  const next = nums.length ? Math.max(...nums)+1 : 1;
  return prefix + String(next).padStart(3,'0');
}
function calcWorkHours(timeIn, timeOut, shift) {
  if(!timeIn || !timeOut) return {work:0,ot:0};
  const [h1,m1]=timeIn.split(':').map(Number);
  const [h2,m2]=timeOut.split(':').map(Number);
  let mins = (h2*60+m2) - (h1*60+m1);
  if(shift==='Night' && mins < 0) mins += 24*60;
  const work = Math.min(mins/60, 8);
  const ot = Math.max((mins/60)-8, 0);
  return {work:parseFloat(work.toFixed(1)), ot:parseFloat(ot.toFixed(1))};
}
function fmt(n){ return n.toLocaleString('th-TH',{minimumFractionDigits:0,maximumFractionDigits:0}); }

// ========== TOAST ==========
function showToast(msg, type='success'){
  const t = document.getElementById('toastContainer');
  const d = document.createElement('div');
  d.className = `toast ${type}`;
  d.innerHTML = `<span>${type==='success'?'✅':'❌'}</span> ${msg}`;
  t.appendChild(d);
  setTimeout(()=>d.remove(), 3000);
}

// ========== NAVIGATE ==========
function navigate(page) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  document.querySelectorAll('.nav-item')[['dashboard','employees','attendance','salary','departments'].indexOf(page)].classList.add('active');
  if(page==='dashboard') renderDashboard();
  if(page==='employees') renderEmployees();
  if(page==='attendance') renderAttendance();
  if(page==='salary') renderSalary();
  if(page==='departments') renderDepartments();
}

// ========== DASHBOARD ==========
function renderDashboard(){
  const depts = [...new Set(employees.map(e=>e.dept))];
  const active = employees.filter(e=>e.status==='Active').length;
  const nightShift = employees.filter(e=>e.shift==='Night').length;
  const stats = [
    {label:'พนักงานทั้งหมด',value:employees.length,sub:`${active} Active`},
    {label:'แผนก',value:depts.length,sub:'5 แผนกหลัก'},
    {label:'กะดึก (Night Shift)',value:nightShift,sub:'+30% Premium'},
    {label:'บันทึกเวลาวันนี้',value:attendance.length,sub:'รายการทั้งหมด'},
  ];
  document.getElementById('dashStats').innerHTML = stats.map(s=>`
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>`).join('');
  const tbody = document.querySelector('#dashRecentTable tbody');
  tbody.innerHTML = employees.slice(0,5).map(e=>`
    <tr>
      <td style="color:var(--muted);font-size:12px">${e.id}</td>
      <td class="emp-name">${e.firstName} ${e.lastName}</td>
      <td><span class="dept-badge ${DEPT_COLORS[e.dept]}">${e.dept}</span></td>
      <td style="font-size:12px">${e.position}</td>
      <td><span style="font-size:12px">${shiftIcon(e.shift)} ${e.shift}</span></td>
      <td class="${e.status==='Active'?'status-active':'status-inactive'}">${e.status}</td>
    </tr>`).join('');
}

function shiftIcon(s){ return s==='Morning'?'🌅':s==='Afternoon'?'☀️':'🌙'; }

// ========== EMPLOYEES ==========
function filterEmp(dept, btn){
  empFilter = dept; empPage = 1;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderEmployees();
}

function renderEmployees(){
  let data = employees;
  if(empFilter !== 'ALL') data = data.filter(e=>e.dept===empFilter);
  const q = document.getElementById('empSearch')?.value.toLowerCase();
  if(q) data = data.filter(e=>(e.firstName+e.lastName+e.id+e.dept+e.position).toLowerCase().includes(q));
  const total = data.length;
  const pages = Math.ceil(total/EMP_PER_PAGE);
  const sliced = data.slice((empPage-1)*EMP_PER_PAGE, empPage*EMP_PER_PAGE);
  const tbody = document.getElementById('empTableBody');
  if(!sliced.length){
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="icon">👤</div><div>ไม่พบข้อมูลพนักงาน</div></div></td></tr>`;
  } else {
    tbody.innerHTML = sliced.map(e=>`
      <tr>
        <td style="color:var(--muted);font-size:12px">${e.id}</td>
        <td class="emp-name">${e.firstName} ${e.lastName}</td>
        <td><span class="dept-badge ${DEPT_COLORS[e.dept]}">${e.dept}</span></td>
        <td style="font-size:12px">${e.position}</td>
        <td style="font-size:12px">${shiftIcon(e.shift)} ${e.shift}</td>
        <td style="color:var(--gold)">${fmt(e.salary)} ฿</td>
        <td class="${e.status==='Active'?'status-active':'status-inactive'}">${e.status}</td>
        <td>
          <button class="action-btn" title="แก้ไข" onclick="editEmployee('${e.id}')">✏️</button>
          <button class="action-btn" title="ลบ" onclick="deleteEmployee('${e.id}')">🗑️</button>
        </td>
      </tr>`).join('');
  }
  // pagination
  const pg = document.getElementById('empPagination');
  if(pages <= 1){ pg.innerHTML=''; return; }
  let html='';
  for(let i=1;i<=pages;i++) html+=`<button class="page-btn ${i===empPage?'active':''}" onclick="empPage=${i};renderEmployees()">${i}</button>`;
  pg.innerHTML = html;
}

function openEmpModal(id=null){
  editingEmpId = id;
  updatePositions();
  if(id){
    const e = employees.find(x=>x.id===id);
    document.getElementById('empModalTitle').textContent = 'แก้ไขข้อมูลพนักงาน';
    document.getElementById('empFirstName').value = e.firstName;
    document.getElementById('empLastName').value = e.lastName;
    document.getElementById('empDept').value = e.dept;
    updatePositions();
    document.getElementById('empPosition').value = e.position;
    document.getElementById('empShift').value = e.shift;
    document.getElementById('empSalary').value = e.salary;
    document.getElementById('empPhone').value = e.phone;
    document.getElementById('empHireDate').value = e.hireDate;
    document.getElementById('empStatus').value = e.status;
  } else {
    document.getElementById('empModalTitle').textContent = 'เพิ่มพนักงานใหม่';
    ['empFirstName','empLastName','empSalary','empPhone'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('empHireDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('empStatus').value = 'Active';
  }
  document.getElementById('empModal').classList.add('open');
}

function editEmployee(id){ openEmpModal(id); }

function deleteEmployee(id){
  if(!confirm('ยืนยันการลบพนักงานนี้?')) return;
  employees = employees.filter(e=>e.id!==id);
  renderEmployees();
  showToast('ลบพนักงานเรียบร้อยแล้ว');
}

function saveEmployee(){
  const fn = document.getElementById('empFirstName').value.trim();
  const ln = document.getElementById('empLastName').value.trim();
  const sal = parseFloat(document.getElementById('empSalary').value);
  if(!fn||!ln||!sal){ showToast('กรุณากรอกข้อมูลให้ครบ','error'); return; }
  const hd = document.getElementById('empHireDate').value;
  if(new Date(hd) > new Date()){ showToast('วันที่เริ่มงานต้องไม่เป็นอนาคต','error'); return; }
  const pos = document.getElementById('empPosition').value;
  const range = SALARY_RANGE[pos]||[0,999999];
  if(sal < range[0] || sal > range[1]){ showToast(`เงินเดือนต้องอยู่ในช่วง ${fmt(range[0])}–${fmt(range[1])} ฿ สำหรับตำแหน่งนี้`,'error'); return; }

  const obj = {
    id: editingEmpId || genId('EMP',employees),
    firstName:fn, lastName:ln,
    dept: document.getElementById('empDept').value,
    position: pos,
    shift: document.getElementById('empShift').value,
    salary: sal,
    phone: document.getElementById('empPhone').value,
    hireDate: hd,
    status: document.getElementById('empStatus').value
  };
  if(editingEmpId){
    const idx = employees.findIndex(e=>e.id===editingEmpId);
    employees[idx] = obj;
    showToast('อัปเดตข้อมูลพนักงานเรียบร้อย');
  } else {
    employees.push(obj);
    showToast('เพิ่มพนักงานใหม่เรียบร้อย');
  }
  closeModal('empModal');
  renderEmployees();
}

function updatePositions(){
  const dept = document.getElementById('empDept')?.value;
  const sel = document.getElementById('empPosition');
  if(!sel) return;
  sel.innerHTML = (POSITIONS[dept]||[]).map(p=>`<option value="${p}">${p}</option>`).join('');
}

// ========== ATTENDANCE ==========
function renderAttendance(){
  const q = document.getElementById('attSearch')?.value.toLowerCase();
  let data = [...attendance].reverse();
  if(q) data = data.filter(a=>{
    const e = employees.find(x=>x.id===a.empId);
    return (a.empId+(e?e.firstName+e.lastName:'')+a.shift+a.status).toLowerCase().includes(q);
  });
  const tbody = document.getElementById('attTableBody');
  if(!data.length){ tbody.innerHTML=`<tr><td colspan="10"><div class="empty-state"><div class="icon">📋</div><div>ไม่พบข้อมูล</div></div></td></tr>`; return; }
  tbody.innerHTML = data.map(a=>{
    const e = employees.find(x=>x.id===a.empId);
    const name = e ? `${e.firstName} ${e.lastName}` : a.empId;
    const {work,ot} = calcWorkHours(a.timeIn, a.timeOut, a.shift);
    const stClass = a.status==='มาทำงาน'?'att-present':a.status==='สาย'?'att-late':'att-absent';
    return `<tr>
      <td style="font-size:12px">${a.date}</td>
      <td style="color:var(--muted);font-size:12px">${a.empId}</td>
      <td class="emp-name">${name}</td>
      <td>${shiftIcon(a.shift)} ${a.shift}${a.shift==='Night'?' <span style="color:#b464ff;font-size:10px">+30%</span>':''}</td>
      <td>${a.timeIn||'-'}</td>
      <td>${a.timeOut||'-'}</td>
      <td>${work} ชม.</td>
      <td style="color:${ot?'var(--warning)':'var(--muted)'}">${ot>0?ot+' ชม.':'-'}</td>
      <td class="${stClass}">${a.status}</td>
      <td><button class="action-btn" onclick="deleteAttendance('${a.id}')">🗑️</button></td>
    </tr>`;
  }).join('');
}

function openAttModal(){
  const sel = document.getElementById('attEmpId');
  sel.innerHTML = employees.filter(e=>e.status==='Active').map(e=>`<option value="${e.id}">${e.id} — ${e.firstName} ${e.lastName}</option>`).join('');
  document.getElementById('attDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('attModal').classList.add('open');
}

function saveAttendance(){
  const empId = document.getElementById('attEmpId').value;
  const date = document.getElementById('attDate').value;
  const shift = document.getElementById('attShift').value;
  const timeIn = document.getElementById('attTimeIn').value;
  const timeOut = document.getElementById('attTimeOut').value;
  const status = document.getElementById('attStatus').value;
  if(!date||!timeIn||!timeOut){ showToast('กรุณากรอกข้อมูลให้ครบ','error'); return; }
  attendance.push({id:genId('ATT',attendance), empId, date, shift, timeIn, timeOut, status});
  closeModal('attModal');
  renderAttendance();
  showToast('บันทึกเวลาเรียบร้อยแล้ว');
}

function deleteAttendance(id){
  attendance = attendance.filter(a=>a.id!==id);
  renderAttendance();
  showToast('ลบรายการเรียบร้อย');
}

// ========== SALARY ==========
function calcSalary(emp){
  const base = emp.salary;
  const ratePerHour = base / 26 / 8;
  const empAtt = attendance.filter(a=>a.empId===emp.id);
  let totalOTHours = 0, totalNightHours = 0;
  empAtt.forEach(a=>{
    const {work,ot} = calcWorkHours(a.timeIn,a.timeOut,a.shift);
    totalOTHours += ot;
    if(a.shift==='Night') totalNightHours += work;
  });
  const otPay = totalOTHours * ratePerHour * 1.5;
  const nightPay = totalNightHours * ratePerHour * 0.3;
  const serviceCharge = SERVICE_CHARGE_DEPTS.includes(emp.dept) ? base * 0.05 : 0;
  const socialSec = Math.min(base * 0.05, 750);
  const tax = (base > 30000) ? base * 0.05 : (base > 20000 ? base * 0.02 : 0);
  const deduction = socialSec + tax;
  const net = base + otPay + nightPay + serviceCharge - deduction;
  return {base, otPay, nightPay, serviceCharge, socialSec, tax, deduction, net, totalOTHours, totalNightHours};
}

function calcAllSalary(){ renderSalary(); showToast('ประมวลผลเงินเดือนเรียบร้อยแล้ว'); }

function renderSalary(){
  const tbody = document.getElementById('salaryTableBody');
  tbody.innerHTML = employees.filter(e=>e.status==='Active').map(e=>{
    const s = calcSalary(e);
    return `<tr>
      <td style="color:var(--muted);font-size:12px">${e.id}</td>
      <td class="emp-name">${e.firstName} ${e.lastName}</td>
      <td><span class="dept-badge ${DEPT_COLORS[e.dept]}">${e.dept}</span></td>
      <td>${fmt(s.base)} ฿</td>
      <td style="color:${s.otPay?'var(--warning)':'var(--muted)'}">${s.otPay>0?fmt(s.otPay)+' ฿':'-'}</td>
      <td style="color:${s.nightPay?'#b464ff':'var(--muted)'}">${s.nightPay>0?fmt(s.nightPay)+' ฿':'-'}</td>
      <td style="color:${s.serviceCharge?'var(--success)':'var(--muted)'}">${s.serviceCharge>0?fmt(s.serviceCharge)+' ฿':'-'}</td>
      <td style="color:var(--danger)">${fmt(s.deduction)} ฿</td>
      <td style="color:var(--gold);font-weight:600">${fmt(s.net)} ฿</td>
      <td><button class="btn btn-outline" style="padding:4px 10px;font-size:11px" onclick="showSalaryDetail('${e.id}')">📄 สลิป</button></td>
    </tr>`;
  }).join('');
}

function showSalaryDetail(empId){
  const e = employees.find(x=>x.id===empId);
  const s = calcSalary(e);
  document.getElementById('salDetailBody').innerHTML = `
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-family:'Playfair Display',serif;font-size:16px;color:var(--gold2)">Grand Palace Hotel</div>
      <div style="font-size:12px;color:var(--muted);margin-top:2px">ใบสลิปเงินเดือน — ${e.firstName} ${e.lastName} (${e.id})</div>
      <div style="font-size:12px;color:var(--muted)">${e.dept} | ${e.position} | ${shiftIcon(e.shift)} ${e.shift} Shift</div>
    </div>
    <div class="salary-breakdown">
      <div class="salary-row"><span>เงินเดือนพื้นฐาน</span><span class="plus">${fmt(s.base)} ฿</span></div>
      <div class="salary-row"><span>ค่าล่วงเวลา (OT ${s.totalOTHours} ชม. × 1.5)</span><span class="plus">${fmt(s.otPay)} ฿</span></div>
      <div class="salary-row"><span>ค่ากะดึก (Night Shift ${s.totalNightHours} ชม. × 30%)</span><span class="plus">${fmt(s.nightPay)} ฿</span></div>
      <div class="salary-row"><span>ค่าบริการ (Service Charge)</span><span class="plus">${fmt(s.serviceCharge)} ฿</span></div>
      <div class="salary-row"><span>หักประกันสังคม (5%)</span><span class="minus">-${fmt(s.socialSec)} ฿</span></div>
      <div class="salary-row"><span>หักภาษีเงินได้</span><span class="minus">-${fmt(s.tax)} ฿</span></div>
      <div class="salary-row"><span>💰 เงินเดือนสุทธิ</span><span>${fmt(s.net)} ฿</span></div>
    </div>`;
  document.getElementById('salDetailModal').classList.add('open');
}

// ========== DEPARTMENTS ==========
function renderDepartments(){
  const container = document.getElementById('deptCards');
  const deptList = ['Housekeeping','F&B','Front Office','Maintenance','Security'];
  container.innerHTML = deptList.map(dept=>{
    const emps = employees.filter(e=>e.dept===dept);
    const active = emps.filter(e=>e.status==='Active').length;
    const avgSal = emps.length ? Math.round(emps.reduce((s,e)=>s+e.salary,0)/emps.length) : 0;
    return `
      <div class="table-card" style="padding:24px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="font-size:32px">${DEPT_ICONS[dept]}</div>
          <div>
            <div style="font-weight:600;font-size:16px;color:var(--cream)">${dept}</div>
            <span class="dept-badge ${DEPT_COLORS[dept]}" style="margin-top:4px">${emps.length} คน</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:13px">
          <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">Active</span><span style="color:var(--success)">${active} คน</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">เงินเดือนเฉลี่ย</span><span style="color:var(--gold)">${fmt(avgSal)} ฿</span></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">Service Charge</span><span>${SERVICE_CHARGE_DEPTS.includes(dept)?'<span style="color:var(--success)">✓ ได้รับ</span>':'<span style="color:var(--muted)">-</span>'}</span></div>
          <div style="margin-top:8px">
            <div style="font-size:11px;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">ตำแหน่งในแผนก</div>
            ${POSITIONS[dept].map(p=>`<div style="font-size:12px;padding:2px 0;color:var(--text)">• ${p}</div>`).join('')}
          </div>
        </div>
      </div>`;
  }).join('');
}

// ========== MODAL ==========
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m=>{
  m.addEventListener('click',e=>{ if(e.target===m) m.classList.remove('open'); });
});

// ========== INIT ==========
renderDashboard();
updatePositions();
document.getElementById('salaryMonth').value = '12';
