-- 更多测试数据
USE classroom_system;

-- 更多教师
INSERT IGNORE INTO teacher (teacher_code, name, department, title, phone, email) VALUES
('T004', '赵六', '计算机学院', '教授', '13800000004', 'zhaoliu@edu.cn'),
('T005', '钱七', '软件学院', '副教授', '13800000005', 'qianqi@edu.cn'),
('T006', '孙八', '数学学院', '讲师', '13800000006', 'sunba@edu.cn'),
('T007', '周九', '物理学院', '教授', '13800000007', 'zhoujiu@edu.cn'),
('T008', '吴十', '外语学院', '副教授', '13800000008', 'wushi@edu.cn'),
('T009', '郑十一', '经济学院', '讲师', '13800000009', 'zheng11@edu.cn'),
('T010', '王小明', '计算机学院', '助教', '13800000010', 'wangxm@edu.cn');

-- 更多教室
INSERT IGNORE INTO classroom (classroom_code, name, building, floor, location, category, seats, orientation, status) VALUES
('A301', 'A楼301', 'A楼', 3, 'A楼三层东侧', 'medium', 80, '南', 'available'),
('A302', 'A楼302', 'A楼', 3, 'A楼三层西侧', 'small', 45, '南', 'available'),
('A401', 'A楼401多媒体教室', 'A楼', 4, 'A楼四层', 'large', 150, '南', 'available'),
('B201', 'B楼201', 'B楼', 2, 'B楼二层东侧', 'medium', 70, '东', 'available'),
('B202', 'B楼202实验室', 'B楼', 2, 'B楼二层西侧', 'lab', 60, '东', 'available'),
('B301', 'B楼301语音室', 'B楼', 3, 'B楼三层', 'lab', 50, '东', 'available'),
('C101', 'C楼101阶梯教室', 'C楼', 1, 'C楼一层', 'ladder', 300, '西', 'available'),
('C201', 'C楼201', 'C楼', 2, 'C楼二层', 'medium', 60, '西', 'available'),
('D101', 'D楼101会议室', 'D楼', 1, 'D楼一层', 'meeting', 30, '北', 'available'),
('D102', 'D楼102研讨室', 'D楼', 1, 'D楼一层', 'small', 25, '北', 'available'),
('E101', 'E楼计算机机房1', 'E楼', 1, 'E楼一层', 'lab', 80, '南', 'available'),
('E102', 'E楼计算机机房2', 'E楼', 1, 'E楼一层', 'lab', 80, '南', 'maintenance');

-- 更多设备
INSERT IGNORE INTO equipment (equipment_code, name, classroom_id, equipment_type, brand, model, quantity, status) VALUES
('EQ012', 'A301投影仪', 7, 'projector', '爱普生', 'CB-X51', 1, 'normal'),
('EQ013', 'A301空调', 7, 'ac', '格力', 'KFR-72LW', 2, 'normal'),
('EQ014', 'A401投影仪', 9, 'projector', '索尼', 'VPL-EX575', 2, 'normal'),
('EQ015', 'A401音响系统', 9, 'speaker', 'JBL', 'EON615', 4, 'normal'),
('EQ016', 'A401电脑', 9, 'computer', '联想', 'ThinkCentre M920', 1, 'normal'),
('EQ017', 'B202实验台', 8, 'other', '自制', '-', 30, 'normal'),
('EQ018', 'B301语音设备', 12, 'multimedia', '先锋', 'CALL-100', 50, 'normal'),
('EQ019', 'C101投影仪', 13, 'projector', 'NEC', 'P605UL', 2, 'normal'),
('EQ020', 'C101麦克风', 13, 'microphone', 'Shure', 'SM58', 4, 'normal'),
('EQ021', 'E101电脑', 17, 'computer', '戴尔', 'OptiPlex 7090', 80, 'normal'),
('EQ022', 'E102电脑', 18, 'computer', '戴尔', 'OptiPlex 7090', 80, 'fault');

-- 更多班级
INSERT IGNORE INTO class_info (class_code, class_name, major, grade, department, student_count) VALUES
('CS2022-1', '计算机2022级1班', '计算机科学与技术', 2022, '计算机学院', 42),
('CS2022-2', '计算机2022级2班', '计算机科学与技术', 2022, '计算机学院', 40),
('CS2023-1', '计算机2023级1班', '计算机科学与技术', 2023, '计算机学院', 45),
('SE2021-1', '软件工程2021级1班', '软件工程', 2021, '软件学院', 38),
('SE2022-1', '软件工程2022级1班', '软件工程', 2022, '软件学院', 43),
('SE2023-1', '软件工程2023级1班', '软件工程', 2023, '软件学院', 46),
('MA2022-1', '数学2022级1班', '应用数学', 2022, '数学学院', 35),
('PH2022-1', '物理2022级1班', '应用物理', 2022, '物理学院', 32),
('EN2022-1', '英语2022级1班', '英语', 2022, '外语学院', 30),
('EC2022-1', '经济2022级1班', '经济学', 2022, '经济学院', 48);

