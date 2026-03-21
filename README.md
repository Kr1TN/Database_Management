# 🏨 Hotel HR & Employee Database System

ระบบฐานข้อมูลจัดการทรัพยากรบุคคลสำหรับธุรกิจโรงแรม รองรับการทำงานเป็นกะ 24/7 และการคำนวณเงินเดือนที่ซับซ้อน

[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Database Design](https://img.shields.io/badge/Database-Design-orange.svg)](docs/ER_Diagram.pdf)

---

## 📋 สารบัญ

- [ภาพรวมโปรเจค](#ภาพรวมโปรเจค)
- [ฟีเจอร์หลัก](#ฟีเจอร์หลัก)
- [โครงสร้างฐานข้อมูล](#โครงสร้างฐานข้อมูล)
- [ความต้องการของระบบ](#ความต้องการของระบบ)
- [การติดตั้ง](#การติดตั้ง)
- [การใช้งาน](#การใช้งาน)
- [API Documentation](#api-documentation)
- [ตัวอย่างการใช้งาน](#ตัวอย่างการใช้งาน)
- [การพัฒนาต่อ](#การพัฒนาต่อ)
- [ผู้พัฒนา](#ผู้พัฒนา)
- [License](#license)

---

## 🎯 ภาพรวมโปรเจค

ระบบฐานข้อมูล HR ที่ออกแบบเฉพาะสำหรับธุรกิจโรงแรม ครอบคลุมการจัดการพนักงาน 5 แผนกหลัก การบันทึกเวลาทำงานตามกะ และการคำนวณเงินเดือนที่รวม Service Charge และ Tips

### 🏨 เหมาะสำหรับ:
- โรงแรมขนาดกลางถึงใหญ่
- รีสอร์ท
- Serviced Apartment
- ธุรกิจ Hospitality ทุกประเภท

---

## ✨ ฟีเจอร์หลัก

### 👥 การจัดการพนักงาน
- ✅ บันทึกข้อมูลพนักงานครบถ้วน
- ✅ จัดการ 5 แผนกหลัก: Housekeeping, F&B, Front Office, Maintenance, Security
- ✅ ตำแหน่งงานเฉพาะโรงแรม: Chef, Waiter, Receptionist, Housekeeper, Bellboy, etc.

### ⏰ ระบบกะการทำงาน (24/7)
- 🌅 **กะเช้า** (Morning Shift): 06:00-14:00
- 🌤️ **กะบ่าย** (Afternoon Shift): 14:00-22:00
- 🌙 **กะดึก** (Night Shift): 22:00-06:00 + ค่ากะดึก 30%

### 💰 การคำนวณเงินเดือนแบบครบถ้วน
```
เงินเดือนรวม = พื้นฐาน + OT (×1.5) + ค่ากะดึก (×1.3) + Service Charge + Tips - หัก
```

### 📊 รายงานเฉพาะธุรกิจโรงแรม
- รายงานพนักงานตามแผนก
- รายงานค่าแรงตามกะ
- รายงานค่ากะดึก (Night Shift Premium)
- Dashboard สำหรับผู้บริหาร

---

## 🗄️ โครงสร้างฐานข้อมูล

### Entity Relationship Diagram (ERD)

```
Department ──┐
             ├─→ Employee ──┬─→ Attendance
Position ────┘              └─→ Salary
```

### 5 Tables หลัก:

| Table | คำอธิบาย | Records |
|-------|----------|---------|
| **Department** | แผนกโรงแรม 5 แผนก | 5 |
| **Position** | ตำแหน่งงานเฉพาะโรงแรม | 10+ |
| **Employee** | ข้อมูลพนักงาน | ไม่จำกัด |
| **Attendance** | บันทึกเวลาทำงานตามกะ | ไม่จำกัด |
| **Salary** | เงินเดือนรายเดือน | ไม่จำกัด |

### Key Attributes เฉพาะโรงแรม:

#### Position Table
```sql
ShiftType ENUM('Morning', 'Afternoon', 'Night', 'Flexible')
```

#### Attendance Table
```sql
ShiftType ENUM('Morning', 'Afternoon', 'Night')
IsNightShift BOOLEAN  -- สำหรับคำนวณค่ากะดึก
```

#### Salary Table
```sql
NightShiftPay DECIMAL(10,2)  -- ค่ากะดึก +30%
ServiceCharge DECIMAL(10,2)  -- ค่าบริการ
Tips DECIMAL(10,2)            -- ทิปจากลูกค้า
```

---

## 💻 ความต้องการของระบบ

### Software Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| **MySQL** | 8.0+ | Database Server |
| **Python** | 3.8+ | Backend (Optional) |
| **Node.js** | 14+ | Backend (Optional) |
| **MySQL Workbench** | 8.0+ | Database Management |

### Hardware Requirements

- **RAM:** 4GB+ (แนะนำ 8GB)
- **Storage:** 500MB+ สำหรับ Database
- **OS:** Windows 10+, macOS 10.14+, Linux (Ubuntu 20.04+)

---

## 🚀 การติดตั้ง

### ขั้นตอนที่ 1: ติดตั้ง MySQL

#### Windows
```bash
# ดาวน์โหลด MySQL Installer
https://dev.mysql.com/downloads/installer/

# เลือก: Developer Default
# ตั้ง Root Password: [your_password]
```

#### macOS
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

#### Linux (Ubuntu)
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### ขั้นตอนที่ 2: สร้าง Database

```bash
# Login เข้า MySQL
mysql -u root -p

# หรือใช้ MySQL Workbench (แนะนำ)
```

```sql
-- สร้าง Database
CREATE DATABASE hotel_hr_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- เข้าใช้ Database
USE hotel_hr_db;
```

### ขั้นตอนที่ 3: นำเข้า Schema

```bash
# วิธีที่ 1: ใช้ Command Line
mysql -u root -p hotel_hr_db < schema.sql

# วิธีที่ 2: ใช้ MySQL Workbench (แนะนำ)
# 1. เปิด MySQL Workbench
# 2. File → Open SQL Script → เลือก schema.sql
# 3. Execute (⚡ icon)
```

### ขั้นตอนที่ 4: ตรวจสอบการติดตั้ง

```sql
-- แสดงตารางทั้งหมด
SHOW TABLES;

-- ควรเห็น 5 ตาราง:
-- ✓ Attendance
-- ✓ Department
-- ✓ Employee
-- ✓ Position
-- ✓ Salary

-- ตรวจสอบข้อมูลตัวอย่าง
SELECT * FROM Department;
SELECT * FROM Position;
SELECT COUNT(*) FROM Employee;
```

---

## 📖 การใช้งาน

### 1. การจัดการแผนก (Department Management)

```sql
-- ดูแผนกทั้งหมด
SELECT * FROM Department;

-- เพิ่มแผนกใหม่ (ถ้าจำเป็น)
INSERT INTO Department (DepartmentName, Location, PhoneExt)
VALUES ('Spa & Wellness', 'Floor 3', '3001');
```

### 2. การเพิ่มพนักงานใหม่

```sql
INSERT INTO Employee 
(FirstName, LastName, DateOfBirth, Gender, Phone, Email, 
 HireDate, DepartmentID, PositionID, Status)
VALUES 
('สมชาย', 'ใจดี', '1995-01-15', 'Male', '081-234-5678', 
 'somchai@hotel.com', '2024-01-01', 2, 4, 'Active');
```

### 3. บันทึกเวลาเข้า-ออกงาน

```sql
-- บันทึกเวลาเข้างาน
INSERT INTO Attendance 
(EmployeeID, Date, TimeIn, ShiftType, IsNightShift, Status)
VALUES (1, CURDATE(), '06:00:00', 'Morning', FALSE, 'Present');

-- บันทึกเวลาออกงาน
UPDATE Attendance 
SET TimeOut = '14:00:00', 
    WorkHours = 8.0,
    OTHours = 0
WHERE EmployeeID = 1 AND Date = CURDATE();
```

### 4. คำนวณเงินเดือนรายเดือน

```sql
-- ตัวอย่างการบันทึกเงินเดือน
INSERT INTO Salary 
(EmployeeID, Month, Year, BaseSalary, OTPay, NightShiftPay, 
 ServiceCharge, Tips, Deductions, NetSalary, Status)
VALUES 
(1, 1, 2024, 15000.00, 750.00, 0.00, 0.00, 0.00, 
 1500.00, 14250.00, 'Pending');
```

---

## 🔌 API Documentation

### Connection Example (Python)

```python
import mysql.connector

# เชื่อมต่อ Database
connection = mysql.connector.connect(
    host="localhost",
    user="root",
    password="your_password",
    database="hotel_hr_db"
)

cursor = connection.cursor(dictionary=True)
```

### Basic CRUD Operations

```python
# CREATE - เพิ่มพนักงาน
cursor.execute("""
    INSERT INTO Employee 
    (FirstName, LastName, Gender, Phone, Email, 
     HireDate, DepartmentID, PositionID)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
""", (fname, lname, gender, phone, email, hire_date, dept_id, pos_id))
connection.commit()

# READ - ดึงข้อมูลพนักงาน
cursor.execute("""
    SELECT e.*, d.DepartmentName, p.PositionTitle
    FROM Employee e
    JOIN Department d ON e.DepartmentID = d.DepartmentID
    JOIN Position p ON e.PositionID = p.PositionID
    WHERE e.Status = 'Active'
""")
employees = cursor.fetchall()

# UPDATE - แก้ไขข้อมูล
cursor.execute("""
    UPDATE Employee 
    SET Phone = %s 
    WHERE EmployeeID = %s
""", (new_phone, emp_id))
connection.commit()

# DELETE - ปิดสถานะ (Soft Delete)
cursor.execute("""
    UPDATE Employee 
    SET Status = 'Resigned' 
    WHERE EmployeeID = %s
""", (emp_id,))
connection.commit()
```

---

## 💡 ตัวอย่างการใช้งาน

### Query 1: รายงานพนักงานแยกตามแผนก

```sql
SELECT 
    d.DepartmentName,
    COUNT(e.EmployeeID) as EmployeeCount,
    GROUP_CONCAT(p.PositionTitle) as Positions
FROM Department d
LEFT JOIN Employee e ON d.DepartmentID = e.DepartmentID
LEFT JOIN Position p ON e.PositionID = p.PositionID
WHERE e.Status = 'Active'
GROUP BY d.DepartmentID;
```

### Query 2: รายงานการทำงานตามกะ

```sql
SELECT 
    ShiftType,
    COUNT(*) as TotalAttendance,
    SUM(CASE WHEN IsNightShift = TRUE THEN 1 ELSE 0 END) as NightShiftCount,
    AVG(WorkHours) as AvgWorkHours,
    SUM(OTHours) as TotalOTHours
FROM Attendance
WHERE Date BETWEEN '2024-01-01' AND '2024-01-31'
GROUP BY ShiftType;
```

### Query 3: รายงานเงินเดือนแยกตามแผนก

```sql
SELECT 
    d.DepartmentName,
    COUNT(DISTINCT s.EmployeeID) as EmployeeCount,
    SUM(s.BaseSalary) as TotalBaseSalary,
    SUM(s.OTPay) as TotalOTPay,
    SUM(s.NightShiftPay) as TotalNightShiftPay,
    SUM(s.ServiceCharge) as TotalServiceCharge,
    SUM(s.Tips) as TotalTips,
    SUM(s.NetSalary) as TotalNetSalary
FROM Salary s
JOIN Employee e ON s.EmployeeID = e.EmployeeID
JOIN Department d ON e.DepartmentID = d.DepartmentID
WHERE s.Year = 2024 AND s.Month = 1
GROUP BY d.DepartmentName
ORDER BY TotalNetSalary DESC;
```

### Query 4: พนักงานที่ทำงานกะดึก

```sql
SELECT 
    e.EmployeeID,
    CONCAT(e.FirstName, ' ', e.LastName) as FullName,
    p.PositionTitle,
    COUNT(a.AttendanceID) as NightShiftDays,
    SUM(a.WorkHours) as TotalNightHours
FROM Attendance a
JOIN Employee e ON a.EmployeeID = e.EmployeeID
JOIN Position p ON e.PositionID = p.PositionID
WHERE a.IsNightShift = TRUE
  AND MONTH(a.Date) = 1
  AND YEAR(a.Date) = 2024
GROUP BY e.EmployeeID
ORDER BY TotalNightHours DESC;
```

---

## 🛠️ การพัฒนาต่อ

### Roadmap

#### Phase 1: ✅ Completed
- [x] Database Schema Design
- [x] ER Diagram
- [x] Sample Data
- [x] Basic Queries
- [x] Documentation

#### Phase 2: 🚧 In Progress
- [ ] REST API (Python Flask/FastAPI)
- [ ] Web Dashboard
- [ ] Authentication & Authorization
- [ ] Automated Salary Calculation

#### Phase 3: 📋 Planned
- [ ] Leave Management System
- [ ] Performance Appraisal
- [ ] Training Management
- [ ] Mobile App (React Native)

### Contributing

ยินดีรับ Pull Requests! สำหรับการเปลี่ยนแปลงที่สำคัญ กรุณาเปิด Issue เพื่อพูดคุยก่อน

```bash
# Fork repo
# Clone your fork
git clone https://github.com/YOUR_USERNAME/hotel-hr-db.git

# Create branch
git checkout -b feature/your-feature

# Commit changes
git commit -m "Add: your feature"

# Push to branch
git push origin feature/your-feature

# Open Pull Request
```

---

## 📁 โครงสร้างโปรเจค

```
hotel-hr-database/
├── README.md                 # เอกสารหลัก
├── LICENSE                   # สัญญาอนุญาต
├── schema.sql               # SQL Schema ทั้งหมด
├── sample_data.sql          # ข้อมูลตัวอย่าง
├── docs/
│   ├── ER_Diagram.pdf       # ER Diagram
│   ├── Report.pdf           # รายงานการออกแบบ
│   ├── Presentation.pdf     # งานนำเสนอ
│   └── Use_Case_Diagram.pdf # Use Case Diagram
├── queries/
│   ├── basic_queries.sql    # Query พื้นฐาน
│   ├── reports.sql          # Query สำหรับรายงาน
│   └── analytics.sql        # Query วิเคราะห์ข้อมูล
└── api/
    ├── python/              # Python API Examples
    ├── nodejs/              # Node.js API Examples
    └── php/                 # PHP API Examples
```

---

## 🔒 Security Best Practices

### 1. Database Security
```sql
-- สร้าง User สำหรับแต่ละแอปพลิเคชัน
CREATE USER 'hotel_app'@'localhost' IDENTIFIED BY 'strong_password';

-- ให้สิทธิ์เฉพาะที่จำเป็น
GRANT SELECT, INSERT, UPDATE ON hotel_hr_db.* TO 'hotel_app'@'localhost';

-- ห้ามใช้ root ใน Production!
```

### 2. Connection Security
```python
# ใช้ Environment Variables
import os
from dotenv import load_dotenv

load_dotenv()

connection = mysql.connector.connect(
    host=os.getenv('DB_HOST'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    database=os.getenv('DB_NAME')
)
```

### 3. SQL Injection Prevention
```python
# ❌ ผิด - อันตราย!
query = f"SELECT * FROM Employee WHERE EmployeeID = {user_input}"

# ✅ ถูก - ปลอดภัย!
query = "SELECT * FROM Employee WHERE EmployeeID = %s"
cursor.execute(query, (user_input,))
```

---

## 📊 Performance Optimization

### Indexes
```sql
-- สร้าง Indexes สำหรับการค้นหาที่เร็วขึ้น
CREATE INDEX idx_emp_dept ON Employee(DepartmentID);
CREATE INDEX idx_emp_status ON Employee(Status);
CREATE INDEX idx_att_date ON Attendance(Date);
CREATE INDEX idx_sal_period ON Salary(Year, Month);
```

### Query Optimization
```sql
-- ใช้ EXPLAIN เพื่อวิเคราะห์ Query
EXPLAIN SELECT * FROM Employee WHERE Status = 'Active';

-- ใช้ JOIN แทน Subquery
-- ✅ ดี
SELECT e.*, d.DepartmentName
FROM Employee e
JOIN Department d ON e.DepartmentID = d.DepartmentID;

-- ❌ ช้า
SELECT e.*, 
    (SELECT DepartmentName FROM Department WHERE DepartmentID = e.DepartmentID)
FROM Employee e;
```

---

## 🧪 Testing

### Sample Test Data
```sql
-- เพิ่มข้อมูลทดสอบ
INSERT INTO Employee (FirstName, LastName, Gender, Phone, 
                      HireDate, DepartmentID, PositionID, Status)
VALUES ('Test', 'User', 'Male', '000-000-0000', 
        CURDATE(), 1, 1, 'Active');

-- ทดสอบ Query
SELECT COUNT(*) FROM Employee WHERE Status = 'Active';

-- ลบข้อมูลทดสอบ
DELETE FROM Employee WHERE FirstName = 'Test' AND LastName = 'User';
```

---

## 📞 ติดต่อและสนับสนุน

### ผู้พัฒนา
- **ชื่อ:** [ชื่อของคุณ]
- **Email:** [อีเมลของคุณ]
- **GitHub:** [@yourusername](https://github.com/yourusername)

### รายงานปัญหา
- 🐛 [Issues](https://github.com/yourusername/hotel-hr-db/issues)
- 💬 [Discussions](https://github.com/yourusername/hotel-hr-db/discussions)

### Documentation
- 📖 [Wiki](https://github.com/yourusername/hotel-hr-db/wiki)
- 📊 [API Docs](https://api-docs.example.com)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 🙏 Acknowledgments

- **MySQL Documentation** - Database design patterns
- **Hotel Industry Standards** - Business requirements
- **Open Source Community** - Tools and libraries

---

## 📈 Statistics

![Database](https://img.shields.io/badge/Tables-5-blue)
![Sample Data](https://img.shields.io/badge/Sample%20Employees-12-green)
![Queries](https://img.shields.io/badge/Example%20Queries-20+-orange)
![Documentation](https://img.shields.io/badge/Documentation-Complete-success)

---

## 🎓 เรียนรู้เพิ่มเติม

### Tutorials
- [MySQL Tutorial](https://www.mysqltutorial.org/)
- [Database Design](https://www.lucidchart.com/pages/database-diagram/database-design)
- [SQL Best Practices](https://www.sqlstyle.guide/)

### Related Projects
- [Hotel Management System](https://github.com/example/hotel-system)
- [Employee Management](https://github.com/example/employee-mgmt)

---

<div align="center">

**🏨 Built with ❤️ for the Hotel Industry**

[Documentation](docs/) • [Report Bug](issues/) • [Request Feature](issues/)

</div>
