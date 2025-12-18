-- 教室资源管理系统数据库初始化脚本
-- MySQL 8.0+
-- 密码: @123Fengaoran

CREATE DATABASE IF NOT EXISTS classroom_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE classroom_system;

-- ========== 用户与权限 ==========
CREATE TABLE IF NOT EXISTS `user` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student',
    real_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========== 教师表 ==========
CREATE TABLE IF NOT EXISTS teacher (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    teacher_code VARCHAR(50) UNIQUE NOT NULL COMMENT '教师工号',
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) COMMENT '所属院系',
    title VARCHAR(50) COMMENT '职称',
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES `user`(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========== 学生表 ==========
CREATE TABLE IF NOT EXISTS student (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    student_code VARCHAR(50) UNIQUE NOT NULL COMMENT '学号',
    name VARCHAR(100) NOT NULL,
    major VARCHAR(100) COMMENT '专业',
    class_name VARCHAR(50) COMMENT '班级',
    grade INT COMMENT '年级',
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES `user`(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========== 教室基本信息 ==========
CREATE TABLE IF NOT EXISTS classroom (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classroom_code VARCHAR(50) UNIQUE NOT NULL COMMENT '教室编号',
    name VARCHAR(100) NOT NULL COMMENT '教室名称',
    building VARCHAR(100) COMMENT '所在楼栋',
    floor INT COMMENT '楼层',
    location VARCHAR(200) COMMENT '详细位置',
    category ENUM('large', 'medium', 'small', 'ladder', 'lab', 'meeting') NOT NULL COMMENT '类别：大教室/中教室/小教室/阶梯教室/实验室/会议室',
    layout TEXT COMMENT '布局描述（JSON格式）',
    seats INT NOT NULL COMMENT '座位数',
    orientation VARCHAR(20) COMMENT '朝向',
    area DECIMAL(10,2) COMMENT '面积（平方米）',
    status ENUM('available', 'maintenance', 'disabled') DEFAULT 'available' COMMENT '状态',
    remark TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========== 教室设备 ==========
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id INT NOT NULL,
    equipment_type ENUM('blackboard', 'whiteboard', 'projector', 'computer', 'air_conditioner', 'speaker', 'microphone', 'camera', 'desk', 'chair', 'other') NOT NULL COMMENT '设备类型',
    equipment_name VARCHAR(100) NOT NULL COMMENT '设备名称',
    brand VARCHAR(100) COMMENT '品牌',
    model VARCHAR(100) COMMENT '型号',
    quantity INT DEFAULT 1 COMMENT '数量',
    status ENUM('normal', 'broken', 'maintenance') DEFAULT 'normal' COMMENT '状态',
    purchase_date DATE COMMENT '购置日期',
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classroom(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========== 课程信息 ==========
CREATE TABLE IF NOT EXISTS course (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(50) UNIQUE NOT NULL COMMENT '课程编号',
    name VARCHAR(100) NOT NULL COMMENT '课程名称',
    teacher_id INT COMMENT '授课教师',
    credits DECIMAL(3,1) COMMENT '学分',
    hours INT COMMENT '学时',
    course_type ENUM('required', 'elective', 'public') DEFAULT 'required' COMMENT '课程类型',
    capacity INT COMMENT '课程容量',
    semester VARCHAR(20) COMMENT '学期（如 2024-2025-1）',
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teacher(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========== 班级表 ==========
CREATE TABLE IF NOT EXISTS class_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_code VARCHAR(50) UNIQUE NOT NULL COMMENT '班级编号',
    class_name VARCHAR(100) NOT NULL COMMENT '班级名称',
    major VARCHAR(100) COMMENT '专业',
    grade INT COMMENT '年级',
    student_count INT DEFAULT 0 COMMENT '学生人数',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========== 排课/课表 ==========
CREATE TABLE IF NOT EXISTS schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    classroom_id INT NOT NULL,
    teacher_id INT NOT NULL,
    class_id INT COMMENT '班级ID',
    semester VARCHAR(20) NOT NULL COMMENT '学期',
    weekday TINYINT NOT NULL COMMENT '星期几（1-7）',
    start_section TINYINT NOT NULL COMMENT '开始节次（1-12）',
    end_section TINYINT NOT NULL COMMENT '结束节次',
    start_week TINYINT NOT NULL COMMENT '开始周次',
    end_week TINYINT NOT NULL COMMENT '结束周次',
    week_type ENUM('all', 'odd', 'even') DEFAULT 'all' COMMENT '周类型：全部/单周/双周',
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classroom(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teacher(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES class_info(id) ON DELETE SET NULL,
    INDEX idx_schedule_time (semester, weekday, start_section, end_section),
    INDEX idx_schedule_classroom (classroom_id, semester),
    INDEX idx_schedule_teacher (teacher_id, semester)
) ENGINE=InnoDB;

-- ========== 学生选课 ==========
CREATE TABLE IF NOT EXISTS enrollment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    semester VARCHAR(20) NOT NULL,
    status ENUM('enrolled', 'dropped', 'completed') DEFAULT 'enrolled',
    grade DECIMAL(5,2) COMMENT '成绩',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
    UNIQUE KEY uk_enrollment (student_id, course_id, semester)
) ENGINE=InnoDB;

-- ========== 教室预约/临时占用 ==========
CREATE TABLE IF NOT EXISTS booking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id INT NOT NULL,
    applicant_id INT NOT NULL COMMENT '申请人user_id',
    booking_date DATE NOT NULL,
    start_section TINYINT NOT NULL,
    end_section TINYINT NOT NULL,
    purpose VARCHAR(200) COMMENT '用途',
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    approver_id INT COMMENT '审批人',
    approved_at DATETIME,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classroom(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES `user`(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES `user`(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========== 操作日志 ==========
CREATE TABLE IF NOT EXISTS operation_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    detail TEXT,
    ip_address VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES `user`(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========== 节次时间配置 ==========
CREATE TABLE IF NOT EXISTS section_time (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_no TINYINT UNIQUE NOT NULL COMMENT '节次编号',
    start_time TIME NOT NULL COMMENT '开始时间',
    end_time TIME NOT NULL COMMENT '结束时间',
    period_name VARCHAR(20) COMMENT '时段名称（上午/下午/晚上）'
) ENGINE=InnoDB;

-- ========== 初始化节次时间 ==========
INSERT INTO section_time (section_no, start_time, end_time, period_name) VALUES
(1, '08:00:00', '08:45:00', '上午'),
(2, '08:55:00', '09:40:00', '上午'),
(3, '10:00:00', '10:45:00', '上午'),
(4, '10:55:00', '11:40:00', '上午'),
(5, '14:00:00', '14:45:00', '下午'),
(6, '14:55:00', '15:40:00', '下午'),
(7, '16:00:00', '16:45:00', '下午'),
(8, '16:55:00', '17:40:00', '下午'),
(9, '19:00:00', '19:45:00', '晚上'),
(10, '19:55:00', '20:40:00', '晚上'),
(11, '20:50:00', '21:35:00', '晚上'),
(12, '21:45:00', '22:30:00', '晚上');

-- ========== 初始化管理员账户 ==========
INSERT INTO `user` (username, password_hash, role, real_name) VALUES
('admin', SHA2('admin123', 256), 'admin', '系统管理员');

-- ========== 插入测试数据 ==========
-- 教师
INSERT INTO teacher (teacher_code, name, department, title) VALUES
('T001', '张三', '计算机学院', '教授'),
('T002', '李四', '计算机学院', '副教授'),
('T003', '王五', '数学学院', '讲师');

-- 教室
INSERT INTO classroom (classroom_code, name, building, floor, location, category, seats, orientation, status) VALUES
('A101', 'A楼101', 'A楼', 1, 'A楼一层东侧', 'large', 120, '南', 'available'),
('A102', 'A楼102', 'A楼', 1, 'A楼一层西侧', 'medium', 60, '南', 'available'),
('A201', 'A楼201', 'A楼', 2, 'A楼二层东侧', 'ladder', 200, '南', 'available'),
('B101', 'B楼101', 'B楼', 1, 'B楼一层', 'small', 40, '东', 'available'),
('B102', 'B楼102', 'B楼', 1, 'B楼一层', 'lab', 50, '东', 'available'),
('C301', 'C楼301', 'C楼', 3, 'C楼三层', 'meeting', 20, '西', 'available');

-- 设备
INSERT INTO equipment (classroom_id, equipment_type, equipment_name, quantity, status) VALUES
(1, 'projector', '投影仪', 1, 'normal'),
(1, 'computer', '教师电脑', 1, 'normal'),
(1, 'air_conditioner', '空调', 4, 'normal'),
(1, 'speaker', '音响', 2, 'normal'),
(2, 'projector', '投影仪', 1, 'normal'),
(2, 'whiteboard', '白板', 1, 'normal'),
(3, 'projector', '投影仪', 2, 'normal'),
(3, 'microphone', '麦克风', 2, 'normal'),
(4, 'blackboard', '黑板', 1, 'normal'),
(5, 'computer', '学生电脑', 50, 'normal');

-- 班级
INSERT INTO class_info (class_code, class_name, major, grade, student_count) VALUES
('CS2021-1', '计算机2021级1班', '计算机科学与技术', 2021, 35),
('CS2021-2', '计算机2021级2班', '计算机科学与技术', 2021, 38),
('SE2022-1', '软件工程2022级1班', '软件工程', 2022, 40);

-- 课程
INSERT INTO course (course_code, name, teacher_id, credits, hours, course_type, capacity, semester) VALUES
('CS101', '程序设计基础', 1, 4.0, 64, 'required', 120, '2024-2025-1'),
('CS201', '数据结构', 1, 3.5, 56, 'required', 60, '2024-2025-1'),
('CS301', '操作系统', 2, 3.0, 48, 'required', 60, '2024-2025-1'),
('MA101', '高等数学', 3, 5.0, 80, 'public', 200, '2024-2025-1');

-- 排课
INSERT INTO schedule (course_id, classroom_id, teacher_id, class_id, semester, weekday, start_section, end_section, start_week, end_week, week_type) VALUES
(1, 1, 1, 1, '2024-2025-1', 1, 1, 2, 1, 16, 'all'),
(1, 1, 1, 1, '2024-2025-1', 3, 3, 4, 1, 16, 'all'),
(2, 2, 1, 1, '2024-2025-1', 2, 1, 2, 1, 16, 'all'),
(3, 2, 2, 2, '2024-2025-1', 4, 5, 6, 1, 16, 'all'),
(4, 3, 3, NULL, '2024-2025-1', 1, 3, 4, 1, 16, 'all'),
(4, 3, 3, NULL, '2024-2025-1', 5, 1, 2, 1, 16, 'all');

-- 创建视图：教室利用率统计
CREATE OR REPLACE VIEW v_classroom_utilization AS
SELECT 
    c.id AS classroom_id,
    c.classroom_code,
    c.name AS classroom_name,
    c.category,
    c.seats,
    s.semester,
    COUNT(DISTINCT CONCAT(s.weekday, '-', s.start_section)) AS used_slots,
    ROUND(COUNT(DISTINCT CONCAT(s.weekday, '-', s.start_section)) / (5 * 12) * 100, 2) AS utilization_rate
FROM classroom c
LEFT JOIN schedule s ON c.id = s.classroom_id
GROUP BY c.id, c.classroom_code, c.name, c.category, c.seats, s.semester;

-- 创建视图：课表视图
CREATE OR REPLACE VIEW v_schedule_detail AS
SELECT 
    s.id AS schedule_id,
    s.semester,
    s.weekday,
    s.start_section,
    s.end_section,
    s.start_week,
    s.end_week,
    s.week_type,
    c.course_code,
    c.name AS course_name,
    t.teacher_code,
    t.name AS teacher_name,
    cr.classroom_code,
    cr.name AS classroom_name,
    cr.building,
    ci.class_code,
    ci.class_name
FROM schedule s
JOIN course c ON s.course_id = c.id
JOIN teacher t ON s.teacher_id = t.id
JOIN classroom cr ON s.classroom_id = cr.id
LEFT JOIN class_info ci ON s.class_id = ci.id;
