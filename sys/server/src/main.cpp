#include "http_server.hpp"
#include "db.hpp"
#include "json.hpp"
#include <iostream>
#include <cstdlib>
#include <signal.h>

HttpServer* g_server = nullptr;

void signalHandler(int sig) {
    std::cout << "\n正在关闭服务器..." << std::endl;
    if (g_server) {
        g_server->stop();
    }
    exit(0);
}

// ========== 工具函数 ==========
std::string getCurrentSemester() {
    return "2024-2025-1";  // 实际应该根据日期计算
}

// ========== API处理函数 ==========

// 登录
void handleLogin(const HttpRequest& req, HttpResponse& res) {
    auto params = Json::parse(req.body);
    std::string username = params["username"];
    std::string password = params["password"];
    
    auto& db = Database::getInstance();
    std::string sql = "SELECT id, username, role, real_name FROM user WHERE username = '" 
                    + db.escape(username) + "' AND password_hash = SHA2('" + db.escape(password) + "', 256)";
    
    auto result = db.query(sql);
    if (result.empty()) {
        res.setStatus(401);
        res.setJson("{\"error\": \"用户名或密码错误\"}");
        return;
    }
    
    // 简单token（实际应用应使用JWT）
    std::string token = "token_" + result[0]["id"] + "_" + std::to_string(time(nullptr));
    
    std::map<std::string, std::string> data;
    data["token"] = Json::string(token);
    data["user"] = Json::fromDbRow(result[0]);
    res.setJson(Json::object(data));
}

// ========== 教室管理 ==========
void handleGetClassrooms(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto queryParams = req.parseQuery();
    
    std::string sql = "SELECT * FROM classroom WHERE 1=1";
    
    // 筛选条件
    if (queryParams.count("category") && !queryParams["category"].empty()) {
        sql += " AND category = '" + db.escape(queryParams["category"]) + "'";
    }
    if (queryParams.count("building") && !queryParams["building"].empty()) {
        sql += " AND building = '" + db.escape(queryParams["building"]) + "'";
    }
    if (queryParams.count("minSeats") && !queryParams["minSeats"].empty()) {
        sql += " AND seats >= " + queryParams["minSeats"];
    }
    if (queryParams.count("status") && !queryParams["status"].empty()) {
        sql += " AND status = '" + db.escape(queryParams["status"]) + "'";
    }
    
    sql += " ORDER BY classroom_code";
    
    auto result = db.query(sql);
    res.setJson(Json::fromDbResult(result));
}

void handleGetClassroom(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    
    auto result = db.query("SELECT * FROM classroom WHERE id = " + id);
    if (result.empty()) {
        res.setStatus(404);
        res.setJson("{\"error\": \"教室不存在\"}");
        return;
    }
    
    // 同时获取设备信息
    auto equipment = db.query("SELECT * FROM equipment WHERE classroom_id = " + id);
    
    std::map<std::string, std::string> data;
    for (const auto& [key, value] : result[0]) {
        if (key == "id" || key == "seats" || key == "floor") {
            data[key] = value.empty() ? "null" : value;
        } else {
            data[key] = Json::string(value);
        }
    }
    data["equipments"] = Json::fromDbResult(equipment);
    
    res.setJson(Json::object(data));
}

void handleCreateClassroom(const HttpRequest& req, HttpResponse& res) {
    auto params = Json::parse(req.body);
    auto& db = Database::getInstance();
    
    std::string sql = "INSERT INTO classroom (classroom_code, name, building, floor, location, category, seats, orientation, status, remark) VALUES ('"
        + db.escape(params["classroom_code"]) + "', '"
        + db.escape(params["name"]) + "', '"
        + db.escape(params["building"]) + "', "
        + (params["floor"].empty() ? "NULL" : params["floor"]) + ", '"
        + db.escape(params["location"]) + "', '"
        + db.escape(params["category"]) + "', "
        + params["seats"] + ", '"
        + db.escape(params["orientation"]) + "', '"
        + (params["status"].empty() ? "available" : db.escape(params["status"])) + "', '"
        + db.escape(params["remark"]) + "')";
    
    if (db.execute(sql)) {
        res.setStatus(201);
        res.setJson("{\"id\": " + std::to_string(db.lastInsertId()) + ", \"message\": \"创建成功\"}");
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"创建失败: " + db.getError() + "\"}");
    }
}