-- 更多课程
INSERT IGNORE INTO course (course_code, name, teacher_id, credits, hours, course_type, capacity, semester) VALUES
('CS102', 'C语言程序设计', 4, 3.5, 56, 'required', 80, '2024-2025-1'),
('CS202', '计算机网络', 5, 3.0, 48, 'required', 60, '2024-2025-1'),
('CS203', '数据库原理', 1, 3.5, 56, 'required', 60, '2024-2025-1'),
('CS302', '软件工程', 2, 3.0, 48, 'required', 50, '2024-2025-1'),
('CS303', '编译原理', 4, 3.0, 48, 'required', 50, '2024-2025-1'),
('CS401', '人工智能导论', 1, 2.0, 32, 'elective', 100, '2024-2025-1'),
('CS402', '机器学习', 4, 3.0, 48, 'elective', 60, '2024-2025-1'),
('MA102', '线性代数', 3, 3.0, 48, 'required', 150, '2024-2025-1'),
('MA201', '概率论与数理统计', 6, 3.0, 48, 'required', 150, '2024-2025-1'),
('PH101', '大学物理', 7, 4.0, 64, 'required', 200, '2024-2025-1'),
('EN101', '大学英语I', 8, 2.0, 32, 'required', 60, '2024-2025-1'),
('EN102', '大学英语II', 8, 2.0, 32, 'required', 60, '2024-2025-1'),
('EC101', '微观经济学', 9, 3.0, 48, 'required', 100, '2024-2025-1'),
('PE101', '体育I', 10, 1.0, 32, 'required', 50, '2024-2025-1');

-- 更多排课数据 (覆盖周一到周五各时段)
INSERT IGNORE INTO schedule (course_id, classroom_id, teacher_id, class_id, semester, weekday, start_section, end_section, start_week, end_week, week_type) VALUES
-- 周一
(5, 7, 4, 4, '2024-2025-1', 1, 5, 6, 1, 16, 'all'),  -- C语言 A301
(8, 13, 3, NULL, '2024-2025-1', 1, 7, 8, 1, 16, 'all'),  -- 线性代数 C101阶梯
(11, 12, 8, 9, '2024-2025-1', 1, 9, 10, 1, 16, 'all'),  -- 大学英语 B301

-- 周二  
(6, 2, 5, 4, '2024-2025-1', 2, 3, 4, 1, 16, 'all'),  -- 计算机网络 A102
(9, 3, 6, NULL, '2024-2025-1', 2, 5, 6, 1, 16, 'all'),  -- 概率论 A201
(10, 13, 1, 1, '2024-2025-1', 2, 7, 8, 1, 16, 'all'),  -- 人工智能 C101

-- 周三
(7, 2, 1, 1, '2024-2025-1', 3, 1, 2, 1, 16, 'all'),  -- 数据库原理 A102
(12, 12, 8, 10, '2024-2025-1', 3, 5, 6, 1, 16, 'all'),  -- 大学英语II B301
(14, 13, 7, NULL, '2024-2025-1', 3, 7, 8, 1, 16, 'all'),  -- 大学物理 C101

-- 周四
(8, 2, 2, 2, '2024-2025-1', 4, 1, 2, 1, 16, 'all'),  -- 软件工程 A102
(9, 4, 4, 5, '2024-2025-1', 4, 3, 4, 1, 16, 'all'),  -- 编译原理 B101
(11, 7, 4, 6, '2024-2025-1', 4, 7, 8, 1, 16, 'all'),  -- 机器学习 A301

-- 周五
(13, 9, 9, NULL, '2024-2025-1', 5, 3, 4, 1, 16, 'all'),  -- 微观经济学 A401
(5, 17, 4, 7, '2024-2025-1', 5, 5, 6, 1, 16, 'all'),  -- C语言实验 E101机房
(6, 17, 5, 4, '2024-2025-1', 5, 7, 8, 1, 16, 'all');  -- 网络实验 E101机房

-- 更多学生用户
INSERT IGNORE INTO `user` (username, password_hash, role, real_name) VALUES
('student3', SHA2('123456', 256), 'student', '张明'),
('student4', SHA2('123456', 256), 'student', '李华'),
('student5', SHA2('123456', 256), 'student', '王芳'),
('student6', SHA2('123456', 256), 'student', '刘强'),
('student7', SHA2('123456', 256), 'student', '陈静'),
('student8', SHA2('123456', 256), 'student', '杨帆'),
('student9', SHA2('123456', 256), 'student', '周婷'),
('student10', SHA2('123456', 256), 'student', '吴鹏');

