# 教室资源管理系统

一个基于 C++ 后端 + MySQL 数据库 + Web 前端的教室资源管理系统。

## 系统功能

### 核心功能

- **教室管理**: 教室信息的增删改查，支持按楼栋、类型、座位数筛选
- **课程管理**: 课程信息管理，关联教师信息
- **排课管理**: 智能排课，自动检测时间冲突（教室冲突、教师冲突）
- **课表查询**: 支持教师课表、教室课表查询
- **空闲教室查询**: 根据时间段查询可用教室
- **统计分析**: 教室利用率统计分析

### 系统特点

- 🎨 现代化 UI 设计，包含过渡动画
- 👥 支持管理员/教师端和学生端
- 📊 数据可视化统计
- 🔄 自动冲突检测

## 技术栈

- **后端**: C++17 + 自定义 HTTP 服务器
- **数据库**: MySQL 8.0+
- **前端**: HTML5 + CSS3 + JavaScript + Bootstrap 5
- **图表**: Chart.js

## 目录结构

```bash
sys/
├── database/
│   └── init.sql          # 数据库初始化脚本
├── server/
│   ├── include/
│   │   ├── db.hpp        # 数据库封装
│   │   ├── http_server.hpp  # HTTP服务器
│   │   └── json.hpp      # JSON工具
│   ├── src/
│   │   ├── db.cpp        # 数据库实现
│   │   ├── http_server.cpp  # HTTP服务器实现
│   │   └── main.cpp      # 主程序（API路由）
│   └── CMakeLists.txt    # CMake构建配置
├── frontend/
│   ├── index.html        # 前端页面
│   └── app.js            # 前端逻辑
└── README.md             # 说明文档
```

## 环境要求

- CMake 3.10+
- GCC 7+ / Clang 6+ (支持 C++17)
- MySQL 8.0+
- MySQL C Connector (libmysqlclient)

## 安装配置

### 1. 安装依赖 (macOS)

```bash
# 安装 MySQL
brew install mysql

# 启动 MySQL 服务
brew services start mysql

# 设置 root 密码
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY '@123Fengaoran';
```

### 2. 初始化数据库

```bash
mysql -u root -p < database/init.sql
# 输入密码: @123Fengaoran
```

### 3. 编译后端

```bash
cd server
mkdir build && cd build
cmake ..
make
```

### 4. 运行系统

```bash
# 在 build 目录下运行
./classroom_server
```

服务器启动后访问: <http://localhost:8080>

## API 接口

### 认证

- `POST /api/login` - 用户登录

### 教室管理

- `GET /api/classrooms` - 获取教室列表
- `GET /api/classrooms/:id` - 获取教室详情
- `POST /api/classrooms` - 新增教室
- `PUT /api/classrooms/:id` - 更新教室
- `DELETE /api/classrooms/:id` - 删除教室

### 课程管理

- `GET /api/courses` - 获取课程列表
- `GET /api/courses/:id` - 获取课程详情
- `POST /api/courses` - 新增课程
- `PUT /api/courses/:id` - 更新课程
- `DELETE /api/courses/:id` - 删除课程

### 排课管理

- `GET /api/schedules` - 获取排课列表
- `POST /api/schedules` - 新增排课（自动检测冲突）
- `DELETE /api/schedules/:id` - 删除排课

### 课表查询

- `GET /api/teachers/:id/timetable` - 获取教师课表

### 空闲教室

- `GET /api/available-classrooms` - 查询空闲教室

### 统计

- `GET /api/statistics/utilization` - 教室利用率统计

## 默认账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| teacher1 | 123456 | 教师 |
| student1 | 123456 | 学生 |

## 使用说明

### 教师/管理员端

1. 使用管理员或教师账号登录
2. 可以进行教室、课程、排课的管理
3. 查看课表和统计数据

### 学生端

1. 使用学生账号登录
2. 可以查询课表
3. 查询空闲教室

## 开发说明

### 数据库配置

在 `server/src/main.cpp` 中修改数据库连接信息：

```cpp
db.connect("localhost", "root", "@123Fengaoran", "classroom_system", 3306);
```

### 端口配置

默认端口为 8080，可在 `main.cpp` 中修改：

```cpp
server.start(8080);
```

## 截图

系统包含以下主要页面：

- 登录页面（带渐变背景和动画效果）
- 仪表盘（统计概览 + 图表）
- 教室管理（表格 + 筛选 + CRUD）
- 课程管理
- 排课管理（智能排课）
- 课表查询（周视图）
- 空闲教室查询
- 统计分析（利用率）

## License

LICENSE AGREEMENT
Copyright (C) 2025 FengRR. All Rights Reserved.

1. OWNERSHIP
   This software and its source code are the exclusive property of FengRR.
   本软件及其源代码均为 FengRR 的私有财产。

2. RESTRICTIONS
   - Unauthorized copying, distribution, modification, or commercial use of this software is strictly prohibited.
   - 严禁未经授权的复制、分发、修改或商业使用。
   - It is forbidden to bypass, reverse engineer, or tamper with the security certificate mechanism included in this software.
   - 禁止绕过、反向工程或篡改本软件中包含的安全证书机制。

3. SECURITY
   This software is protected by a technical security lock. Usage is permitted only with a valid 'security.lic' certificate issued by the author.
   本软件受技术安全锁保护，仅允许持有作者颁发的有效 'security.lic' 证书时使用。

4. DISCLAIMER
   THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