void handleUpdateClassroom(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto params = Json::parse(req.body);
    auto& db = Database::getInstance();
    
    std::string sql = "UPDATE classroom SET "
        "name = '" + db.escape(params["name"]) + "', "
        "building = '" + db.escape(params["building"]) + "', "
        "floor = " + (params["floor"].empty() ? "NULL" : params["floor"]) + ", "
        "location = '" + db.escape(params["location"]) + "', "
        "category = '" + db.escape(params["category"]) + "', "
        "seats = " + params["seats"] + ", "
        "orientation = '" + db.escape(params["orientation"]) + "', "
        "status = '" + db.escape(params["status"]) + "', "
        "remark = '" + db.escape(params["remark"]) + "' "
        "WHERE id = " + id;
    
    if (db.execute(sql)) {
        res.setJson("{\"message\": \"更新成功\"}");
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"更新失败\"}");
    }
}

void handleDeleteClassroom(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    
    if (db.execute("DELETE FROM classroom WHERE id = " + id)) {
        res.setStatus(204);
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"删除失败\"}");
    }
}

// ========== 设备管理 ==========
void handleGetEquipments(const HttpRequest& req, HttpResponse& res) {
    std::string classroomId = req.params.at("classroomId");
    auto& db = Database::getInstance();
    
    auto result = db.query("SELECT * FROM equipment WHERE classroom_id = " + classroomId);
    res.setJson(Json::fromDbResult(result));
}

void handleCreateEquipment(const HttpRequest& req, HttpResponse& res) {
    std::string classroomId = req.params.at("classroomId");
    auto params = Json::parse(req.body);
    auto& db = Database::getInstance();
    
    std::string sql = "INSERT INTO equipment (classroom_id, equipment_type, equipment_name, brand, model, quantity, status, remark) VALUES ("
        + classroomId + ", '"
        + db.escape(params["equipment_type"]) + "', '"
        + db.escape(params["equipment_name"]) + "', '"
        + db.escape(params["brand"]) + "', '"
        + db.escape(params["model"]) + "', "
        + (params["quantity"].empty() ? "1" : params["quantity"]) + ", '"
        + (params["status"].empty() ? "normal" : db.escape(params["status"])) + "', '"
        + db.escape(params["remark"]) + "')";
    
    if (db.execute(sql)) {
        res.setStatus(201);
        res.setJson("{\"id\": " + std::to_string(db.lastInsertId()) + "}");
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"创建失败\"}");
    }
}

void handleDeleteEquipment(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    
    if (db.execute("DELETE FROM equipment WHERE id = " + id)) {
        res.setStatus(204);
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"删除失败\"}");
    }
}

// ========== 课程管理 ==========
void handleGetCourses(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto queryParams = req.parseQuery();
    
    std::string sql = R"(
        SELECT c.*, t.name AS teacher_name, t.teacher_code 
        FROM course c 
        LEFT JOIN teacher t ON c.teacher_id = t.id 
        WHERE 1=1
    )";
    
    if (queryParams.count("semester") && !queryParams["semester"].empty()) {
        sql += " AND c.semester = '" + db.escape(queryParams["semester"]) + "'";
    }
    if (queryParams.count("teacher_id") && !queryParams["teacher_id"].empty()) {
        sql += " AND c.teacher_id = " + queryParams["teacher_id"];
    }
    
    sql += " ORDER BY c.course_code";
    
    auto result = db.query(sql);
    res.setJson(Json::fromDbResult(result));
}

