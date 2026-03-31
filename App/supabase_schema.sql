-- ============================================================
--  Hotel HR System — PostgreSQL / Supabase
--  วิธีใช้: copy ทั้งหมดนี้ไปรันใน Supabase SQL Editor
-- ============================================================

-- Drop ถ้ามีอยู่แล้ว (ลำดับสำคัญ — ลบ child ก่อน parent)
DROP TABLE IF EXISTS salarydetail;
DROP TABLE IF EXISTS salary;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS employee;
DROP TABLE IF EXISTS department;
DROP TABLE IF EXISTS position;
DROP TABLE IF EXISTS shift;

-- ============================================================
--  SHIFT
-- ============================================================
CREATE TABLE shift (
  shift_id    VARCHAR(26) PRIMARY KEY,
  shift_name  VARCHAR(20),
  start_time  VARCHAR(10),
  end_time    VARCHAR(10),
  is_night    INTEGER DEFAULT 0
);

-- ============================================================
--  DEPARTMENT
-- ============================================================
CREATE TABLE department (
  department_id   INTEGER PRIMARY KEY,
  department_name VARCHAR(100),
  manager_id      INTEGER,
  location        VARCHAR(100),
  internal_phone  INTEGER
);

-- ============================================================
--  POSITION
-- ============================================================
CREATE TABLE position (
  position_id   VARCHAR(26) PRIMARY KEY,
  position_name VARCHAR(100),
  min_salary    INTEGER,
  max_salary    INTEGER,
  shift_type    VARCHAR(20)
);

-- ============================================================
--  EMPLOYEE
-- ============================================================
CREATE TABLE employee (
  employee_id   INTEGER PRIMARY KEY,
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  birth_date    DATE,
  gender        VARCHAR(10),
  phone         VARCHAR(20),
  email         VARCHAR(100),
  hire_date     DATE,
  status        VARCHAR(20),
  department_id INTEGER REFERENCES department(department_id),
  position_id   VARCHAR(26) REFERENCES position(position_id)
);

-- ============================================================
--  ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
  attendance_id VARCHAR(26) PRIMARY KEY,
  employee_id   INTEGER REFERENCES employee(employee_id),
  shift_id      VARCHAR(26) REFERENCES shift(shift_id),
  work_date     DATE,
  clock_in      TIMESTAMP,
  clock_out     TIMESTAMP,
  work_hours    INTEGER,
  ot_hours      INTEGER,
  is_night      INTEGER DEFAULT 0
);

-- ============================================================
--  SALARY
-- ============================================================
CREATE TABLE salary (
  salary_id      VARCHAR(26) PRIMARY KEY,
  employee_id    INTEGER REFERENCES employee(employee_id),
  salary_month   INTEGER,
  salary_year    INTEGER,
  base_salary    INTEGER,
  ot_pay         INTEGER,
  night_pay      INTEGER,
  service_charge INTEGER,
  deduction      INTEGER,
  net_salary     INTEGER,
  payment_date   DATE
);

-- ============================================================
--  SALARYDETAIL
-- ============================================================
CREATE TABLE salarydetail (
  detail_id   VARCHAR(26),
  salary_id   VARCHAR(26) REFERENCES salary(salary_id),
  detail_type VARCHAR(100),
  amount      INTEGER,
  date_time   DATE,
  PRIMARY KEY (detail_id, salary_id)
);

-- ============================================================
--  DATA: SHIFT
-- ============================================================
INSERT INTO shift VALUES ('S01','Morning','6:00','14:00',0);
INSERT INTO shift VALUES ('S02','Evening','14:01','22:00',0);
INSERT INTO shift VALUES ('S03','Night','23:00','5:59',1);

-- ============================================================
--  DATA: DEPARTMENT (ต้องก่อน employee เพราะมี FK)
-- ============================================================
INSERT INTO department VALUES (1,'Front Office',101,'Main Lobby',1001);
INSERT INTO department VALUES (2,'Housekeeping',102,'Basement 1',1002);
INSERT INTO department VALUES (3,'F&B',103,'Ground Floor',1003);
INSERT INTO department VALUES (4,'Maintenance',104,'Basement 2',1004);
INSERT INTO department VALUES (5,'Security',105,'Main Entrance',1005);

