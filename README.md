# Database_Management
#Test

// ============================================================
//  Hotel HR & Employee Database System — Backend API
//  Node.js + Express + oracledb
//  Run: node server.js
// ============================================================
require('dotenv').config();
const express    = require('express');
const oracledb   = require('oracledb');
const cors       = require('cors');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Oracle connection pool ────────────────────────────────
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function initPool() {
  await oracledb.createPool({
    user:             process.env.DB_USER     || 'hotel_hr',
    password:         process.env.DB_PASSWORD || 'password',
    connectString:    process.env.DB_CONNSTR  || 'localhost:1521/XEPDB1',
    poolMin: 2, poolMax: 10, poolIncrement: 1
  });
  console.log('✅ Oracle connection pool created');
}

async function query(sql, binds = [], opts = {}) {
  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT, ...opts });
    return result;
  } finally {
    if (conn) await conn.close();
  }
}

async function execute(sql, binds = []) {
  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(sql, binds, { autoCommit: true });
    return result;
  } finally {
    if (conn) await conn.close();
  }
}

// ── Helper ────────────────────────────────────────────────
const handle = fn => async (req, res) => {
  try { await fn(req, res); }
  catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
};

// ============================================================
//  DASHBOARD
// ============================================================
app.get('/api/dashboard/stats', handle(async (_, res) => {
  const [empCount, deptCount, attToday, salaryThisMonth] = await Promise.all([
    query(`SELECT COUNT(*) AS CNT FROM EMPLOYEE WHERE STATUS='Active'`),
    query(`SELECT COUNT(*) AS CNT FROM DEPARTMENT`),
    query(`SELECT COUNT(*) AS CNT FROM ATTENDANCE WHERE WORK_DATE = TRUNC(SYSDATE)`),
    query(`SELECT NVL(SUM(CASE WHEN IS_DEDUCTION=0 THEN AMOUNT END),0)-
                  NVL(SUM(CASE WHEN IS_DEDUCTION=1 THEN AMOUNT END),0) AS TOTAL
           FROM SALARY_DETAIL sd JOIN SALARY s ON sd.SALARY_ID=s.SALARY_ID
           WHERE s.SALARY_MONTH=EXTRACT(MONTH FROM SYSDATE)
             AND s.SALARY_YEAR =EXTRACT(YEAR  FROM SYSDATE)`)
  ]);

  const byDept = await query(
    `SELECT d.DEPARTMENT_NAME, COUNT(e.EMPLOYEE_ID) AS EMP_COUNT
     FROM DEPARTMENT d LEFT JOIN EMPLOYEE e ON d.DEPARTMENT_ID=e.DEPARTMENT_ID AND e.STATUS='Active'
     GROUP BY d.DEPARTMENT_NAME ORDER BY d.DEPARTMENT_NAME`
  );

  const shiftDist = await query(
    `SELECT s.SHIFT_NAME, COUNT(a.ATTENDANCE_ID) AS CNT
     FROM SHIFT s LEFT JOIN ATTENDANCE a ON s.SHIFT_ID=a.SHIFT_ID
       AND EXTRACT(MONTH FROM a.WORK_DATE)=EXTRACT(MONTH FROM SYSDATE)
     GROUP BY s.SHIFT_NAME ORDER BY s.SHIFT_NAME`
  );

  res.json({
    totalEmployees:   empCount.rows[0].CNT,
    totalDepartments: deptCount.rows[0].CNT,
    todayAttendance:  attToday.rows[0].CNT,
    monthlyPayroll:   salaryThisMonth.rows[0]?.TOTAL ?? 0,
    byDepartment:     byDept.rows,
    shiftDistribution:shiftDist.rows
  });
}));