void handleCreateCourse(const HttpRequest& req, HttpResponse& res) {
    auto params = Json::parse(req.body);
    auto& db = Database::getInstance();
    
    std::string sql = "INSERT INTO course (course_code, name, teacher_id, credits, hours, course_type, capacity, semester, remark) VALUES ('"
        + db.escape(params["course_code"]) + "', '"
        + db.escape(params["name"]) + "', "
        + (params["teacher_id"].empty() ? "NULL" : params["teacher_id"]) + ", "
        + (params["credits"].empty() ? "NULL" : params["credits"]) + ", "
        + (params["hours"].empty() ? "NULL" : params["hours"]) + ", '"
        + (params["course_type"].empty() ? "required" : db.escape(params["course_type"])) + "', "
        + (params["capacity"].empty() ? "NULL" : params["capacity"]) + ", '"
        + db.escape(params["semester"]) + "', '"
        + db.escape(params["remark"]) + "')";
    
    if (db.execute(sql)) {
        res.setStatus(201);
        res.setJson("{\"id\": " + std::to_string(db.lastInsertId()) + "}");
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"创建失败: " + db.getError() + "\"}");
    }
}

// ========== 排课管理 ==========
void handleGetSchedules(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto queryParams = req.parseQuery();
    
    std::string sql = "SELECT * FROM v_schedule_detail WHERE 1=1";
    
    if (queryParams.count("semester") && !queryParams["semester"].empty()) {
        sql += " AND semester = '" + db.escape(queryParams["semester"]) + "'";
    }
    if (queryParams.count("classroom_id") && !queryParams["classroom_id"].empty()) {
        sql += " AND classroom_code = (SELECT classroom_code FROM classroom WHERE id = " + queryParams["classroom_id"] + ")";
    }
    if (queryParams.count("teacher_id") && !queryParams["teacher_id"].empty()) {
        sql += " AND teacher_code = (SELECT teacher_code FROM teacher WHERE id = " + queryParams["teacher_id"] + ")";
    }
    if (queryParams.count("weekday") && !queryParams["weekday"].empty()) {
        sql += " AND weekday = " + queryParams["weekday"];
    }
    
    sql += " ORDER BY weekday, start_section";
    
    auto result = db.query(sql);
    res.setJson(Json::fromDbResult(result));
}

// 冲突检测
bool checkScheduleConflict(const std::string& classroomId, const std::string& teacherId,
                           const std::string& semester, const std::string& weekday,
                           const std::string& startSection, const std::string& endSection,
                           const std::string& startWeek, const std::string& endWeek,
                           const std::string& excludeId = "") {
    auto& db = Database::getInstance();
    
    // 检查教室冲突
    std::string sql = R"(
        SELECT COUNT(*) AS cnt FROM schedule 
        WHERE classroom_id = )" + classroomId + R"(
        AND semester = ')" + db.escape(semester) + R"('
        AND weekday = )" + weekday + R"(
        AND NOT (end_section < )" + startSection + R"( OR start_section > )" + endSection + R"()
        AND NOT (end_week < )" + startWeek + R"( OR start_week > )" + endWeek + R"()
    )";
    
    if (!excludeId.empty()) {
        sql += " AND id != " + excludeId;
    }
    
    auto result = db.query(sql);
    if (!result.empty() && std::stoi(result[0]["cnt"]) > 0) {
        return true;  // 有冲突
    }
    
    // 检查教师冲突
    sql = R"(
        SELECT COUNT(*) AS cnt FROM schedule 
        WHERE teacher_id = )" + teacherId + R"(
        AND semester = ')" + db.escape(semester) + R"('
        AND weekday = )" + weekday + R"(
        AND NOT (end_section < )" + startSection + R"( OR start_section > )" + endSection + R"()
        AND NOT (end_week < )" + startWeek + R"( OR start_week > )" + endWeek + R"()
    )";
    
    if (!excludeId.empty()) {
        sql += " AND id != " + excludeId;
    }
    
    result = db.query(sql);
    if (!result.empty() && std::stoi(result[0]["cnt"]) > 0) {
        return true;  // 有冲突
    }
    
    return false;
}