-- ============================================================
--  DATA: POSITION
-- ============================================================
INSERT INTO position VALUES ('P01','Receptionist',20000,35000,'Rotating');
INSERT INTO position VALUES ('P02','Room Attendant',15000,25000,'Day');
INSERT INTO position VALUES ('P03','Waiter',16000,28000,'Rotating');
INSERT INTO position VALUES ('P04','Technician',22000,40000,'Rotating');
INSERT INTO position VALUES ('P05','Security Guard',18000,30000,'Night');

-- ============================================================
--  DATA: EMPLOYEE
-- ============================================================
INSERT INTO employee VALUES (101,'Alice','Smith','1992-05-14','Female','555-0101','alice.s@hotel.com','2020-03-01','Active',1,'P01');
INSERT INTO employee VALUES (102,'Bob','Johnson','1988-11-20','Male','555-0102','bob.j@hotel.com','2019-06-15','Active',2,'P02');
INSERT INTO employee VALUES (103,'Charlie','Davis','1995-02-10','Male','555-0103','charlie.d@hotel.com','2021-08-20','Active',3,'P03');
INSERT INTO employee VALUES (104,'Diana','Miller','1985-09-30','Female','555-0104','diana.m@hotel.com','2018-01-10','Active',4,'P04');
INSERT INTO employee VALUES (105,'Evan','Wilson','1990-12-05','Male','555-0105','evan.w@hotel.com','2022-11-01','Active',5,'P05');
INSERT INTO employee VALUES (106,'Sarah','Connor','1993-04-12','Female','555-0106','sarah.c@hotel.com','2021-02-10','Active',1,'P01');
INSERT INTO employee VALUES (107,'John','Doe','1989-08-25','Male','555-0107','john.d@hotel.com','2020-11-15','Active',1,'P01');
INSERT INTO employee VALUES (108,'Jane','Smith','1995-01-30','Female','555-0108','jane.s@hotel.com','2022-05-20','Active',1,'P01');
INSERT INTO employee VALUES (109,'Emily','Chen','1998-07-14','Female','555-0109','emily.c@hotel.com','2023-01-10','Active',1,'P01');
INSERT INTO employee VALUES (110,'Michael','Brown','1991-09-09','Male','555-0110','michael.b@hotel.com','2019-08-05','On Leave',1,'P01');
INSERT INTO employee VALUES (111,'Chris','Evans','1985-06-13','Male','555-0111','chris.e@hotel.com','2018-03-12','Active',1,'P01');
INSERT INTO employee VALUES (112,'Jessica','Alba','1992-12-01','Female','555-0112','jessica.a@hotel.com','2021-09-25','Active',1,'P01');
INSERT INTO employee VALUES (113,'David','Miller','1980-03-22','Male','555-0113','david.m@hotel.com','2017-06-30','Active',2,'P02');
INSERT INTO employee VALUES (114,'Sophia','Taylor','1988-11-05','Female','555-0114','sophia.t@hotel.com','2019-02-18','Active',2,'P02');
INSERT INTO employee VALUES (115,'James','Anderson','1994-05-17','Male','555-0115','james.a@hotel.com','2022-10-10','Active',2,'P02');
INSERT INTO employee VALUES (116,'Linda','Thomas','1975-08-29','Female','555-0116','linda.t@hotel.com','2015-04-22','Active',2,'P02');
INSERT INTO employee VALUES (117,'Robert','Jackson','1982-10-11','Male','555-0117','robert.j@hotel.com','2018-07-15','Resigned',2,'P02');
INSERT INTO employee VALUES (118,'Maria','Garcia','1997-02-28','Female','555-0118','maria.g@hotel.com','2023-03-01','Active',2,'P02');
INSERT INTO employee VALUES (119,'William','White','1990-06-19','Male','555-0119','william.w@hotel.com','2020-12-05','Active',2,'P02');
INSERT INTO employee VALUES (120,'Richard','Harris','1996-09-14','Male','555-0120','richard.h@hotel.com','2021-05-10','Active',3,'P03');
INSERT INTO employee VALUES (121,'Patricia','Martin','1999-01-22','Female','555-0121','patricia.m@hotel.com','2023-08-15','Active',3,'P03');
INSERT INTO employee VALUES (122,'Charles','Thompson','1987-12-30','Male','555-0122','charles.t@hotel.com','2019-11-20','Active',3,'P03');
INSERT INTO employee VALUES (123,'Angela','Moore','1994-04-18','Female','555-0123','angela.m@hotel.com','2020-01-25','Active',3,'P03');
INSERT INTO employee VALUES (124,'Thomas','Clark','1991-07-07','Male','555-0124','thomas.c@hotel.com','2018-09-10','Active',3,'P03');
INSERT INTO employee VALUES (125,'Nancy','Lewis','1985-03-15','Female','555-0125','nancy.l@hotel.com','2016-10-05','On Leave',3,'P03');
INSERT INTO employee VALUES (126,'Daniel','Walker','1998-11-28','Male','555-0126','daniel.w@hotel.com','2022-07-12','Active',3,'P03');
INSERT INTO employee VALUES (127,'Matthew','Hall','1983-05-09','Male','555-0127','matthew.h@hotel.com','2015-08-20','Active',4,'P04');
INSERT INTO employee VALUES (128,'Karen','Allen','1989-10-14','Female','555-0128','karen.a@hotel.com','2019-04-10','Active',4,'P04');
INSERT INTO employee VALUES (129,'Anthony','Young','1978-01-25','Male','555-0129','anthony.y@hotel.com','2014-02-15','Active',4,'P04');
INSERT INTO employee VALUES (130,'Betty','King','1992-06-30','Female','555-0130','betty.k@hotel.com','2021-11-05','Active',4,'P04');
INSERT INTO employee VALUES (131,'Mark','Wright','1986-09-18','Male','555-0131','mark.w@hotel.com','2018-05-25','Resigned',4,'P04');
INSERT INTO employee VALUES (132,'Lisa','Scott','1995-12-12','Female','555-0132','lisa.s@hotel.com','2022-03-30','Active',4,'P04');
INSERT INTO employee VALUES (133,'Paul','Green','1990-04-04','Male','555-0133','paul.g@hotel.com','2020-09-15','Active',4,'P04');
INSERT INTO employee VALUES (134,'Steven','Adams','1981-08-08','Male','555-0134','steven.a@hotel.com','2016-01-20','Active',5,'P05');
INSERT INTO employee VALUES (135,'Sandra','Baker','1987-02-16','Female','555-0135','sandra.b@hotel.com','2019-10-10','Active',5,'P05');
INSERT INTO employee VALUES (136,'Kenneth','Gonzalez','1993-05-27','Male','555-0136','kenneth.g@hotel.com','2021-06-05','Active',5,'P05');
INSERT INTO employee VALUES (137,'Donna','Nelson','1996-10-09','Female','555-0137','donna.n@hotel.com','2023-02-15','Active',5,'P05');
INSERT INTO employee VALUES (138,'Kevin','Carter','1984-11-21','Male','555-0138','kevin.c@hotel.com','2017-08-30','Active',5,'P05');
INSERT INTO employee VALUES (139,'Carol','Mitchell','1991-03-03','Female','555-0139','carol.m@hotel.com','2020-05-12','On Leave',5,'P05');
INSERT INTO employee VALUES (140,'Brian','Perez','1988-07-26','Male','555-0140','brian.p@hotel.com','2018-12-01','Active',5,'P05');

