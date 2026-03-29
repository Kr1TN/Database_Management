const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const DB_CONFIG = {
  user: 'SYSTEM',
  password: 'bigThogo_455',
  connectString: 'localhost:1521/xe',
};

// ── Connection Pool ──────────────────────────────────────────
async function initPool() {
  try {
    await oracledb.createPool({ ...DB_CONFIG, poolMin: 2, poolMax: 10 });
    console.log('✅ Oracle Database connected');
  } catch (err) {
    console.error('❌ Oracle connection failed:', err.message);
    process.exit(1);
  }
}

async function query(sql, binds = {}, opts = {}) {
  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...opts,
    });
    return result;
  } finally {
    if (conn) await conn.close();
  }
}

// ── HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1 FROM DUAL');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── DASHBOARD STATS ──────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const [empStats, deptCount, nightCount, attCount] = await Promise.all([
      query(`SELECT COUNT(*) AS TOTAL, SUM(CASE WHEN STATUS='Active' THEN 1 ELSE 0 END) AS ACTIVE FROM SYSTEM.EMPLOYEE`),
      query(`SELECT COUNT(*) AS CNT FROM SYSTEM.DEPARTMENT`),
      query(`SELECT COUNT(*) AS CNT FROM SYSTEM.ATTENDANCE WHERE IS_NIGHT = 1`),
      query(`SELECT COUNT(*) AS CNT FROM SYSTEM.ATTENDANCE`),
    ]);
    res.json({
      totalEmployees: empStats.rows[0].TOTAL,
      activeEmployees: empStats.rows[0].ACTIVE,
      departments: deptCount.rows[0].CNT,
      nightShiftRecords: nightCount.rows[0].CNT,
      attendanceRecords: attCount.rows[0].CNT,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DEPARTMENTS ───────────────────────────────────────────────
app.get('/api/departments', async (req, res) => {
  try {
    const result = await query(`
      SELECT d.DEPARTMENT_ID, d.DEPARTMENT_NAME, d.LOCATION, d.INTERNAL_PHONE,
             e.FIRST_NAME || ' ' || e.LAST_NAME AS MANAGER_NAME,
             COUNT(emp.EMPLOYEE_ID) AS EMPLOYEE_COUNT
      FROM SYSTEM.DEPARTMENT d
      LEFT JOIN SYSTEM.EMPLOYEE e   ON d.MANAGER_ID    = e.EMPLOYEE_ID
      LEFT JOIN SYSTEM.EMPLOYEE emp ON emp.DEPARTMENT_ID = d.DEPARTMENT_ID
      GROUP BY d.DEPARTMENT_ID, d.DEPARTMENT_NAME, d.LOCATION, d.INTERNAL_PHONE,
               e.FIRST_NAME, e.LAST_NAME
      ORDER BY d.DEPARTMENT_ID
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POSITIONS ────────────────────────────────────────────────
app.get('/api/positions', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM SYSTEM.POSITION ORDER BY POSITION_ID`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SHIFTS ───────────────────────────────────────────────────
app.get('/api/shifts', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM SYSTEM.SHIFT ORDER BY SHIFT_ID`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── EMPLOYEES ────────────────────────────────────────────────
// NOTE: EMPLOYEE.POSITION_ID is NUMBER (1-5) but POSITION.POSITION_ID is VARCHAR2 (P01-P05)
// Bridge: 'P' || LPAD(TO_CHAR(e.POSITION_ID), 2, '0')

app.get('/api/employees', async (req, res) => {
  try {
    const { search, dept } = req.query;
    const binds = {};
    let where = 'WHERE 1=1';

    if (search) {
      where += ` AND (UPPER(e.FIRST_NAME) LIKE UPPER(:search) OR UPPER(e.LAST_NAME) LIKE UPPER(:search) OR TO_CHAR(e.EMPLOYEE_ID) LIKE :search2)`;
      binds.search  = `%${search}%`;
      binds.search2 = `%${search}%`;
    }
    if (dept && dept !== 'ALL') {
      where += ` AND d.DEPARTMENT_NAME = :dept`;
      binds.dept = dept;
    }

    // 💡 อัปเกรด SQL: ดึงเงินเดือนล่าสุดจากตาราง SALARY มาประกบด้วย
    const result = await query(`
      SELECT e.EMPLOYEE_ID, e.FIRST_NAME, e.LAST_NAME,
             e.GENDER, e.PHONE, e.EMAIL,
             TO_CHAR(e.HIRE_DATE, 'YYYY-MM-DD') AS HIRE_DATE,
             e.STATUS, e.DEPARTMENT_ID, e.POSITION_ID,
             d.DEPARTMENT_NAME,
             p.POSITION_NAME, p.SHIFT_TYPE,
             NVL(s.LATEST_SALARY, p.MIN_SALARY) AS ACTUAL_SALARY
      FROM SYSTEM.EMPLOYEE e
      LEFT JOIN SYSTEM.DEPARTMENT d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
      LEFT JOIN SYSTEM.POSITION   p ON p.POSITION_ID = 'P' || LPAD(TO_CHAR(e.POSITION_ID), 2, '0')
      LEFT JOIN (
          -- ค้นหาเงินเดือนเดือนล่าสุดของพนักงานแต่ละคน
          SELECT EMPLOYEE_ID, BASE_SALARY AS LATEST_SALARY
          FROM (
              SELECT EMPLOYEE_ID, BASE_SALARY,
                     ROW_NUMBER() OVER(PARTITION BY EMPLOYEE_ID ORDER BY SALARY_YEAR DESC, SALARY_MONTH DESC) as rn
              FROM SYSTEM.SALARY
          )
          WHERE rn = 1
      ) s ON e.EMPLOYEE_ID = s.EMPLOYEE_ID
      ${where}
      ORDER BY e.EMPLOYEE_ID
    `, binds);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ดึงข้อมูลพนักงาน 1 คน (โชว์ตอนกดแก้ไข) ───────────────────────────────────
app.get('/api/employees/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, d.DEPARTMENT_NAME, p.POSITION_NAME, p.MIN_SALARY, p.MAX_SALARY,
             (SELECT MAX(BASE_SALARY) KEEP (DENSE_RANK LAST ORDER BY SALARY_YEAR, SALARY_MONTH) 
              FROM SYSTEM.SALARY WHERE EMPLOYEE_ID = e.EMPLOYEE_ID) AS ACTUAL_SALARY
      FROM SYSTEM.EMPLOYEE e
      LEFT JOIN SYSTEM.DEPARTMENT d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
      LEFT JOIN SYSTEM.POSITION   p ON p.POSITION_ID = 'P' || LPAD(TO_CHAR(e.POSITION_ID), 2, '0')
      WHERE e.EMPLOYEE_ID = :id
    `, { id: parseInt(req.params.id) });
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── เพิ่มพนักงานใหม่ (แอบสร้างประวัติเงินเดือนให้ด้วย) ────────────────────────────────
app.post('/api/employees', async (req, res) => {
  try {
    const { firstName, lastName, birthDate, gender, phone, email, hireDate, status, departmentId, positionId, baseSalary } = req.body;
    const idResult = await query(`SELECT NVL(MAX(EMPLOYEE_ID), 100) + 1 AS NEXT_ID FROM SYSTEM.EMPLOYEE`);
    const newId = idResult.rows[0].NEXT_ID;

    // 1. สร้างประวัติพนักงาน
    await query(`
      INSERT INTO SYSTEM.EMPLOYEE
        (EMPLOYEE_ID, FIRST_NAME, LAST_NAME, BIRTH_DATE, GENDER, PHONE, EMAIL, HIRE_DATE, STATUS, DEPARTMENT_ID, POSITION_ID)
      VALUES (:id, :fn, :ln, ${birthDate ? "TO_DATE(:bd, 'YYYY-MM-DD')" : 'NULL'}, :gender, :phone, :email, TO_DATE(:hd, 'YYYY-MM-DD'), :status, :deptId, :posId)
    `, {
      id: newId, fn: firstName, ln: lastName, ...(birthDate ? { bd: birthDate } : {}),
      gender: gender || 'Male', phone: phone || null, email: email || null,
      hd: hireDate, status: status || 'Active', deptId: parseInt(departmentId), posId: parseInt(positionId)
    });

    // 2. 💡 แอบสร้างประวัติเงินเดือนตั้งต้นลงในตาราง SALARY
    if (baseSalary && parseInt(baseSalary) > 0) {
        const salId = 'S' + Date.now().toString().slice(-5) + newId;
        const m = new Date().getMonth() + 1; // ดึงเดือนปัจจุบัน
        const y = new Date().getFullYear();  // ดึงปีปัจจุบัน
        await query(`
          INSERT INTO SYSTEM.SALARY (SALARY_ID, EMPLOYEE_ID, SALARY_MONTH, SALARY_YEAR, BASE_SALARY, NET_SALARY, OT_PAY, NIGHT_PAY, SERVICE_CHARGE, DEDUCTION)
          VALUES (:sid, :eid, :m, :y, :sal, :sal, 0, 0, 0, 0)
        `, { sid: salId, eid: newId, m, y, sal: parseInt(baseSalary) });
    }

    res.status(201).json({ message: 'Employee added', id: newId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── อัปเดตข้อมูลพนักงาน (อัปเดตเงินเดือนด้วย) ───────────────────────────────────
app.put('/api/employees/:id', async (req, res) => {
  try {
    const { firstName, lastName, phone, email, status, departmentId, positionId, hireDate, baseSalary } = req.body;
    const empId = parseInt(req.params.id);

    // 1. อัปเดตข้อมูลส่วนตัว
    await query(`
      UPDATE SYSTEM.EMPLOYEE
      SET FIRST_NAME = :fn, LAST_NAME = :ln, PHONE = :phone, EMAIL = :email, STATUS = :status,
          DEPARTMENT_ID = :deptId, POSITION_ID = :posId, HIRE_DATE = TO_DATE(:hd, 'YYYY-MM-DD')
      WHERE EMPLOYEE_ID = :id
    `, {
      fn: firstName, ln: lastName, phone: phone || null, email: email || null, status,
      deptId: parseInt(departmentId), posId: parseInt(positionId), hd: hireDate, id: empId
    });

    // 2. 💡 อัปเดตยอดเงินเดือนในตาราง SALARY
    if (baseSalary && parseInt(baseSalary) > 0) {
        const m = new Date().getMonth() + 1;
        const y = new Date().getFullYear();
        const check = await query(`SELECT SALARY_ID FROM SYSTEM.SALARY WHERE EMPLOYEE_ID = :eid AND SALARY_MONTH = :m AND SALARY_YEAR = :y`, {eid: empId, m, y});

        if (check.rows.length > 0) {
            // ถ้าเดือนนี้มีประวัติอยู่แล้ว อัปเดตยอดทับไปเลย
            await query(`UPDATE SYSTEM.SALARY SET BASE_SALARY = :sal WHERE EMPLOYEE_ID = :eid AND SALARY_MONTH = :m AND SALARY_YEAR = :y`, {sal: parseInt(baseSalary), eid: empId, m, y});
        } else {
            // ถ้าเพิ่งเพิ่มเงินเดือนครั้งแรก ให้สร้างประวัติใหม่
            const salId = 'S' + Date.now().toString().slice(-5) + empId;
            await query(`
              INSERT INTO SYSTEM.SALARY (SALARY_ID, EMPLOYEE_ID, SALARY_MONTH, SALARY_YEAR, BASE_SALARY, NET_SALARY, OT_PAY, NIGHT_PAY, SERVICE_CHARGE, DEDUCTION)
              VALUES (:sid, :eid, :m, :y, :sal, :sal, 0, 0, 0, 0)
            `, { sid: salId, eid: empId, m, y, sal: parseInt(baseSalary) });
        }
    }

    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await query(`DELETE FROM SYSTEM.EMPLOYEE WHERE EMPLOYEE_ID = :id`, { id: parseInt(req.params.id) });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ATTENDANCE ───────────────────────────────────────────────
// NOTE: ATTENDANCE.SHIFT_ID stores '1','2','3' but SHIFT table uses 'S01','S02','S03'
// Bridge: 'S' || LPAD(a.SHIFT_ID, 2, '0') for the JOIN

app.get('/api/attendance', async (req, res) => {
  try {
    const { search } = req.query;
    const binds = {};
    let where = 'WHERE 1=1';
    if (search) {
      where += ` AND (UPPER(e.FIRST_NAME) LIKE UPPER(:search) OR UPPER(e.LAST_NAME) LIKE UPPER(:search))`;
      binds.search = `%${search}%`;
    }
    const result = await query(`
      SELECT a.ATTENDANCE_ID, a.EMPLOYEE_ID, a.SHIFT_ID,
             e.FIRST_NAME || ' ' || e.LAST_NAME AS EMP_NAME,
             d.DEPARTMENT_NAME,
             s.SHIFT_NAME, s.IS_NIGHT AS SHIFT_IS_NIGHT,
             TO_CHAR(a.WORK_DATE, 'YYYY-MM-DD')  AS WORK_DATE,
             TO_CHAR(a.CLOCK_IN,  'HH24:MI')      AS CLOCK_IN,
             TO_CHAR(a.CLOCK_OUT, 'HH24:MI')      AS CLOCK_OUT,
             a.WORK_HOURS, a.OT_HOURS, a.IS_NIGHT
      FROM SYSTEM.ATTENDANCE a
      JOIN  SYSTEM.EMPLOYEE   e ON a.EMPLOYEE_ID = e.EMPLOYEE_ID
      JOIN  SYSTEM.DEPARTMENT d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
      LEFT JOIN SYSTEM.SHIFT  s ON s.SHIFT_ID = 'S' || LPAD(a.SHIFT_ID, 2, '0')
      ${where}
      ORDER BY a.WORK_DATE DESC, a.ATTENDANCE_ID DESC
    `, binds);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const { empId, shiftId, workDate, clockIn, clockOut, workHours, otHours, isNight } = req.body;
    const idResult = await query(`
      SELECT NVL(MAX(CASE WHEN REGEXP_LIKE(ATTENDANCE_ID,'^[0-9]+$') THEN TO_NUMBER(ATTENDANCE_ID) ELSE 0 END), 0) + 1 AS NEXT_ID
      FROM SYSTEM.ATTENDANCE
    `);
    const newId = String(idResult.rows[0].NEXT_ID);

    await query(`
      INSERT INTO SYSTEM.ATTENDANCE
        (ATTENDANCE_ID, EMPLOYEE_ID, SHIFT_ID, WORK_DATE, CLOCK_IN, CLOCK_OUT, WORK_HOURS, OT_HOURS, IS_NIGHT)
      VALUES (:attId, :empId, :shiftId,
        TO_DATE(:workDate, 'YYYY-MM-DD'),
        TO_TIMESTAMP(:workDate || ' ' || :clockIn,  'YYYY-MM-DD HH24:MI'),
        TO_TIMESTAMP(:workDate || ' ' || :clockOut, 'YYYY-MM-DD HH24:MI'),
        :workHours, :otHours, :isNight)
    `, {
      attId: newId, empId: parseInt(empId), shiftId,
      workDate, clockIn, clockOut,
      workHours: workHours || 8, otHours: otHours || 0, isNight: isNight || 0
    });
    res.status(201).json({ message: 'Recorded', id: newId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/attendance/:id', async (req, res) => {
  try {
    await query(`DELETE FROM SYSTEM.ATTENDANCE WHERE ATTENDANCE_ID = :id`, { id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SALARY ───────────────────────────────────────────────────
app.get('/api/salary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const binds = {};
    let where = 'WHERE 1=1';
    if (month) { where += ' AND s.SALARY_MONTH = :month'; binds.month = parseInt(month); }
    if (year)  { where += ' AND s.SALARY_YEAR  = :year';  binds.year  = parseInt(year);  }

    const result = await query(`
      SELECT s.SALARY_ID, s.EMPLOYEE_ID, s.SALARY_MONTH, s.SALARY_YEAR,
             s.BASE_SALARY, s.OT_PAY, s.NIGHT_PAY, s.SERVICE_CHARGE,
             s.DEDUCTION, s.NET_SALARY,
             TO_CHAR(s.PAYMENT_DATE, 'YYYY-MM-DD') AS PAYMENT_DATE,
             e.FIRST_NAME || ' ' || e.LAST_NAME AS EMP_NAME,
             d.DEPARTMENT_NAME
      FROM SYSTEM.SALARY s
      JOIN SYSTEM.EMPLOYEE   e ON s.EMPLOYEE_ID   = e.EMPLOYEE_ID
      JOIN SYSTEM.DEPARTMENT d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
      ${where}
      ORDER BY s.SALARY_YEAR DESC, s.SALARY_MONTH DESC, s.EMPLOYEE_ID
    `, binds);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/salary/:salaryId/detail', async (req, res) => {
  try {
    const [salRow, detailRow] = await Promise.all([
      query(`
        SELECT s.*, e.FIRST_NAME || ' ' || e.LAST_NAME AS EMP_NAME,
               e.EMPLOYEE_ID, d.DEPARTMENT_NAME, p.POSITION_NAME
        FROM SYSTEM.SALARY s
        JOIN SYSTEM.EMPLOYEE   e ON s.EMPLOYEE_ID   = e.EMPLOYEE_ID
        JOIN SYSTEM.DEPARTMENT d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
        LEFT JOIN SYSTEM.POSITION p ON p.POSITION_ID = 'P' || LPAD(TO_CHAR(e.POSITION_ID), 2, '0')
        WHERE s.SALARY_ID = :id
      `, { id: req.params.salaryId }),
      query(`SELECT * FROM SYSTEM.SALARYDETAIL WHERE SALARY_ID = :id ORDER BY DETAIL_ID`,
        { id: req.params.salaryId })
    ]);
    if (!salRow.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ salary: salRow.rows[0], details: detailRow.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── START ────────────────────────────────────────────────────
const PORT = 3000;
initPool().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`   App:    http://localhost:${PORT}/index-oracle.html`);
  });
});