void handleCreateSchedule(const HttpRequest& req, HttpResponse& res) {
    auto params = Json::parse(req.body);
    auto& db = Database::getInstance();
    
    // 冲突检测
    if (checkScheduleConflict(params["classroom_id"], params["teacher_id"], params["semester"],
                              params["weekday"], params["start_section"], params["end_section"],
                              params["start_week"], params["end_week"])) {
        res.setStatus(409);
        res.setJson("{\"error\": \"时间冲突：教室或教师在该时段已有安排\"}");
        return;
    }
    
    std::string sql = "INSERT INTO schedule (course_id, classroom_id, teacher_id, class_id, semester, weekday, start_section, end_section, start_week, end_week, week_type, remark) VALUES ("
        + params["course_id"] + ", "
        + params["classroom_id"] + ", "
        + params["teacher_id"] + ", "
        + (params["class_id"].empty() ? "NULL" : params["class_id"]) + ", '"
        + db.escape(params["semester"]) + "', "
        + params["weekday"] + ", "
        + params["start_section"] + ", "
        + params["end_section"] + ", "
        + params["start_week"] + ", "
        + params["end_week"] + ", '"
        + (params["week_type"].empty() ? "all" : db.escape(params["week_type"])) + "', '"
        + db.escape(params["remark"]) + "')";
    
    if (db.execute(sql)) {
        res.setStatus(201);
        res.setJson("{\"id\": " + std::to_string(db.lastInsertId()) + ", \"message\": \"排课成功\"}");
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"创建失败: " + db.getError() + "\"}");
    }
}

void handleDeleteSchedule(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    
    if (db.execute("DELETE FROM schedule WHERE id = " + id)) {
        res.setStatus(204);
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"删除失败\"}");
    }
}

// ========== 可用教室查询 ==========
void handleGetAvailableClassrooms(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto queryParams = req.parseQuery();
    
    std::string semester = queryParams.count("semester") ? queryParams["semester"] : getCurrentSemester();
    std::string weekday = queryParams["weekday"];
    std::string startSection = queryParams["start_section"];
    std::string endSection = queryParams["end_section"];
    std::string week = queryParams.count("week") ? queryParams["week"] : "1";
    
    if (weekday.empty() || startSection.empty() || endSection.empty()) {
        res.setStatus(400);
        res.setJson("{\"error\": \"缺少参数：weekday, start_section, end_section\"}");
        return;
    }
    
    std::string sql = R"(
        SELECT c.* FROM classroom c
        WHERE c.status = 'available'
        AND c.id NOT IN (
            SELECT s.classroom_id FROM schedule s
            WHERE s.semester = ')" + db.escape(semester) + R"('
            AND s.weekday = )" + weekday + R"(
            AND NOT (s.end_section < )" + startSection + R"( OR s.start_section > )" + endSection + R"()
            AND s.start_week <= )" + week + R"( AND s.end_week >= )" + week + R"(
            AND (s.week_type = 'all' OR 
                 (s.week_type = 'odd' AND )" + week + R"( % 2 = 1) OR
                 (s.week_type = 'even' AND )" + week + R"( % 2 = 0))
        )
    )";
    
    // 额外筛选条件
    if (queryParams.count("min_seats") && !queryParams["min_seats"].empty()) {
        sql += " AND c.seats >= " + queryParams["min_seats"];
    }
    if (queryParams.count("category") && !queryParams["category"].empty()) {
        sql += " AND c.category = '" + db.escape(queryParams["category"]) + "'";
    }
    if (queryParams.count("building") && !queryParams["building"].empty()) {
        sql += " AND c.building = '" + db.escape(queryParams["building"]) + "'";
    }
    
    sql += " ORDER BY c.building, c.classroom_code";
    
    auto result = db.query(sql);
    res.setJson(Json::fromDbResult(result));
}

// ========== 教师/学生管理 ==========
void handleGetTeachers(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto result = db.query("SELECT * FROM teacher ORDER BY teacher_code");
    res.setJson(Json::fromDbResult(result));
}

void handleGetStudents(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto queryParams = req.parseQuery();
    
    std::string sql = "SELECT * FROM student WHERE 1=1";
    if (queryParams.count("class_name") && !queryParams["class_name"].empty()) {
        sql += " AND class_name = '" + db.escape(queryParams["class_name"]) + "'";
    }
    sql += " ORDER BY student_code";
    
    auto result = db.query(sql);
    res.setJson(Json::fromDbResult(result));
}