-- ============================================================
--  DATA: ATTENDANCE
-- ============================================================
INSERT INTO attendance VALUES ('AD01',101,'S01','2023-10-01','2023-10-01 06:55:00','2023-10-01 15:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD02',105,'S03','2023-10-01','2023-10-01 22:50:00','2023-10-02 07:10:00',8,0,1);
INSERT INTO attendance VALUES ('AD03',101,'S01','2023-10-02','2023-10-02 06:55:00','2023-10-02 15:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD04',102,'S01','2023-10-02','2023-10-02 06:50:00','2023-10-02 15:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD05',103,'S01','2023-10-02','2023-10-02 07:05:00','2023-10-02 16:00:00',8,1,0);
INSERT INTO attendance VALUES ('AD06',104,'S01','2023-10-02','2023-10-02 06:58:00','2023-10-02 15:02:00',8,0,0);
INSERT INTO attendance VALUES ('AD07',106,'S02','2023-10-02','2023-10-02 14:50:00','2023-10-02 23:10:00',8,0,0);
INSERT INTO attendance VALUES ('AD08',113,'S02','2023-10-02','2023-10-02 14:55:00','2023-10-02 23:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD09',120,'S02','2023-10-02','2023-10-02 14:45:00','2023-10-02 23:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD10',127,'S02','2023-10-02','2023-10-02 15:00:00','2023-10-03 00:00:00',8,1,0);
INSERT INTO attendance VALUES ('AD11',105,'S03','2023-10-02','2023-10-02 22:50:00','2023-10-03 07:05:00',8,0,1);
INSERT INTO attendance VALUES ('AD12',134,'S03','2023-10-02','2023-10-02 22:55:00','2023-10-03 07:15:00',8,0,1);
INSERT INTO attendance VALUES ('AD13',101,'S01','2023-10-03','2023-10-03 06:50:00','2023-10-03 15:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD14',102,'S01','2023-10-03','2023-10-03 06:55:00','2023-10-03 15:10:00',8,0,0);
INSERT INTO attendance VALUES ('AD15',103,'S01','2023-10-03','2023-10-03 06:58:00','2023-10-03 15:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD16',104,'S01','2023-10-03','2023-10-03 07:00:00','2023-10-03 17:00:00',8,2,0);
INSERT INTO attendance VALUES ('AD17',106,'S02','2023-10-03','2023-10-03 14:55:00','2023-10-03 23:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD18',113,'S02','2023-10-03','2023-10-03 14:50:00','2023-10-03 23:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD19',120,'S02','2023-10-03','2023-10-03 14:58:00','2023-10-03 23:15:00',8,0,0);
INSERT INTO attendance VALUES ('AD20',127,'S02','2023-10-03','2023-10-03 14:45:00','2023-10-03 23:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD21',105,'S03','2023-10-03','2023-10-03 22:55:00','2023-10-04 07:00:00',8,0,1);
INSERT INTO attendance VALUES ('AD22',134,'S03','2023-10-03','2023-10-03 22:50:00','2023-10-04 07:10:00',8,0,1);
INSERT INTO attendance VALUES ('AD23',101,'S01','2023-10-04','2023-10-04 06:55:00','2023-10-04 15:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD24',102,'S01','2023-10-04','2023-10-04 06:50:00','2023-10-04 15:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD25',103,'S01','2023-10-04','2023-10-04 07:00:00','2023-10-04 15:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD26',104,'S01','2023-10-04','2023-10-04 06:55:00','2023-10-04 15:10:00',8,0,0);
INSERT INTO attendance VALUES ('AD27',106,'S02','2023-10-04','2023-10-04 14:50:00','2023-10-04 23:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD28',113,'S02','2023-10-04','2023-10-04 14:45:00','2023-10-04 23:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD29',120,'S02','2023-10-04','2023-10-04 15:00:00','2023-10-04 23:10:00',8,0,0);
INSERT INTO attendance VALUES ('AD30',127,'S02','2023-10-04','2023-10-04 14:55:00','2023-10-04 23:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD31',105,'S03','2023-10-04','2023-10-04 22:50:00','2023-10-05 07:05:00',8,0,1);
INSERT INTO attendance VALUES ('AD32',134,'S03','2023-10-04','2023-10-04 22:55:00','2023-10-05 08:00:00',8,1,1);
INSERT INTO attendance VALUES ('AD33',101,'S01','2023-10-05','2023-10-05 06:50:00','2023-10-05 15:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD34',102,'S01','2023-10-05','2023-10-05 06:55:00','2023-10-05 15:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD35',103,'S01','2023-10-05','2023-10-05 07:05:00','2023-10-05 15:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD36',104,'S01','2023-10-05','2023-10-05 06:58:00','2023-10-05 15:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD37',106,'S02','2023-10-05','2023-10-05 14:45:00','2023-10-05 23:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD38',113,'S02','2023-10-05','2023-10-05 14:50:00','2023-10-05 23:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD39',120,'S02','2023-10-05','2023-10-05 14:55:00','2023-10-05 23:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD40',127,'S02','2023-10-05','2023-10-05 15:00:00','2023-10-06 01:00:00',8,2,0);
INSERT INTO attendance VALUES ('AD41',105,'S03','2023-10-05','2023-10-05 22:55:00','2023-10-06 07:05:00',8,0,1);
INSERT INTO attendance VALUES ('AD42',134,'S03','2023-10-05','2023-10-05 22:50:00','2023-10-06 07:00:00',8,0,1);
INSERT INTO attendance VALUES ('AD43',101,'S01','2023-10-06','2023-10-06 06:55:00','2023-10-06 15:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD44',102,'S01','2023-10-06','2023-10-06 06:50:00','2023-10-06 15:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD45',103,'S01','2023-10-06','2023-10-06 07:00:00','2023-10-06 16:00:00',8,1,0);
INSERT INTO attendance VALUES ('AD46',104,'S01','2023-10-06','2023-10-06 06:58:00','2023-10-06 15:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD47',106,'S02','2023-10-06','2023-10-06 14:55:00','2023-10-06 23:10:00',8,0,0);
INSERT INTO attendance VALUES ('AD48',113,'S02','2023-10-06','2023-10-06 14:50:00','2023-10-06 23:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD49',120,'S02','2023-10-06','2023-10-06 14:45:00','2023-10-06 23:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD50',127,'S02','2023-10-06','2023-10-06 15:00:00','2023-10-06 23:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD51',105,'S03','2023-10-06','2023-10-06 22:50:00','2023-10-07 07:05:00',8,0,1);
INSERT INTO attendance VALUES ('AD52',134,'S03','2023-10-06','2023-10-06 22:55:00','2023-10-07 07:15:00',8,0,1);
INSERT INTO attendance VALUES ('AD53',101,'S01','2023-10-07','2023-10-07 06:50:00','2023-10-07 15:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD54',102,'S01','2023-10-07','2023-10-07 06:55:00','2023-10-07 15:10:00',8,0,0);
INSERT INTO attendance VALUES ('AD55',103,'S01','2023-10-07','2023-10-07 07:00:00','2023-10-07 15:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD56',104,'S01','2023-10-07','2023-10-07 06:58:00','2023-10-07 15:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD57',106,'S02','2023-10-07','2023-10-07 14:50:00','2023-10-07 23:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD58',113,'S02','2023-10-07','2023-10-07 14:45:00','2023-10-07 23:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD59',120,'S02','2023-10-07','2023-10-07 15:00:00','2023-10-07 23:10:00',8,0,0);
INSERT INTO attendance VALUES ('AD60',127,'S02','2023-10-07','2023-10-07 14:55:00','2023-10-07 23:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD61',105,'S03','2023-10-07','2023-10-07 22:55:00','2023-10-08 07:05:00',8,0,1);
INSERT INTO attendance VALUES ('AD62',134,'S03','2023-10-07','2023-10-07 22:50:00','2023-10-08 07:00:00',8,0,1);
INSERT INTO attendance VALUES ('AD63',101,'S01','2023-10-08','2023-10-08 06:55:00','2023-10-08 15:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD64',102,'S01','2023-10-08','2023-10-08 06:50:00','2023-10-08 15:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD65',103,'S01','2023-10-08','2023-10-08 07:00:00','2023-10-08 15:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD66',104,'S01','2023-10-08','2023-10-08 06:58:00','2023-10-08 15:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD67',106,'S02','2023-10-08','2023-10-08 14:50:00','2023-10-08 23:10:00',8,0,0);
INSERT INTO attendance VALUES ('AD68',113,'S02','2023-10-08','2023-10-08 14:55:00','2023-10-08 23:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD69',120,'S02','2023-10-08','2023-10-08 14:45:00','2023-10-08 23:00:00',8,0,0);
INSERT INTO attendance VALUES ('AD70',127,'S02','2023-10-08','2023-10-08 15:00:00','2023-10-08 23:05:00',8,0,0);
INSERT INTO attendance VALUES ('AD71',105,'S03','2023-10-08','2023-10-08 22:50:00','2023-10-09 07:05:00',8,0,1);
INSERT INTO attendance VALUES ('AD72',134,'S03','2023-10-08','2023-10-08 22:55:00','2023-10-09 07:15:00',8,0,1);

