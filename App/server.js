const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── วิธีเอา connection string จาก Supabase ───────────────────
// supabase.com → project → Settings → Database → Connection string → URI
// หน้าตาแบบนี้: postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
const pool = new Pool({
  // ⚠️ เปลี่ยน [YOUR-PASSWORD] เป็นรหัสผ่านของคุณ และเปลี่ยน db.xxxxxxxxxxxx... เป็น URL ของคุณ
  connectionString: 'postgresql://postgres:bigThogo_455@db.pxtwpyqkvxtkmelzrraa.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false } // จำเป็นสำหรับ Supabase
});

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// ── HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', message: 'Connected to Supabase PostgreSQL' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── STATS ────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const [emp, dept, night, att] = await Promise.all([
      query(`SELECT COUNT(*) AS total, SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) AS active FROM employee`),
      query(`SELECT COUNT(*) AS cnt FROM department`),
      query(`SELECT COUNT(*) AS cnt FROM attendance WHERE is_night = 1`),
      query(`SELECT COUNT(*) AS cnt FROM attendance`),
    ]);
    res.json({
      totalEmployees:   parseInt(emp[0].total),
      activeEmployees:  parseInt(emp[0].active),
      departments:      parseInt(dept[0].cnt),
      nightShiftRecords:parseInt(night[0].cnt),
      attendanceRecords:parseInt(att[0].cnt),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DEPARTMENTS ───────────────────────────────────────────────
app.get('/api/departments', async (req, res) => {
  try {
    const rows = await query(`
      SELECT d.department_id, d.department_name, d.location, d.internal_phone,
             e.first_name || ' ' || e.last_name AS manager_name,
             COUNT(emp.employee_id) AS employee_count
      FROM department d
      LEFT JOIN employee e   ON d.manager_id    = e.employee_id
      LEFT JOIN employee emp ON emp.department_id = d.department_id
      GROUP BY d.department_id, d.department_name, d.location, d.internal_phone,
               e.first_name, e.last_name
      ORDER BY d.department_id
    `);
    res.json(rows.map(r => ({
      DEPARTMENT_ID:   r.department_id,
      DEPARTMENT_NAME: r.department_name,
      LOCATION:        r.location,
      INTERNAL_PHONE:  r.internal_phone,
      MANAGER_NAME:    r.manager_name,
      EMPLOYEE_COUNT:  r.employee_count,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POSITIONS ────────────────────────────────────────────────
app.get('/api/positions', async (req, res) => {
  try {
    // ⚠️ แก้ไขเพิ่มเครื่องหมายคำพูดรอบ "position" เรียบร้อยแล้ว
    const rows = await query(`SELECT * FROM "position" ORDER BY position_id`);
    res.json(rows.map(r => ({
    POSITION_ID:    r.position_id,
    POSITION_NAME:  r.position_name,
    DEPARTMENT_ID:  r.department_id,   // ✅ เพิ่มบรรทัดนี้
    MIN_SALARY:     r.min_salary,
    MAX_SALARY:     r.max_salary,
    SHIFT_TYPE:     r.shift_type,
  })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SHIFTS ───────────────────────────────────────────────────
app.get('/api/shifts', async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM shift ORDER BY shift_id`);
    res.json(rows.map(r => ({
      SHIFT_ID:   r.shift_id,
      SHIFT_NAME: r.shift_name,
      START_TIME: r.start_time,
      END_TIME:   r.end_time,
      IS_NIGHT:   r.is_night,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── EMPLOYEES ────────────────────────────────────────────────
app.get('/api/employees', async (req, res) => {
  try {
    const { search, dept } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (UPPER(e.first_name) LIKE UPPER($${params.length}) OR UPPER(e.last_name) LIKE UPPER($${params.length}) OR CAST(e.employee_id AS TEXT) LIKE $${params.length})`;
    }
    if (dept && dept !== 'ALL') {
      params.push(dept);
      where += ` AND d.department_name = $${params.length}`;
    }
    // ⚠️ แก้ไขเพิ่มเครื่องหมายคำพูดรอบ "position" เรียบร้อยแล้ว
    const rows = await query(`
      SELECT e.employee_id, e.first_name, e.last_name, e.gender, e.phone, e.email,
             TO_CHAR(e.hire_date, 'YYYY-MM-DD') AS hire_date, e.status,
             e.department_id, e.position_id,
             d.department_name,
             p.position_name, p.min_salary, p.max_salary, p.shift_type
      FROM employee e
      LEFT JOIN department d ON e.department_id = d.department_id
      LEFT JOIN "position" p ON e.position_id   = p.position_id
      ${where}
      ORDER BY e.employee_id
    `, params);
    res.json(rows.map(r => ({
      EMPLOYEE_ID:     r.employee_id,
      FIRST_NAME:      r.first_name,
      LAST_NAME:       r.last_name,
      GENDER:          r.gender,
      PHONE:           r.phone,
      EMAIL:           r.email,
      HIRE_DATE:       r.hire_date,
      STATUS:          r.status,
      DEPARTMENT_ID:   r.department_id,
      POSITION_ID:     r.position_id,
      DEPARTMENT_NAME: r.department_name,
      POSITION_NAME:   r.position_name,
      MIN_SALARY:      r.min_salary,
      MAX_SALARY:      r.max_salary,
      SHIFT_TYPE:      r.shift_type,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/employees/:id', async (req, res) => {
  try {
    // ⚠️ แก้ไขเพิ่มเครื่องหมายคำพูดรอบ "position" เรียบร้อยแล้ว
    const rows = await query(`
      SELECT e.*, d.department_name, p.position_name, p.min_salary, p.max_salary
      FROM employee e
      LEFT JOIN department d ON e.department_id = d.department_id
      LEFT JOIN "position" p ON e.position_id   = p.position_id
      WHERE e.employee_id = $1
    `, [parseInt(req.params.id)]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const r = rows[0];
    res.json({
      EMPLOYEE_ID: r.employee_id, FIRST_NAME: r.first_name, LAST_NAME: r.last_name,
      PHONE: r.phone, EMAIL: r.email, STATUS: r.status,
      HIRE_DATE: r.hire_date ? r.hire_date.toISOString().split('T')[0] : null,
      DEPARTMENT_ID: r.department_id, POSITION_ID: r.position_id,
      DEPARTMENT_NAME: r.department_name, POSITION_NAME: r.position_name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { firstName, lastName, birthDate, gender, phone, email, hireDate, status, departmentId, positionId } = req.body;
    const idRows = await query(`SELECT COALESCE(MAX(employee_id), 100) + 1 AS next_id FROM employee`);
    const newId = idRows[0].next_id;
    await query(`
      INSERT INTO employee (employee_id, first_name, last_name, birth_date, gender, phone, email, hire_date, status, department_id, position_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `, [newId, firstName, lastName, birthDate||null, gender||'Male', phone||null, email||null, hireDate, status||'Active', parseInt(departmentId), positionId]);
    res.status(201).json({ message: 'Employee added', id: newId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { firstName, lastName, phone, email, status, departmentId, positionId } = req.body;
    await query(`
      UPDATE employee SET first_name=$1, last_name=$2, phone=$3, email=$4, status=$5, department_id=$6, position_id=$7
      WHERE employee_id=$8
    `, [firstName, lastName, phone||null, email||null, status, parseInt(departmentId), positionId, parseInt(req.params.id)]);
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await query(`DELETE FROM employee WHERE employee_id=$1`, [parseInt(req.params.id)]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ATTENDANCE ───────────────────────────────────────────────
app.get('/api/attendance', async (req, res) => {
  try {
    const { search } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (UPPER(e.first_name) LIKE UPPER($1) OR UPPER(e.last_name) LIKE UPPER($1))`;
    }
    const rows = await query(`
      SELECT a.attendance_id, a.employee_id, a.shift_id,
             e.first_name || ' ' || e.last_name AS emp_name,
             d.department_name, s.shift_name, s.is_night AS shift_is_night,
             TO_CHAR(a.work_date, 'YYYY-MM-DD') AS work_date,
             TO_CHAR(a.clock_in,  'HH24:MI') AS clock_in,
             TO_CHAR(a.clock_out, 'HH24:MI') AS clock_out,
             a.work_hours, a.ot_hours, a.is_night
      FROM attendance a
      JOIN employee   e ON a.employee_id = e.employee_id
      JOIN department d ON e.department_id = d.department_id
      LEFT JOIN shift s ON a.shift_id = s.shift_id
      ${where}
      ORDER BY a.work_date DESC, a.attendance_id DESC
    `, params);
    res.json(rows.map(r => ({
      ATTENDANCE_ID: r.attendance_id, EMPLOYEE_ID: r.employee_id, SHIFT_ID: r.shift_id,
      EMP_NAME: r.emp_name, DEPARTMENT_NAME: r.department_name,
      SHIFT_NAME: r.shift_name, WORK_DATE: r.work_date,
      CLOCK_IN: r.clock_in, CLOCK_OUT: r.clock_out,
      WORK_HOURS: r.work_hours, OT_HOURS: r.ot_hours, IS_NIGHT: r.is_night,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const { empId, shiftId, workDate, clockIn, clockOut, workHours, otHours, isNight } = req.body;
    const idRows = await query(`SELECT 'AD' || LPAD(CAST(COALESCE(MAX(CAST(SUBSTRING(attendance_id FROM 3) AS INTEGER)),0)+1 AS TEXT),2,'0') AS next_id FROM attendance WHERE attendance_id ~ '^AD[0-9]+'`);
    const newId = idRows[0].next_id;
    await query(`
      INSERT INTO attendance (attendance_id, employee_id, shift_id, work_date, clock_in, clock_out, work_hours, ot_hours, is_night)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [newId, parseInt(empId), shiftId, workDate,
        `${workDate} ${clockIn}`, `${workDate} ${clockOut}`,
        workHours||8, otHours||0, isNight||0]);
    res.status(201).json({ message: 'Recorded', id: newId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/attendance/:id', async (req, res) => {
  try {
    await query(`DELETE FROM attendance WHERE attendance_id=$1`, [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SALARY ───────────────────────────────────────────────────
app.get('/api/salary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (month) { params.push(parseInt(month)); where += ` AND s.salary_month=$${params.length}`; }
    if (year)  { params.push(parseInt(year));  where += ` AND s.salary_year=$${params.length}`; }
    
    // เปลี่ยนมาใช้ LEFT JOIN ป้องกันข้อมูลหายถ้าพนักงานไม่มีแผนก
    const rows = await query(`
      SELECT s.salary_id, s.employee_id, s.salary_month, s.salary_year,
             s.base_salary, s.ot_pay, s.night_pay, s.service_charge,
             s.deduction, s.net_salary,
             TO_CHAR(s.payment_date,'YYYY-MM-DD') AS payment_date,
             e.first_name || ' ' || e.last_name AS emp_name,
             d.department_name
      FROM salary s
      LEFT JOIN employee   e ON s.employee_id   = e.employee_id
      LEFT JOIN department d ON e.department_id = d.department_id
      ${where}
      ORDER BY s.salary_year DESC, s.salary_month DESC, s.employee_id
    `, params);
    
    res.json(rows.map(r => ({
      SALARY_ID: r.salary_id, EMPLOYEE_ID: r.employee_id,
      SALARY_MONTH: r.salary_month, SALARY_YEAR: r.salary_year,
      BASE_SALARY: r.base_salary, OT_PAY: r.ot_pay, NIGHT_PAY: r.night_pay,
      SERVICE_CHARGE: r.service_charge, DEDUCTION: r.deduction, NET_SALARY: r.net_salary,
      PAYMENT_DATE: r.payment_date, EMP_NAME: r.emp_name, DEPARTMENT_NAME: r.department_name,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/salary/:salaryId/detail', async (req, res) => {
  try {
    const [salRows, detRows] = await Promise.all([
      // เปลี่ยนมาใช้ LEFT JOIN เช่นกัน
      query(`
        SELECT s.*, e.first_name || ' ' || e.last_name AS emp_name,
               e.employee_id, d.department_name, p.position_name
        FROM salary s
        LEFT JOIN employee   e ON s.employee_id   = e.employee_id
        LEFT JOIN department d ON e.department_id = d.department_id
        LEFT JOIN "position" p ON e.position_id   = p.position_id
        WHERE s.salary_id=$1
      `, [req.params.salaryId]),
      query(`SELECT * FROM salarydetail WHERE salary_id=$1 ORDER BY detail_id`, [req.params.salaryId])
    ]);
    
    if (!salRows.length) return res.status(404).json({ error: 'Not found' });
    const s = salRows[0];
    
    res.json({
      salary: {
        SALARY_ID: s.salary_id, EMPLOYEE_ID: s.employee_id, EMP_NAME: s.emp_name,
        DEPARTMENT_NAME: s.department_name, POSITION_NAME: s.position_name,
        SALARY_MONTH: s.salary_month, SALARY_YEAR: s.salary_year,
        BASE_SALARY: s.base_salary, OT_PAY: s.ot_pay, NIGHT_PAY: s.night_pay,
        SERVICE_CHARGE: s.service_charge, DEDUCTION: s.deduction, NET_SALARY: s.net_salary,
      },
      details: detRows.map(d => ({
        DETAIL_ID: d.detail_id, DETAIL_TYPE: d.detail_type, AMOUNT: d.amount
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── START ────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`   App:    http://localhost:${PORT}/index-oracle.html`);
});