// ============================================================
//  EMPLOYEES
// ============================================================
app.get('/api/employees', handle(async (req, res) => {
  const { dept, status, search } = req.query;
  let sql = `SELECT e.EMPLOYEE_ID, e.FIRST_NAME, e.LAST_NAME,
                    e.GENDER, e.PHONE, e.EMAIL, e.HIRE_DATE, e.STATUS,
                    d.DEPARTMENT_NAME, p.POSITION_TITLE,
                    p.MIN_SALARY, p.MAX_SALARY
             FROM EMPLOYEE e
             JOIN DEPARTMENT   d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
             JOIN JOB_POSITION p ON e.POSITION_ID   = p.POSITION_ID
             WHERE 1=1`;
  const binds = {};
  if (dept)   { sql += ` AND d.DEPARTMENT_ID = :dept`;   binds.dept = Number(dept); }
  if (status) { sql += ` AND e.STATUS = :status`;        binds.status = status; }
  if (search) { sql += ` AND (UPPER(e.FIRST_NAME) LIKE UPPER(:s) OR UPPER(e.LAST_NAME) LIKE UPPER(:s))`; binds.s = `%${search}%`; }
  sql += ` ORDER BY e.EMPLOYEE_ID`;
  const result = await query(sql, binds);
  res.json(result.rows);
}));