// ========== 课表查询 ==========
void handleGetTeacherTimetable(const HttpRequest& req, HttpResponse& res) {
    std::string teacherId = req.params.at("id");
    auto& db = Database::getInstance();
    auto queryParams = req.parseQuery();
    
    std::string semester = queryParams.count("semester") ? queryParams["semester"] : getCurrentSemester();
    
    std::string sql = R"(
        SELECT * FROM v_schedule_detail 
        WHERE teacher_code = (SELECT teacher_code FROM teacher WHERE id = )" + teacherId + R"()
        AND semester = ')" + db.escape(semester) + R"('
        ORDER BY weekday, start_section
    )";
    
    auto result = db.query(sql);
    res.setJson(Json::fromDbResult(result));
}

void handleGetStudentTimetable(const HttpRequest& req, HttpResponse& res) {
    std::string studentId = req.params.at("id");
    auto& db = Database::getInstance();
    auto queryParams = req.parseQuery();
    
    std::string semester = queryParams.count("semester") ? queryParams["semester"] : getCurrentSemester();
    
    // 通过选课记录获取课表
    std::string sql = R"(
        SELECT vsd.* FROM v_schedule_detail vsd
        JOIN enrollment e ON vsd.course_code = (SELECT course_code FROM course WHERE id = e.course_id)
        WHERE e.student_id = )" + studentId + R"(
        AND e.semester = ')" + db.escape(semester) + R"('
        AND e.status = 'enrolled'
        ORDER BY vsd.weekday, vsd.start_section
    )";
    
    auto result = db.query(sql);
    res.setJson(Json::fromDbResult(result));
}

// ========== 班级管理 ==========
void handleGetClasses(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto result = db.query("SELECT * FROM class_info ORDER BY class_code");
    res.setJson(Json::fromDbResult(result));
}

// ========== 统计分析 ==========
void handleGetUtilization(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto queryParams = req.parseQuery();
    
    std::string semester = queryParams.count("semester") ? queryParams["semester"] : getCurrentSemester();
    
    std::string sql = "SELECT * FROM v_classroom_utilization WHERE semester = '" + db.escape(semester) + "' OR semester IS NULL ORDER BY utilization_rate DESC";
    
    auto result = db.query(sql);
    res.setJson(Json::fromDbResult(result));
}

// ========== 排课建议 ==========
void handleGetScheduleSuggestion(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto queryParams = req.parseQuery();
    
    std::string courseId = queryParams["course_id"];
    std::string semester = queryParams.count("semester") ? queryParams["semester"] : getCurrentSemester();
    int requiredSeats = queryParams.count("seats") ? std::stoi(queryParams["seats"]) : 30;
    
    if (courseId.empty()) {
        res.setStatus(400);
        res.setJson("{\"error\": \"缺少course_id参数\"}");
        return;
    }
    
    // 获取课程信息
    auto courseResult = db.query("SELECT * FROM course WHERE id = " + courseId);
    if (courseResult.empty()) {
        res.setStatus(404);
        res.setJson("{\"error\": \"课程不存在\"}");
        return;
    }
    
    std::string teacherId = courseResult[0]["teacher_id"];
    
    // 查找空闲时段和教室
    std::vector<std::string> suggestions;
    
    for (int weekday = 1; weekday <= 5; weekday++) {
        for (int section = 1; section <= 10; section += 2) {
            // 查找该时段空闲且满足座位要求的教室
            std::string sql = R"(
                SELECT c.* FROM classroom c
                WHERE c.status = 'available'
                AND c.seats >= )" + std::to_string(requiredSeats) + R"(
                AND c.id NOT IN (
                    SELECT s.classroom_id FROM schedule s
                    WHERE s.semester = ')" + db.escape(semester) + R"('
                    AND s.weekday = )" + std::to_string(weekday) + R"(
                    AND NOT (s.end_section < )" + std::to_string(section) + R"( OR s.start_section > )" + std::to_string(section + 1) + R"()
                )
            )";
            
            // 检查教师是否空闲
            sql += R"(
                AND NOT EXISTS (
                    SELECT 1 FROM schedule s
                    WHERE s.teacher_id = )" + teacherId + R"(
                    AND s.semester = ')" + db.escape(semester) + R"('
                    AND s.weekday = )" + std::to_string(weekday) + R"(
                    AND NOT (s.end_section < )" + std::to_string(section) + R"( OR s.start_section > )" + std::to_string(section + 1) + R"()
                )
                LIMIT 3
            )";
            
            auto availableRooms = db.query(sql);
            for (const auto& room : availableRooms) {
                std::map<std::string, std::string> suggestion;
                suggestion["weekday"] = Json::number(weekday);
                suggestion["start_section"] = Json::number(section);
                suggestion["end_section"] = Json::number(section + 1);
                suggestion["classroom_id"] = room.at("id");
                suggestion["classroom_code"] = Json::string(room.at("classroom_code"));
                suggestion["classroom_name"] = Json::string(room.at("name"));
                suggestion["seats"] = room.at("seats");
                suggestions.push_back(Json::object(suggestion));
                
                if (suggestions.size() >= 10) break;
            }
            if (suggestions.size() >= 10) break;
        }
        if (suggestions.size() >= 10) break;
    }
    
    res.setJson(Json::array(suggestions));
}