-- 创建学生记录
INSERT IGNORE INTO student (user_id, student_code, name, major, class_name, grade, phone, email) VALUES
((SELECT id FROM user WHERE username='student1'), '2021001001', '王同学', '计算机科学与技术', '计算机2021级1班', 2021, '13900000001', 'wang@stu.edu.cn'),
((SELECT id FROM user WHERE username='student2'), '2021001002', '李同学', '计算机科学与技术', '计算机2021级1班', 2021, '13900000002', 'li@stu.edu.cn'),
((SELECT id FROM user WHERE username='student3'), '2022001001', '张明', '计算机科学与技术', '计算机2022级1班', 2022, '13900000003', 'zhangm@stu.edu.cn'),
((SELECT id FROM user WHERE username='student4'), '2022001002', '李华', '计算机科学与技术', '计算机2022级1班', 2022, '13900000004', 'lihua@stu.edu.cn'),
((SELECT id FROM user WHERE username='student5'), '2022002001', '王芳', '软件工程', '软件工程2022级1班', 2022, '13900000005', 'wangf@stu.edu.cn'),
((SELECT id FROM user WHERE username='student6'), '2022002002', '刘强', '软件工程', '软件工程2022级1班', 2022, '13900000006', 'liuq@stu.edu.cn'),
((SELECT id FROM user WHERE username='student7'), '2023001001', '陈静', '计算机科学与技术', '计算机2023级1班', 2023, '13900000007', 'chenj@stu.edu.cn'),
((SELECT id FROM user WHERE username='student8'), '2023001002', '杨帆', '计算机科学与技术', '计算机2023级1班', 2023, '13900000008', 'yangf@stu.edu.cn'),
((SELECT id FROM user WHERE username='student9'), '2022003001', '周婷', '英语', '英语2022级1班', 2022, '13900000009', 'zhout@stu.edu.cn'),
((SELECT id FROM user WHERE username='student10'), '2022004001', '吴鹏', '经济学', '经济2022级1班', 2022, '13900000010', 'wup@stu.edu.cn');

-- 学生选课记录
INSERT IGNORE INTO enrollment (student_id, course_id, semester, status) VALUES
(1, 1, '2024-2025-1', 'enrolled'),
(1, 2, '2024-2025-1', 'enrolled'),
(1, 7, '2024-2025-1', 'enrolled'),
(2, 1, '2024-2025-1', 'enrolled'),
(2, 2, '2024-2025-1', 'enrolled'),
(3, 5, '2024-2025-1', 'enrolled'),
(3, 6, '2024-2025-1', 'enrolled'),
(4, 5, '2024-2025-1', 'enrolled'),
(4, 10, '2024-2025-1', 'enrolled'),
(5, 8, '2024-2025-1', 'enrolled'),
(6, 8, '2024-2025-1', 'enrolled'),
(7, 5, '2024-2025-1', 'enrolled'),
(8, 5, '2024-2025-1', 'enrolled'),
(9, 11, '2024-2025-1', 'enrolled'),
(10, 13, '2024-2025-1', 'enrolled');

-- 一些教室预约记录
INSERT IGNORE INTO booking (classroom_id, applicant_id, booking_date, start_section, end_section, purpose, status) VALUES
(10, 2, '2024-12-20', 3, 4, '学术研讨会', 'approved'),
(10, 3, '2024-12-21', 5, 6, '项目组讨论', 'pending'),
(9, 4, '2024-12-22', 1, 2, '学生社团活动', 'approved'),
(15, 5, '2024-12-23', 7, 8, '毕业论文答辩', 'pending');

-- 通知公告表
CREATE TABLE IF NOT EXISTS notice (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id INT,
    notice_type ENUM('system', 'academic', 'activity') DEFAULT 'system',
    is_top BOOLEAN DEFAULT FALSE,
    publish_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    expire_time DATETIME,
    status ENUM('draft', 'published', 'expired') DEFAULT 'published',
    view_count INT DEFAULT 0,
    FOREIGN KEY (author_id) REFERENCES `user`(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 初始通知
INSERT IGNORE INTO notice (title, content, author_id, notice_type, is_top) VALUES
('2024-2025学年第一学期课表已发布', '各位老师、同学：\n\n2024-2025学年第一学期课表已经排定并发布，请登录系统查看。如有问题请联系教务处。\n\n教务处\n2024年8月25日', 1, 'academic', TRUE),
('关于国庆节假期调课安排的通知', '根据学校安排，国庆节期间（10月1日-7日）放假，9月29日（周日）补10月4日（周五）的课。请各位老师、同学注意。', 1, 'academic', FALSE),
('教室资源管理系统升级公告', '系统将于本周六凌晨2:00-6:00进行升级维护，届时将暂停服务，请提前做好安排。', 1, 'system', FALSE),
('计算机学院学术讲座通知', '主题：人工智能前沿技术\n时间：2024年12月25日 14:00\n地点：C楼101阶梯教室\n主讲人：张三教授\n\n欢迎广大师生参加！', 1, 'activity', FALSE);

SELECT '数据导入完成' AS status;