-- ============================================================
--  DATA: SALARY
-- ============================================================
INSERT INTO salary VALUES ('SA01',101,10,2023,25000,0,0,3000,1250,26750,'2023-10-31');
INSERT INTO salary VALUES ('SA02',102,10,2023,15000,0,0,3000,750,17250,'2023-10-31');
INSERT INTO salary VALUES ('SA03',103,10,2023,16000,200,0,3000,800,18400,'2023-10-31');
INSERT INTO salary VALUES ('SA04',104,10,2023,22000,275,0,3000,1100,24175,'2023-10-31');
INSERT INTO salary VALUES ('SA05',105,10,2023,20000,1500,2000,3000,1000,25500,'2023-10-31');
INSERT INTO salary VALUES ('SA06',106,10,2023,20000,0,0,3000,1000,22000,'2023-10-31');
INSERT INTO salary VALUES ('SA07',107,10,2023,20000,0,0,3000,1000,22000,'2023-10-31');
INSERT INTO salary VALUES ('SA08',108,10,2023,20000,0,0,3000,1000,22000,'2023-10-31');
INSERT INTO salary VALUES ('SA09',109,10,2023,20000,0,0,3000,1000,22000,'2023-10-31');
INSERT INTO salary VALUES ('SA10',111,10,2023,20000,0,0,3000,1000,22000,'2023-10-31');
INSERT INTO salary VALUES ('SA11',112,10,2023,20000,0,0,3000,1000,22000,'2023-10-31');
INSERT INTO salary VALUES ('SA12',113,10,2023,15000,0,0,3000,750,17250,'2023-10-31');
INSERT INTO salary VALUES ('SA13',114,10,2023,15000,0,0,3000,750,17250,'2023-10-31');
INSERT INTO salary VALUES ('SA14',115,10,2023,15000,0,0,3000,750,17250,'2023-10-31');
INSERT INTO salary VALUES ('SA15',116,10,2023,15000,0,0,3000,750,17250,'2023-10-31');
INSERT INTO salary VALUES ('SA16',118,10,2023,15000,0,0,3000,750,17250,'2023-10-31');
INSERT INTO salary VALUES ('SA17',119,10,2023,15000,0,0,3000,750,17250,'2023-10-31');
INSERT INTO salary VALUES ('SA18',120,10,2023,16000,0,0,3000,800,18200,'2023-10-31');
INSERT INTO salary VALUES ('SA19',121,10,2023,16000,0,0,3000,800,18200,'2023-10-31');
INSERT INTO salary VALUES ('SA20',122,10,2023,16000,0,0,3000,800,18200,'2023-10-31');
INSERT INTO salary VALUES ('SA21',123,10,2023,16000,0,0,3000,800,18200,'2023-10-31');
INSERT INTO salary VALUES ('SA22',124,10,2023,16000,0,0,3000,800,18200,'2023-10-31');
INSERT INTO salary VALUES ('SA23',126,10,2023,16000,0,0,3000,800,18200,'2023-10-31');
INSERT INTO salary VALUES ('SA24',127,10,2023,22000,412,0,3000,1100,24312,'2023-10-31');
INSERT INTO salary VALUES ('SA25',128,10,2023,22000,0,0,3000,1100,23900,'2023-10-31');
INSERT INTO salary VALUES ('SA26',129,10,2023,22000,0,0,3000,1100,23900,'2023-10-31');
INSERT INTO salary VALUES ('SA27',130,10,2023,22000,0,0,3000,1100,23900,'2023-10-31');
INSERT INTO salary VALUES ('SA28',132,10,2023,22000,0,0,3000,1100,23900,'2023-10-31');
INSERT INTO salary VALUES ('SA29',133,10,2023,22000,0,0,3000,1100,23900,'2023-10-31');
INSERT INTO salary VALUES ('SA30',134,10,2023,18000,112,1750,3000,900,21962,'2023-10-31');
INSERT INTO salary VALUES ('SA31',135,10,2023,18000,0,0,3000,900,20100,'2023-10-31');
INSERT INTO salary VALUES ('SA32',136,10,2023,18000,0,0,3000,900,20100,'2023-10-31');
INSERT INTO salary VALUES ('SA33',137,10,2023,18000,0,0,3000,900,20100,'2023-10-31');
INSERT INTO salary VALUES ('SA34',138,10,2023,18000,0,0,3000,900,20100,'2023-10-31');
INSERT INTO salary VALUES ('SA35',140,10,2023,18000,0,0,3000,900,20100,'2023-10-31');