// ========== 节次时间配置 ==========
void handleGetSectionTimes(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto result = db.query("SELECT * FROM section_time ORDER BY section_no");
    res.setJson(Json::fromDbResult(result));
}

// ========== 主函数 ==========
int main() {
    // 信号处理
    signal(SIGINT, signalHandler);
    signal(SIGTERM, signalHandler);
    
    // 数据库连接
    auto& db = Database::getInstance();
    if (!db.connect("localhost", "root", "@123Fengaoran", "classroom_system", 3306)) {
        std::cerr << "数据库连接失败，请检查配置" << std::endl;
        return 1;
    }
    
    // 创建HTTP服务器
    HttpServer server(8080);
    g_server = &server;
    
    // 设置静态文件目录 (使用绝对路径或正确的相对路径)
    server.setStaticDir("../../frontend");
    
    // ===== 注册路由 =====
    
    // 认证
    server.post("/api/login", handleLogin);
    
    // 教室管理
    server.get("/api/classrooms", handleGetClassrooms);
    server.get("/api/classrooms/:id", handleGetClassroom);
    server.post("/api/classrooms", handleCreateClassroom);
    server.put("/api/classrooms/:id", handleUpdateClassroom);
    server.del("/api/classrooms/:id", handleDeleteClassroom);
    
    // 设备管理
    server.get("/api/classrooms/:classroomId/equipments", handleGetEquipments);
    server.post("/api/classrooms/:classroomId/equipments", handleCreateEquipment);
    server.del("/api/equipments/:id", handleDeleteEquipment);
    
    // 课程管理
    server.get("/api/courses", handleGetCourses);
    server.post("/api/courses", handleCreateCourse);
    
    // 排课管理
    server.get("/api/schedules", handleGetSchedules);
    server.post("/api/schedules", handleCreateSchedule);
    server.del("/api/schedules/:id", handleDeleteSchedule);
    
    // 可用教室查询
    server.get("/api/available-classrooms", handleGetAvailableClassrooms);
    
    // 教师/学生
    server.get("/api/teachers", handleGetTeachers);
    server.get("/api/students", handleGetStudents);
    
    // 课表
    server.get("/api/teachers/:id/timetable", handleGetTeacherTimetable);
    server.get("/api/students/:id/timetable", handleGetStudentTimetable);
    
    // 班级
    server.get("/api/classes", handleGetClasses);
    
    // 统计
    server.get("/api/statistics/utilization", handleGetUtilization);
    
    // 排课建议
    server.get("/api/schedule-suggestion", handleGetScheduleSuggestion);
    
    // 节次时间
    server.get("/api/section-times", handleGetSectionTimes);
    
    std::cout << "===== 教室资源管理系统后端 =====" << std::endl;
    std::cout << "API文档: http://localhost:8080/api" << std::endl;
    std::cout << "前端页面: http://localhost:8080" << std::endl;
    std::cout << "按 Ctrl+C 退出" << std::endl;
    
    server.start();
    
    return 0;
}