app.get('/api/employees/:id', handle(async (req, res) => {
  const result = await query(
    `SELECT e.*, d.DEPARTMENT_NAME, p.POSITION_TITLE
     FROM EMPLOYEE e
     JOIN DEPARTMENT   d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
     JOIN JOB_POSITION p ON e.POSITION_ID   = p.POSITION_ID
     WHERE e.EMPLOYEE_ID = :id`,
    { id: Number(req.params.id) }
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
}));

app.post('/api/employees', handle(async (req, res) => {
  const { firstName, lastName, dateOfBirth, gender, phone, email,
          address, hireDate, status, departmentId, positionId } = req.body;
  await execute(
    `INSERT INTO EMPLOYEE (FIRST_NAME,LAST_NAME,DATE_OF_BIRTH,GENDER,PHONE,EMAIL,
                           ADDRESS,HIRE_DATE,STATUS,DEPARTMENT_ID,POSITION_ID)
     VALUES (:fn,:ln,TO_DATE(:dob,'YYYY-MM-DD'),:gender,:phone,:email,
             :addr,TO_DATE(:hire,'YYYY-MM-DD'),:status,:dept,:pos)`,
    { fn:firstName, ln:lastName, dob:dateOfBirth, gender, phone, email,
      addr:address, hire:hireDate, status:status||'Active',
      dept:Number(departmentId), pos:Number(positionId) }
  );
  res.status(201).json({ message: 'Employee created' });
}));

app.put('/api/employees/:id', handle(async (req, res) => {
  const { firstName, lastName, phone, email, address, status, departmentId, positionId } = req.body;
  await execute(
    `UPDATE EMPLOYEE SET FIRST_NAME=:fn,LAST_NAME=:ln,PHONE=:phone,EMAIL=:email,
                        ADDRESS=:addr,STATUS=:status,DEPARTMENT_ID=:dept,POSITION_ID=:pos
     WHERE EMPLOYEE_ID=:id`,
    { fn:firstName, ln:lastName, phone, email, addr:address,
      status, dept:Number(departmentId), pos:Number(positionId),
      id:Number(req.params.id) }
  );
  res.json({ message: 'Employee updated' });
}));

app.delete('/api/employees/:id', handle(async (req, res) => {
  await execute(
    `UPDATE EMPLOYEE SET STATUS='Resigned' WHERE EMPLOYEE_ID=:id`,
    { id: Number(req.params.id) }
  );
  res.json({ message: 'Employee resigned' });
}));

// ============================================================
//  DEPARTMENTS
// ============================================================
app.get('/api/departments', handle(async (_, res) => {
  const result = await query(
    `SELECT d.*, e.FIRST_NAME||' '||e.LAST_NAME AS MANAGER_NAME,
            (SELECT COUNT(*) FROM EMPLOYEE WHERE DEPARTMENT_ID=d.DEPARTMENT_ID AND STATUS='Active') AS EMP_COUNT
     FROM DEPARTMENT d LEFT JOIN EMPLOYEE e ON d.MANAGER_EMP_ID=e.EMPLOYEE_ID
     ORDER BY d.DEPARTMENT_ID`
  );
  res.json(result.rows);
}));

// ============================================================
//  POSITIONS
// ============================================================
app.get('/api/positions', handle(async (_, res) => {
  const result = await query(`SELECT * FROM JOB_POSITION ORDER BY POSITION_ID`);
  res.json(result.rows);
}));

// ============================================================
//  SHIFTS
// ============================================================
app.get('/api/shifts', handle(async (_, res) => {
  const result = await query(`SELECT * FROM SHIFT ORDER BY SHIFT_ID`);
  res.json(result.rows);
}));

// ============================================================
//  ATTENDANCE
// ============================================================
app.get('/api/attendance', handle(async (req, res) => {
  const { empId, month, year } = req.query;
  let sql = `SELECT a.*, e.FIRST_NAME||' '||e.LAST_NAME AS EMP_NAME,
                    s.SHIFT_NAME, s.IS_NIGHT_SHIFT
             FROM ATTENDANCE a
             JOIN EMPLOYEE e ON a.EMPLOYEE_ID = e.EMPLOYEE_ID
             JOIN SHIFT     s ON a.SHIFT_ID    = s.SHIFT_ID
             WHERE 1=1`;
  const binds = {};
  if (empId) { sql += ` AND a.EMPLOYEE_ID=:emp`; binds.emp = Number(empId); }
  if (month) { sql += ` AND EXTRACT(MONTH FROM a.WORK_DATE)=:month`; binds.month = Number(month); }
  if (year)  { sql += ` AND EXTRACT(YEAR  FROM a.WORK_DATE)=:year`;  binds.year  = Number(year); }
  sql += ` ORDER BY a.WORK_DATE DESC, e.EMPLOYEE_ID`;
  const result = await query(sql, binds);
  res.json(result.rows);
}));

app.post('/api/attendance', handle(async (req, res) => {
  const { workDate, timeIn, timeOut, workHours, otHours, employeeId, shiftId } = req.body;
  await execute(
    `INSERT INTO ATTENDANCE (WORK_DATE,TIME_IN,TIME_OUT,WORK_HOURS,OT_HOURS,EMPLOYEE_ID,SHIFT_ID)
     VALUES (TO_DATE(:wd,'YYYY-MM-DD'),TO_TIMESTAMP(:tin,'YYYY-MM-DD HH24:MI:SS'),
             TO_TIMESTAMP(:tout,'YYYY-MM-DD HH24:MI:SS'),:wh,:ot,:emp,:shift)`,
    { wd:workDate, tin:timeIn, tout:timeOut, wh:workHours, ot:otHours||0,
      emp:Number(employeeId), shift:Number(shiftId) }
  );
  res.status(201).json({ message: 'Attendance recorded' });
}));

// ============================================================
//  SALARY
// ============================================================
app.get('/api/salary', handle(async (req, res) => {
  const { empId, month, year } = req.query;
  let sql = `SELECT * FROM V_SALARY_SUMMARY WHERE 1=1`;
  const binds = {};
  if (empId) { sql += ` AND EMPLOYEE_ID=:emp`;  binds.emp   = Number(empId); }
  if (month) { sql += ` AND SALARY_MONTH=:month`; binds.month = Number(month); }
  if (year)  { sql += ` AND SALARY_YEAR=:year`;   binds.year  = Number(year); }
  sql += ` ORDER BY SALARY_YEAR DESC, SALARY_MONTH DESC`;
  const result = await query(sql, binds);
  res.json(result.rows);
}));

app.get('/api/salary/:salaryId/detail', handle(async (req, res) => {
  const result = await query(
    `SELECT * FROM SALARY_DETAIL WHERE SALARY_ID=:id ORDER BY IS_DEDUCTION, SALARY_TYPE`,
    { id: Number(req.params.salaryId) }
  );
  res.json(result.rows);
}));

// ============================================================
//  START
// ============================================================
initPool()
  .then(() => app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`)))
  .catch(err => { console.error('Failed to init pool:', err); process.exit(1); });
