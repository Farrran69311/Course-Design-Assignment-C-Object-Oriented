# 教室资源管理系统 - 技术文档

## 目录

1. [系统概述](#系统概述)
2. [系统架构](#系统架构)
3. [数据库设计](#数据库设计)
4. [API文档](#api文档)
5. [前端实现](#前端实现)
6. [后端实现](#后端实现)
7. [部署指南](#部署指南)
8. [开发规范](#开发规范)
9. [常见问题](#常见问题)
10. [性能优化](#性能优化)

---

## 系统概述

### 项目目标

构建一个现代化的教室资源管理系统，支持教室信息管理、课程排课、设备管理、课表查询等功能，为高校教学资源管理提供完整的解决方案。

### 核心功能

| 模块 | 功能描述 | 适用角色 |
|------|--------|--------|
| **教室管理** | 教室信息CRUD、分类、座位管理 | 管理员 |
| **设备管理** | 设备配置、维护状态、故障报告 | 管理员、教师 |
| **课程管理** | 课程信息、学分、教师关联 | 管理员 |
| **智能排课** | 自动冲突检测、时间冲突预警 | 管理员 |
| **课表查询** | 教师/学生课表、周视图展示 | 教师、学生 |
| **空闲查询** | 实时查询可用教室 | 全部 |
| **选课管理** | 学生选课、容量限制、成绩管理 | 学生 |
| **教室预约** | 临时占用申请、审批流程 | 教师、管理员 |
| **统计分析** | 教室利用率、使用趋势 | 管理员 |
| **通知公告** | 系统通知、置顶功能 | 管理员 |

### 技术栈

## 后端

- C++17 标准
- 自定义 HTTP 服务器（基于 Socket）
- MySQL 8.0+ 数据库
- JSON 库用于数据序列化

**前端**

- HTML5 + CSS3 + JavaScript
- Bootstrap 5 框架
- Chart.js 数据可视化
- 深色模式支持

**构建工具**

- CMake 3.10+
- Make 编译系统
- MySQL C API

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                    客户端层（Browser）                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  HTML + CSS + JavaScript + Bootstrap + Chart.js  │  │
│  │  - 响应式设计  - 深色模式  - 实时更新             │  │
│  └──────────────────────────────────────────────────┘  │
└──────────┬───────────────────────────────────────────────┘
           │ HTTP/HTTPS
           ↓
┌─────────────────────────────────────────────────────────┐
│                  应用服务层（Backend）                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │         C++ HTTP Server (Port: 8080)             │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │  路由层：REST API 路由匹配与转发              │ │  │
│  │  ├─ GET/POST/PUT/DELETE 方法处理               │ │  │
│  │  ├─ 请求参数解析                               │ │  │
│  │  └─ 响应格式化                                 │ │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │  业务逻辑层：API 处理函数                     │ │  │
│  │  ├─ 教室管理逻辑                               │ │  │
│  │  ├─ 课程排课逻辑（冲突检测）                   │ │  │
│  │  ├─ 选课与课表逻辑                             │ │  │
│  │  ├─ 设备与预约逻辑                             │ │  │
│  │  └─ 统计与分析逻辑                             │ │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │  数据访问层：数据库操作                       │ │  │
│  │  ├─ SQL 查询执行                                │ │  │
│  │  ├─ 参数化查询（防 SQL 注入）                   │ │  │
│  │  ├─ 结果集映射                                 │ │  │
│  │  └─ 连接池管理                                 │ │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │  工具库：JSON、HTTP、字符串处理               │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
└──────────┬───────────────────────────────────────────────┘
           │ MySQL Protocol
           ↓
┌─────────────────────────────────────────────────────────┐
│               数据存储层（MySQL Database）               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  数据库：classroom_system                         │  │
│  │  ├─ 基础表：user, teacher, student, classroom   │  │
│  │  ├─ 业务表：course, schedule, equipment         │  │
│  │  ├─ 功能表：booking, enrollment, notice         │  │
│  │  ├─ 日志表：operation_log, section_time         │  │
│  │  └─ 视图：v_schedule_detail, v_utilization      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 模块划分

**前端模块结构**

```
frontend/
├── index.html           # 主页面模板
│   ├── 登录页面        # 动画渐变背景
│   ├── 主布局          # 侧边栏 + 内容区
│   ├── 仪表盘          # 统计卡片
│   └── 各业务页面      # 表单、表格、图表
│
└── app.js              # 前端业务逻辑
    ├── API 通信        # 请求/响应处理
    ├── 页面控制        # DOM 操作、事件绑定
    ├── 数据管理        # 缓存、分页
    ├── 权限控制        # 角色验证
    └── UI 增强         # 动画、加载状态
```

**后端模块结构**

```
server/
├── include/
│   ├── http_server.hpp # HTTP 服务器框架
│   ├── db.hpp          # 数据库封装
│   └── json.hpp        # JSON 工具库
│
└── src/
    ├── http_server.cpp # HTTP 服务器实现
    ├── db.cpp          # 数据库连接与操作
    └── main.cpp        # API 路由与业务逻辑
```

### 数据流向

```
用户操作 → 前端事件 → API 调用 → HTTP 请求 → 后端路由匹配 
  → 业务逻辑处理 → 数据库查询 → 结果映射 → JSON 序列化 
  → HTTP 响应 → 前端接收 → DOM 更新 → 用户看到结果
```

---

## 数据库设计

### 数据库模型（ER图）

```
┌──────────────┐
│    user      │  用户基类
├──────────────┤
│ id (PK)      │
│ username     │
│ password     │
│ role         │  (admin/teacher/student)
│ real_name    │
│ email        │
│ phone        │
└──────────────┘
    ↓       ↓
    │       │
    ↓       ↓
┌──────────────┐    ┌──────────────┐
│   teacher    │    │   student    │
├──────────────┤    ├──────────────┤
│ id (PK)      │    │ id (PK)      │
│ user_id (FK) │    │ user_id (FK) │
│ code         │    │ code         │
│ name         │    │ name         │
│ department   │    │ major        │
│ title        │    │ class_name   │
└──────────────┘    └──────────────┘

┌──────────────┐
│  classroom   │  教室信息
├──────────────┤
│ id (PK)      │
│ code         │
│ name         │
│ building     │
│ floor        │
│ seats        │
│ category     │
│ status       │
└──────────────┘
    ↓
┌──────────────┐
│  equipment   │  设备（多对一）
├──────────────┤
│ id (PK)      │
│ code         │
│ name         │
│ classroom_id │ (FK)
│ type         │
│ status       │
└──────────────┘

┌──────────────┐    ┌──────────────┐
│   course     │    │  schedule    │
├──────────────┤    ├──────────────┤
│ id (PK)      │    │ id (PK)      │
│ code         │    │ course_id(FK)│
│ name         │    │ classroom(FK)│
│ teacher_id   │←───┤ teacher_id(FK)
│ credits      │    │ weekday      │
│ hours        │    │ section      │
│ capacity     │    │ week_range   │
│ semester     │    │ week_type    │
└──────────────┘    └──────────────┘

┌──────────────┐    ┌──────────────┐
│ enrollment   │    │  booking     │
├──────────────┤    ├──────────────┤
│ id (PK)      │    │ id (PK)      │
│ student_id   │    │ classroom_id │
│ course_id    │    │ applicant_id │
│ status       │    │ date         │
│ grade        │    │ section      │
└──────────────┘    │ status       │
                    └──────────────┘
```

### 关键表结构详解

**classroom（教室表）**

```sql
CREATE TABLE classroom (
    id INT PRIMARY KEY AUTO_INCREMENT,
    classroom_code VARCHAR(50) UNIQUE NOT NULL,  -- 教室编号，唯一标识
    name VARCHAR(100) NOT NULL,                  -- 教室名称
    building VARCHAR(100),                       -- 所在楼栋
    floor INT,                                   -- 楼层
    location VARCHAR(200),                       -- 详细位置
    category ENUM('large', 'medium', 'small', 'ladder', 'lab', 'meeting'),
    layout TEXT,                                 -- JSON格式布局
    seats INT NOT NULL,                          -- 座位数
    orientation VARCHAR(20),                     -- 朝向
    area DECIMAL(10,2),                          -- 面积
    status ENUM('available', 'maintenance', 'disabled'),
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    KEY idx_code (classroom_code),
    KEY idx_building (building),
    KEY idx_category (category),
    KEY idx_status (status)
);
```

**schedule（排课表）**

```sql
CREATE TABLE schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,                      -- 课程ID
    classroom_id INT NOT NULL,                   -- 教室ID
    teacher_id INT NOT NULL,                     -- 教师ID
    class_id INT,                                -- 班级ID（可选）
    semester VARCHAR(20) NOT NULL,               -- 学期，如"2024-2025-1"
    weekday TINYINT NOT NULL,                    -- 星期几（1-7）
    start_section TINYINT NOT NULL,              -- 开始节次（1-12）
    end_section TINYINT NOT NULL,                -- 结束节次
    start_week TINYINT NOT NULL,                 -- 开始周次
    end_week TINYINT NOT NULL,                   -- 结束周次
    week_type ENUM('all', 'odd', 'even'),        -- 全部、单周、双周
    remark TEXT,
    
    FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classroom(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teacher(id) ON DELETE CASCADE,
    
    KEY idx_time (semester, weekday, start_section),
    KEY idx_classroom (classroom_id, semester),
    KEY idx_teacher (teacher_id, semester)
);
```

### 数据库视图

**v_schedule_detail（课表详情视图）**

```sql
CREATE VIEW v_schedule_detail AS
SELECT 
    s.id AS schedule_id,
    s.semester,
    s.weekday,
    s.start_section,
    s.end_section,
    c.course_code,
    c.name AS course_name,
    t.teacher_code,
    t.name AS teacher_name,
    cr.classroom_code,
    cr.name AS classroom_name,
    ci.class_code,
    ci.class_name
FROM schedule s
JOIN course c ON s.course_id = c.id
JOIN teacher t ON s.teacher_id = t.id
JOIN classroom cr ON s.classroom_id = cr.id
LEFT JOIN class_info ci ON s.class_id = ci.id;
```

**v_classroom_utilization（教室利用率视图）**

```sql
CREATE VIEW v_classroom_utilization AS
SELECT 
    c.id AS classroom_id,
    c.classroom_code,
    c.name AS classroom_name,
    c.seats,
    s.semester,
    COUNT(DISTINCT CONCAT(s.weekday, '-', s.start_section)) AS used_slots,
    ROUND(COUNT(*) / (5 * 12) * 100, 2) AS utilization_rate
FROM classroom c
LEFT JOIN schedule s ON c.id = s.classroom_id
GROUP BY c.id, s.semester;
```

### 索引策略

| 表名 | 索引字段 | 用途 | 类型 |
|------|--------|------|------|
| classroom | code, building, category | 常用查询条件 | 单字段 |
| schedule | (semester, weekday, start_section) | 冲突检测 | 复合 |
| schedule | classroom_id, teacher_id | 关联查询 | 单字段 |
| course | semester | 学期过滤 | 单字段 |
| user | username | 登录验证 | UNIQUE |
| enrollment | (student_id, course_id, semester) | 去重 | 复合UNIQUE |

---

## API文档

### 基础信息

- **基础 URL**: `http://localhost:8080/api`
- **请求格式**: JSON
- **响应格式**: JSON
- **认证方式**: Token（请求头中携带）

### API 调用示例

```javascript
// 基础 API 调用模板
const response = await fetch('/api/endpoint', {
    method: 'GET|POST|PUT|DELETE',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(data)  // POST/PUT 时需要
});
const result = await response.json();
```

### 认证 API

#### 登录 - POST /api/login

**请求**

```json
{
    "username": "admin",
    "password": "admin123"
}
```

**响应成功 (200)**

```json
{
    "token": "token_1_1735....",
    "user": {
        "id": 1,
        "username": "admin",
        "real_name": "系统管理员",
        "role": "admin"
    }
}
```

**响应失败 (401)**

```json
{
    "error": "用户名或密码错误"
}
```

### 教室管理 API

#### 获取教室列表 - GET /api/classrooms

**查询参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| category | string | 教室类型：large/medium/small/ladder/lab/meeting |
| building | string | 楼栋名称 |
| minSeats | int | 最少座位数 |
| status | string | 状态：available/maintenance/disabled |
| page | int | 分页页码（客户端处理） |

**示例**

```http
GET /api/classrooms?category=large&building=A楼&minSeats=50
```

**响应 (200)**

```json
[
    {
        "id": 1,
        "classroom_code": "A101",
        "name": "A楼101",
        "building": "A楼",
        "floor": 1,
        "seats": 120,
        "category": "large",
        "status": "available",
        "created_at": "2024-01-01 10:00:00"
    },
    ...
]
```

#### 获取教室详情 - GET /api/classrooms/:id

**响应 (200)**

```json
{
    "id": 1,
    "classroom_code": "A101",
    "name": "A楼101",
    "building": "A楼",
    "seats": 120,
    "equipments": [
        {
            "id": 1,
            "name": "投影仪",
            "type": "projector",
            "status": "normal"
        }
    ]
}
```

#### 创建教室 - POST /api/classrooms

**请求体**

```json
{
    "classroom_code": "D101",
    "name": "D楼101",
    "building": "D楼",
    "floor": 1,
    "location": "D楼一层",
    "category": "large",
    "seats": 100,
    "orientation": "南",
    "status": "available",
    "remark": "新增教室"
}
```

**响应 (201)**

```json
{
    "id": 7,
    "message": "创建成功"
}
```

#### 更新教室 - PUT /api/classrooms/:id

**请求体** - 同创建教室

**响应 (200)**

```json
{
    "message": "更新成功"
}
```

#### 删除教室 - DELETE /api/classrooms/:id

**响应 (204)** - 无内容

### 排课管理 API

#### 获取排课列表 - GET /api/schedules

**查询参数**

| 参数 | 说明 |
|------|------|
| semester | 学期，如"2024-2025-1" |
| classroom_id | 教室ID |
| teacher_id | 教师ID |
| weekday | 星期几（1-7） |

**示例**

```http
GET /api/schedules?semester=2024-2025-1&weekday=1
```

#### 创建排课 - POST /api/schedules

**请求体**

```json
{
    "course_id": 1,
    "classroom_id": 2,
    "teacher_id": 1,
    "class_id": 1,
    "semester": "2024-2025-1",
    "weekday": 2,
    "start_section": 1,
    "end_section": 2,
    "start_week": 1,
    "end_week": 16,
    "week_type": "all"
}
```

**响应成功 (201)**

```json
{
    "id": 25,
    "message": "排课成功"
}
```

**冲突响应 (409)**

```json
{
    "error": "时间冲突：教室或教师在该时段已有安排"
}
```

**冲突检测逻辑**

```cpp
// 检查教室是否在该时段已有课程
// 检查教师是否在该时段已有课程
// 检查指定周次是否冲突（考虑odd/even）
if (教室冲突 || 教师冲突) {
    return 409 Conflict;
}
```

#### 删除排课 - DELETE /api/schedules/:id

**响应 (204)** - 删除成功

### 可用教室查询 API

#### 查询空闲教室 - GET /api/available-classrooms

**查询参数**

| 参数 | 必需 | 说明 |
|------|------|------|
| weekday | ✓ | 星期几（1-7） |
| start_section | ✓ | 开始节次 |
| end_section | ✓ | 结束节次 |
| semester | | 学期，默认当前学期 |
| week | | 周次，默认第1周 |
| min_seats | | 最少座位数 |
| category | | 教室类型 |
| building | | 楼栋 |

**示例**

```http
GET /api/available-classrooms?weekday=2&start_section=3&end_section=4&min_seats=50
```

**响应 (200)**

```json
[
    {
        "id": 1,
        "classroom_code": "A101",
        "name": "A楼101",
        "building": "A楼",
        "seats": 120,
        "status": "available"
    },
    ...
]
```

### 课表查询 API

#### 获取教师课表 - GET /api/teachers/:id/timetable

**查询参数**

| 参数 | 说明 |
|------|------|
| semester | 学期，默认当前学期 |

**响应 (200)**

```json
[
    {
        "schedule_id": 1,
        "weekday": 1,
        "start_section": 1,
        "end_section": 2,
        "course_name": "程序设计基础",
        "classroom_name": "A楼101",
        "class_name": "计算机2021级1班"
    },
    ...
]
```

#### 获取学生课表 - GET /api/students/:id/timetable

**查询参数** - 同教师课表

**响应 (200)** - 同教师课表格式

### 课程管理 API

#### 获取课程列表 - GET /api/courses

**查询参数**

| 参数 | 说明 |
|------|------|
| semester | 学期 |
| teacher_id | 教师ID |

#### 创建课程 - POST /api/courses

**请求体**

```json
{
    "course_code": "CS401",
    "name": "高级算法",
    "teacher_id": 1,
    "credits": 3.0,
    "hours": 48,
    "course_type": "required",
    "capacity": 60,
    "semester": "2024-2025-1",
    "remark": "新增课程"
}
```

### 选课管理 API

#### 学生选课 - POST /api/enrollments

**请求体**

```json
{
    "student_id": 5,
    "course_id": 1,
    "semester": "2024-2025-1"
}
```

**成功响应 (200)**

```json
{
    "message": "选课成功"
}
```

**失败响应 (400)**

```json
{
    "error": "已选该课程" | "课程已满"
}
```

#### 学生退课 - PUT /api/enrollments/:id/drop

**响应 (200)**

```json
{
    "message": "退课成功"
}
```

### 教室预约 API

#### 创建预约 - POST /api/bookings

**请求体**

```json
{
    "classroom_id": 1,
    "applicant_id": 5,
    "booking_date": "2024-12-25",
    "start_section": 5,
    "end_section": 6,
    "purpose": "学术报告会"
}
```

**时间冲突检测**

```sql
SELECT id FROM booking 
WHERE classroom_id = ? 
AND booking_date = ? 
AND status IN ('pending', 'approved')
AND NOT (end_section < ? OR start_section > ?)
```

#### 审批预约 - PUT /api/bookings/:id/approve

**请求体**

```json
{
    "approved": true,  // 或 false 拒绝
    "approver_id": 1
}
```

### 统计分析 API

#### 教室利用率 - GET /api/statistics/utilization

**查询参数**

| 参数 | 说明 |
|------|------|
| semester | 学期 |

**响应 (200)**

```json
[
    {
        "classroom_id": 1,
        "classroom_code": "A101",
        "classroom_name": "A楼101",
        "seats": 120,
        "used_slots": 24,
        "utilization_rate": 40.0
    },
    ...
]
```

**利用率计算**

```
利用率 = (周一到周五使用的时间槽) / (5天 × 12节次) × 100%
```

### 排课建议 API

#### 获取排课建议 - GET /api/schedule-suggestion

**查询参数**

| 参数 | 必需 | 说明 |
|------|------|------|
| course_id | ✓ | 课程ID |
| semester | | 学期 |
| seats | | 所需座位数 |

**响应 (200)**

```json
[
    {
        "weekday": 1,
        "start_section": 1,
        "end_section": 2,
        "classroom_id": 1,
        "classroom_code": "A101",
        "seats": 120
    },
    ...
]
```

**排课建议算法**

```
FOR 每个工作日 (周一-周五)
    FOR 每个时间槽 (9:00-17:00)
        IF 教室空闲 AND 教师空闲 AND 座位充足
            添加到建议列表
        LIMIT 10条建议
```

---

## 前端实现

### 技术架构

**前端分层**

```
┌─────────────────────────────────┐
│      表现层 (UI Components)      │
│  ├─ 页面模板 (HTML)             │
│  ├─ 样式系统 (CSS)              │
│  └─ 交互动画 (Animation)        │
└─────────────────────────────────┘
            ↓
┌─────────────────────────────────┐
│     业务逻辑层 (JavaScript)      │
│  ├─ 数据处理                    │
│  ├─ 事件处理                    │
│  ├─ 状态管理                    │
│  └─ 权限验证                    │
└─────────────────────────────────┘
            ↓
┌─────────────────────────────────┐
│      通信层 (API Layer)          │
│  ├─ HTTP 请求                   │
│  ├─ 错误处理                    │
│  ├─ 重试机制                    │
│  └─ 响应拦截                   │
└─────────────────────────────────┘
            ↓
┌─────────────────────────────────┐
│    服务层 (Backend Services)    │
│  └─ RESTful API                 │
└─────────────────────────────────┘
```

### 关键代码模块

**API 通信模块**

```javascript
async function api(endpoint, options = {}, retryCount = 0) {
    const url = API_BASE + endpoint;
    const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options
    };
    
    // 超时控制（30秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    config.signal = controller.signal;
    
    try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ 
                error: response.statusText 
            }));
            throw new Error(error.error || '请求失败');
        }
        
        return response.status === 204 ? null : await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        
        // 网络错误重试（最多1次）
        if (retryCount < 1 && (
            error.name === 'AbortError' || 
            error.message === 'Failed to fetch'
        )) {
            await new Promise(r => setTimeout(r, 1000));
            return api(endpoint, options, retryCount + 1);
        }
        
        throw error;
    }
}
```

### 主要功能实现

**权限控制**

```javascript
function checkPermission(action) {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    
    const permissions = {
        'teacher': ['view', 'viewSchedule', 'viewTimetable'],
        'student': ['viewTimetable', 'viewAvailable']
    };
    
    return permissions[currentUser.role]?.includes(action) || false;
}

function updateUIByRole() {
    const role = currentUser?.role;
    
    if (role === 'student') {
        document.querySelectorAll('.nav-item[data-page="classrooms"]')
            .forEach(el => el.style.display = 'none');
        // 隐藏其他管理功能
    }
}
```

**主题切换**

```javascript
function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // 更新图表颜色
    updateChartColors();
}
```

**分页管理**

```javascript
const PAGE_SIZE = 10;
let paginationState = {
    classrooms: { page: 1, total: 0 },
    courses: { page: 1, total: 0 },
    // ...
};

function renderPagination(containerId, module, totalItems, loadFunction) {
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    const currentPage = paginationState[module].page;
    
    let html = '<ul class="pagination">';
    // 构建分页 HTML
    html += '</ul>';
    
    document.getElementById(containerId).innerHTML = html;
}

function paginateData(data, module) {
    const page = paginationState[module].page;
    const start = (page - 1) * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
}
```

**加载状态管理**

```javascript
let loadingCount = 0;

function showLoading(message = '加载中...') {
    loadingCount++;
    let overlay = document.getElementById('loadingOverlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p class="loading-text">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
}

function hideLoading() {
    if (--loadingCount <= 0) {
        loadingCount = 0;
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }
}
```

### 深色模式实现

```css
:root {
    --primary-color: #5c6bc0;
    --bg-primary: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
    --text-primary: #1a1f36;
}

[data-theme="dark"] {
    --bg-primary: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    --text-primary: #f0f0f0;
    --border-color: #3a3f5c;
}

[data-theme="dark"] body {
    background: var(--bg-primary);
}

[data-theme="dark"] .card {
    background: #1e2746 !important;
    border-color: var(--border-color);
}
```

---

## 后端实现

### C++ 代码结构

**HTTP 服务器框架**

```cpp
class HttpServer {
private:
    int port_;
    int server_socket_;
    std::map<std::string, std::function<void(const HttpRequest&, HttpResponse&)>> routes_;
    
public:
    void get(const std::string& path, RouteHandler handler);
    void post(const std::string& path, RouteHandler handler);
    void put(const std::string& path, RouteHandler handler);
    void del(const std::string& path, RouteHandler handler);
    
    void start();
    void stop();
};
```

**数据库连接管理**

```cpp
class Database {
private:
    MYSQL* conn_;
    bool connected_;
    std::mutex mutex_;
    std::string host_, user_, password_, database_;
    
public:
    static Database& getInstance();
    bool connect(const std::string& host, const std::string& user, ...);
    DbResult query(const std::string& sql);
    bool execute(const std::string& sql);
    
private:
    bool ensureConnected();  // 自动重连
};
```

**API 路由注册**

```cpp
int main() {
    HttpServer server(8080);
    Database& db = Database::getInstance();
    db.connect("localhost", "root", "@123Fengaoran", "classroom_system");
    
    // 认证
    server.post("/api/login", handleLogin);
    
    // 教室管理
    server.get("/api/classrooms", handleGetClassrooms);
    server.post("/api/classrooms", handleCreateClassroom);
    server.put("/api/classrooms/:id", handleUpdateClassroom);
    server.del("/api/classrooms/:id", handleDeleteClassroom);
    
    // 排课管理
    server.get("/api/schedules", handleGetSchedules);
    server.post("/api/schedules", handleCreateSchedule);  // 冲突检测
    
    // ... 更多路由
    
    server.start();
    return 0;
}
```

### 冲突检测算法

**时间冲突判定**

```cpp
bool checkScheduleConflict(
    const std::string& classroomId,
    const std::string& teacherId,
    const std::string& semester,
    const std::string& weekday,
    const std::string& startSection,
    const std::string& endSection,
    const std::string& startWeek,
    const std::string& endWeek
) {
    auto& db = Database::getInstance();
    
    // 检查教室冲突
    std::string sql = R"(
        SELECT COUNT(*) AS cnt FROM schedule 
        WHERE classroom_id = )" + classroomId + R"(
        AND semester = ')" + db.escape(semester) + R"('
        AND weekday = )" + weekday + R"(
        AND NOT (end_section < )" + startSection + R"( 
                 OR start_section > )" + endSection + R"()
        AND NOT (end_week < )" + startWeek + R"( 
                 OR start_week > )" + endWeek + R"()
    )";
    
    auto result = db.query(sql);
    if (!result.empty() && std::stoi(result[0]["cnt"]) > 0) {
        return true;  // 教室冲突
    }
    
    // 检查教师冲突（逻辑相同）
    // ...
    
    return false;
}

// 调用
if (checkScheduleConflict(...)) {
    res.setStatus(409);
    res.setJson("{\"error\": \"时间冲突\"}");
    return;
}
```

**时间段判定逻辑**

```
两个时间段冲突的条件：
┌─────────────────────┐
│ 原始时间段          │
│ [start1, end1]      │
└─────────────────────┘
        ↕ 检查与 [start2, end2] 是否重叠
┌─────────────────────┐
│ 新时间段            │
│ [start2, end2]      │
└─────────────────────┘

冲突判定：NOT (end1 < start2 OR start1 > end2)
        = (end1 >= start2 AND start1 <= end2)

即：起点早于对方的终点 AND 终点晚于对方的起点
```

### SQL 参数化查询

**防 SQL 注入**

```cpp
// ❌ 不安全：直接拼接用户输入
std::string sql = "SELECT * FROM user WHERE username = '" + username + "'";

// ✓ 安全：使用转义函数
std::string escaped_username = db.escape(username);
std::string sql = "SELECT * FROM user WHERE username = '" + escaped_username + "'";

// db.escape() 实现
std::string Database::escape(const std::string& str) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (!conn_) return str;
    
    std::vector<char> buffer(str.size() * 2 + 1);
    mysql_real_escape_string(conn_, buffer.data(), str.c_str(), str.size());
    return std::string(buffer.data());
}
```

### 线程安全

**互斥锁保护数据库连接**

```cpp
class Database {
private:
    mutable std::mutex mutex_;
    
public:
    DbResult query(const std::string& sql) {
        std::lock_guard<std::mutex> lock(mutex_);  // RAII 自动加锁
        
        if (!ensureConnected()) return DbResult();
        if (mysql_query(conn_, sql.c_str()) != 0) return DbResult();
        
        // ... 处理结果
        
        return result;
    }  // lock_guard 自动解锁
};
```

---

## 部署指南

### 环境要求

- **操作系统**: macOS / Linux / Windows (WSL)
- **编译器**: GCC 7+ 或 Clang 6+（支持 C++17）
- **CMake**: 3.10+
- **MySQL**: 8.0+
- **依赖库**: libmysqlclient

### 安装步骤

#### 1. 安装依赖（macOS）

```bash
# 使用 Homebrew
brew install cmake mysql

# 启动 MySQL 服务
brew services start mysql

# 首次设置 root 密码
mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '@123Fengaoran';"
```

#### 2. 初始化数据库

```bash
# 登录 MySQL
mysql -u root -p
# 输入密码: @123Fengaoran

# 在 MySQL 命令行中执行
source /path/to/sys/database/init.sql;
source /path/to/sys/database/more_data.sql;

# 或者直接从命令行执行
mysql -u root -p@123Fengaoran < sys/database/init.sql
```

#### 3. 编译后端

```bash
cd sys/server

# 创建构建目录
mkdir build && cd build

# CMake 生成 Makefile
cmake ..

# 编译
make

# 输出: classroom_server (可执行文件)
```

#### 4. 配置连接参数

编辑 `sys/server/src/main.cpp`，修改数据库连接参数：

```cpp
int main() {
    auto& db = Database::getInstance();
    // 修改这里的连接参数
    if (!db.connect("localhost", "root", "@123Fengaoran", "classroom_system", 3306)) {
        std::cerr << "数据库连接失败" << std::endl;
        return 1;
    }
    
    HttpServer server(8080);  // 修改端口
    server.start();
    return 0;
}
```

#### 5. 运行系统

```bash
# 进入 build 目录
cd sys/server/build

# 运行服务器
./classroom_server

# 输出
# ===== 教室资源管理系统后端 =====
# API文档: http://localhost:8080/api
# 前端页面: http://localhost:8080
# 按 Ctrl+C 退出
```

#### 6. 访问系统

- **前端**: <http://localhost:8080>
- **默认账户**:
  - 管理员: admin / admin123
  - 教师: teacher1 / 123456
  - 学生: student1 / 123456

### Docker 部署

**Dockerfile**

```dockerfile
FROM ubuntu:20.04

# 安装依赖
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    mysql-client \
    libmysqlclient-dev

# 复制代码
COPY sys /app

# 构建
WORKDIR /app/server/build
RUN cmake .. && make

# 运行
EXPOSE 8080
CMD ["/app/server/build/classroom_server"]
```

**docker-compose.yml**

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: "@123Fengaoran"
      MYSQL_DATABASE: classroom_system
    ports:
      - "3306:3306"
    volumes:
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql

  server:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      - mysql
    environment:
      DB_HOST: mysql
      DB_USER: root
      DB_PASSWORD: "@123Fengaoran"
```

### Nginx 反向代理

**nginx.conf**

```nginx
upstream classroom_server {
    server localhost:8080;
}

server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://classroom_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api {
        proxy_pass http://classroom_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 开发规范

### 命名规范

**变量命名**

```cpp
// 常量：大写 + 下划线
const int MAX_CLASSROOM_CODE_LENGTH = 50;
const std::string DEFAULT_SEMESTER = "2024-2025-1";

// 类成员：带 _ 后缀
class Database {
private:
    MYSQL* conn_;
    bool connected_;
};

// 函数名：驼峰命名法
bool checkScheduleConflict(...);
std::string getWeekdayName(int weekday);
```

**SQL 命名**

```sql
-- 表名：小写
CREATE TABLE classroom ...
CREATE TABLE schedule ...

-- 字段名：小写 + 下划线
CREATE TABLE schedule (
    id INT,
    course_id INT,
    classroom_id INT,
    start_section TINYINT,
    end_section TINYINT
);

-- 索引：idx_表名_字段名
KEY idx_classroom_code (classroom_code),
KEY idx_schedule_time (semester, weekday, start_section)
```

### 代码风格

**注释规范**

```cpp
// ========== 功能模块名 ==========
// 这是一个单行注释

/*
    这是一个多行注释
    用于说明复杂逻辑
*/

// 函数说明
// 参数: courseId - 课程ID，classroomId - 教室ID
// 返回: 是否冲突（true 表示有冲突）
bool checkScheduleConflict(int courseId, int classroomId) { ... }
```

**代码格式**

```cpp
// 缩进：4 个空格或 1 个制表符
if (condition) {
    doSomething();
}

// 大括号位置：同一行
void function() {
    // 代码
}

// 复杂条件：分行显示
if (condition1 &&
    condition2 &&
    condition3) {
    // 代码
}
```

### 错误处理

**API 错误响应标准**

```cpp
// 400 Bad Request - 请求参数错误
res.setStatus(400);
res.setJson("{\"error\": \"缺少必要参数\"}");

// 401 Unauthorized - 未授权
res.setStatus(401);
res.setJson("{\"error\": \"用户名或密码错误\"}");

// 404 Not Found - 资源不存在
res.setStatus(404);
res.setJson("{\"error\": \"教室不存在\"}");

// 409 Conflict - 业务冲突
res.setStatus(409);
res.setJson("{\"error\": \"时间冲突\"}");

// 500 Internal Server Error - 服务器错误
res.setStatus(500);
res.setJson("{\"error\": \"服务器内部错误\"}");
```

### 测试规范

**单元测试示例**

```cpp
#include <cassert>

void testCheckScheduleConflict() {
    // 测试情况 1：完全相同的时间
    assert(checkScheduleConflict(1, 1, "2024-2025-1", 1, 1, 2, 1, 16) == true);
    
    // 测试情况 2：完全不同的时间
    assert(checkScheduleConflict(1, 1, "2024-2025-1", 1, 10, 12, 1, 16) == false);
    
    // 测试情况 3：部分重叠
    assert(checkScheduleConflict(1, 1, "2024-2025-1", 1, 1, 3, 1, 16) == true);
    
    std::cout << "All tests passed!" << std::endl;
}
```

---

## 常见问题

### 1. 无法连接到数据库

**症状**: `MySQL连接失败: Can't connect to MySQL server`

**解决方案**:

```bash
# 检查 MySQL 是否运行
brew services list | grep mysql

# 启动 MySQL
brew services start mysql

# 测试连接
mysql -u root -p -h localhost
# 输入密码: @123Fengaoran

# 检查端口是否被占用
lsof -i :3306
```

### 2. 前端无法访问后端 API

**症状**: `Failed to fetch` 或 `CORS 错误`

**解决方案**:

```cpp
// 确保在 HTTP 响应中设置 CORS 头
oss << "Access-Control-Allow-Origin: *\r\n";
oss << "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n";
oss << "Access-Control-Allow-Headers: Content-Type\r\n";
```

### 3. 登录显示"用户名或密码错误"

**原因**: 密码使用 SHA2(password, 256) 哈希

**检查**:

```sql
-- 查看用户是否存在
SELECT * FROM user WHERE username = 'admin';

-- 密码重置
UPDATE user SET password_hash = SHA2('admin123', 256) WHERE username = 'admin';
```

### 4. 排课时显示"教师冲突"但实际没有

**可能原因**: 周次计算错误或 week_type 判定错误

**检查逻辑**:

```sql
-- 查看该教师在该时段的所有课程
SELECT * FROM schedule 
WHERE teacher_id = ? 
AND semester = ? 
AND weekday = ? 
AND NOT (end_section < ? OR start_section > ?)
AND NOT (end_week < ? OR start_week > ?);
```

### 5. 深色模式下看不到某些文字

**解决方案**: 更新 CSS 深色模式样式

```css
[data-theme="dark"] .your-element {
    color: #e0e0e0;  /* 浅色文字 */
    background: #252d44;  /* 深色背景 */
}
```

---

## 性能优化

### 数据库优化

**索引策略**

```sql
-- 频繁查询的字段建立索引
CREATE INDEX idx_classroom_code ON classroom(classroom_code);
CREATE INDEX idx_schedule_time ON schedule(semester, weekday, start_section);

-- 复合索引用于多条件查询
CREATE INDEX idx_schedule_classroom_semester ON schedule(classroom_id, semester);

-- 避免过多索引影响写入性能
-- 定期分析慢查询日志
```

**查询优化**

```sql
-- ❌ 低效：N+1 查询
SELECT * FROM classroom;
FOR EACH classroom {
    SELECT * FROM equipment WHERE classroom_id = ?;
}

-- ✓ 高效：JOIN 查询
SELECT c.*, e.* FROM classroom c 
LEFT JOIN equipment e ON c.id = e.classroom_id;

-- ✓ 高效：使用视图
SELECT * FROM v_schedule_detail WHERE teacher_id = ?;
```

**连接池管理**

```cpp
// 后端应实现连接复用而非每次新建
// 现有实现使用单例模式
auto& db = Database::getInstance();
db.connect(...);  // 仅初始化一次
db.query(...);    // 复用连接
```

### 前端优化

**懒加载**

```javascript
// 分页加载数据而非一次加载所有
const PAGE_SIZE = 10;
async function loadClassrooms(page = 1) {
    const start = (page - 1) * PAGE_SIZE;
    const data = await api(`/classrooms?page=${page}`);
    renderTable(data);
}
```

**缓存策略**

```javascript
// 缓存用户信息和权限
localStorage.setItem('user', JSON.stringify(currentUser));
localStorage.setItem('token', token);

// 使用 CDN 加速静态资源
// 使用浏览器缓存策略
```

**减小传输体积**

```javascript
// 仅传输必要字段
const result = await api(`/classrooms?fields=id,code,name,seats`);

// 压缩 JSON 响应
// 使用 Gzip 压缩
```

### 后端优化

**避免全表扫描**

```cpp
// ❌ 低效
auto result = db.query("SELECT * FROM schedule");
for (auto& row : result) {
    if (row["classroom_id"] == classroom_id) { /* ... */ }
}

// ✓ 高效
auto result = db.query("SELECT * FROM schedule WHERE classroom_id = " + classroom_id);
```

**批量操作**

```cpp
// ❌ 低效：多次 INSERT
INSERT INTO enrollment VALUES (1, 1, '2024-2025-1');
INSERT INTO enrollment VALUES (2, 1, '2024-2025-1');
INSERT INTO enrollment VALUES (3, 1, '2024-2025-1');

// ✓ 高效：批量 INSERT
INSERT INTO enrollment VALUES 
    (1, 1, '2024-2025-1'),
    (2, 1, '2024-2025-1'),
    (3, 1, '2024-2025-1');
```

### 监控指标

**关键性能指标 (KPI)**

| 指标 | 目标 | 监控方法 |
|------|------|--------|
| API 响应时间 | < 200ms | 前端记录 |
| 数据库查询时间 | < 100ms | MySQL slow log |
| 页面加载时间 | < 2s | Chrome DevTools |
| CPU 占用率 | < 50% | top / htop |
| 内存占用 | < 200MB | 内存监控 |
| 并发用户 | > 100 | 压力测试 |

**性能测试工具**

```bash
# Apache Bench
ab -n 1000 -c 10 http://localhost:8080/

# wrk
wrk -t12 -c400 -d30s http://localhost:8080/

# 数据库慢查询
mysql> SET GLOBAL slow_query_log = 'ON';
mysql> SET GLOBAL long_query_time = 1;
```

---

## 附录

### 数据库初始数据

系统预装的测试数据见 `database/more_data.sql`

**默认用户**

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 管理员 | 系统管理员 |
| teacher1 | 123456 | 教师 | 张三老师 |
| teacher2 | 123456 | 教师 | 李四老师 |
| student1 | 123456 | 学生 | 王同学 |
| student2 | 123456 | 学生 | 李同学 |

**测试教室**

| 编号 | 名称 | 楼栋 | 座位 | 类别 | 设备 |
|------|------|------|------|------|------|
| A101 | A楼101 | A楼 | 120 | 大教室 | 投影仪、电脑、空调 |
| A102 | A楼102 | A楼 | 60 | 中教室 | 投影仪、白板 |
| A201 | A楼201 | A楼 | 200 | 阶梯教室 | 投影仪、麦克风 |
| B101 | B楼101 | B楼 | 40 | 小教室 | 黑板 |
| B102 | B楼102 | B楼 | 50 | 实验室 | 计算机 |
| C301 | C楼301 | C楼 | 20 | 会议室 | 多媒体 |

### 文件清单

```
sys/
├── database/
│   ├── init.sql              (初始化脚本)
│   └── more_data.sql         (测试数据)
├── server/
│   ├── include/
│   │   ├── db.hpp
│   │   ├── http_server.hpp
│   │   └── json.hpp
│   ├── src/
│   │   ├── db.cpp
│   │   ├── http_server.cpp
│   │   └── main.cpp          (1320 行代码)
│   ├── CMakeLists.txt
│   └── build/
│       └── classroom_server  (可执行文件)
├── frontend/
│   ├── index.html            (3921 行代码)
│   ├── app.js                (3315 行代码)
│   └── favicon.ico
├── README.md                 (项目说明)
├── TECHNICAL_DOCUMENTATION.md (本文件)
├── requirement.txt           (项目需求)
└── run.txt                   (运行说明)
```

### 开发资源

**参考链接**

- [MySQL C API](https://dev.mysql.com/doc/c-api/8.0/en/)
- [Bootstrap 5 文档](https://getbootstrap.com/docs/5.0/)
- [Chart.js 文档](https://www.chartjs.org/docs/)
- [MDN Web 文档](https://developer.mozilla.org/)

**联系方式**

- 作者: FengRR
- 更新日期: 2025年12月19日
- License: 见 LICENSE.txt

---

**文档完成时间**: 2025年12月19日
**最后更新**: 2025年12月19日
**版本**: 1.0.0