-- ============================================================
--  DATA: SALARYDETAIL
-- ============================================================
INSERT INTO salarydetail VALUES ('D01','SA01','Tax Deduction',1250,'2023-10-31');
INSERT INTO salarydetail VALUES ('D02','SA01','Service Charge Bonus',3000,'2023-10-31');
INSERT INTO salarydetail VALUES ('D01','SA02','Tax Deduction',750,'2023-10-31');
INSERT INTO salarydetail VALUES ('D02','SA02','Service Charge Bonus',3000,'2023-10-31');
INSERT INTO salarydetail VALUES ('D01','SA03','Tax Deduction',800,'2023-10-31');
INSERT INTO salarydetail VALUES ('D02','SA03','Service Charge Bonus',3000,'2023-10-31');
INSERT INTO salarydetail VALUES ('D04','SA03','Overtime Pay',200,'2023-10-31');
INSERT INTO salarydetail VALUES ('D01','SA04','Tax Deduction',1100,'2023-10-31');
INSERT INTO salarydetail VALUES ('D02','SA04','Service Charge Bonus',3000,'2023-10-31');
INSERT INTO salarydetail VALUES ('D04','SA04','Overtime Pay',275,'2023-10-31');
INSERT INTO salarydetail VALUES ('D01','SA05','Tax Deduction',1000,'2023-10-31');
INSERT INTO salarydetail VALUES ('D02','SA05','Service Charge Bonus',3000,'2023-10-31');
INSERT INTO salarydetail VALUES ('D03','SA05','Night Shift Allowance',2000,'2023-10-31');
INSERT INTO salarydetail VALUES ('D04','SA05','Overtime Pay',1500,'2023-10-31');
INSERT INTO salarydetail VALUES ('D01','SA24','Tax Deduction',1100,'2023-10-31');
INSERT INTO salarydetail VALUES ('D02','SA24','Service Charge Bonus',3000,'2023-10-31');
INSERT INTO salarydetail VALUES ('D04','SA24','Overtime Pay',412,'2023-10-31');
INSERT INTO salarydetail VALUES ('D01','SA30','Tax Deduction',900,'2023-10-31');
INSERT INTO salarydetail VALUES ('D02','SA30','Service Charge Bonus',3000,'2023-10-31');
INSERT INTO salarydetail VALUES ('D03','SA30','Night Shift Allowance',1750,'2023-10-31');
INSERT INTO salarydetail VALUES ('D04','SA30','Overtime Pay',112,'2023-10-31');
