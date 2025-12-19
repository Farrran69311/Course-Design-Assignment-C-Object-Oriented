#include "http_server.hpp"
#include "db.hpp"
#include "json.hpp"
#include <iostream>
#include <sstream>
#include <cstdlib>
#include <signal.h>

HttpServer* g_server = nullptr;

void signalHandler([[maybe_unused]] int sig) {
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
void handleGetEquipmentsByClassroom(const HttpRequest& req, HttpResponse& res) {
    std::string classroomId = req.params.at("classroomId");
    auto& db = Database::getInstance();
    
    auto result = db.query("SELECT e.*, c.name AS classroom_name, c.classroom_code "
                          "FROM equipment e "
                          "LEFT JOIN classroom c ON e.classroom_id = c.id "
                          "WHERE e.classroom_id = " + classroomId);
    res.setJson(Json::fromDbResult(result));
}

void handleGetEquipments(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto queryParams = req.parseQuery();
    
    std::string sql = "SELECT e.*, c.name AS classroom_name, c.classroom_code "
                     "FROM equipment e "
                     "LEFT JOIN classroom c ON e.classroom_id = c.id WHERE 1=1";
    
    if (queryParams.count("classroom_id") && !queryParams.at("classroom_id").empty()) {
        sql += " AND e.classroom_id = " + queryParams.at("classroom_id");
    }
    if (queryParams.count("equipment_type") && !queryParams.at("equipment_type").empty()) {
        sql += " AND e.equipment_type = '" + db.escape(queryParams.at("equipment_type")) + "'";
    }
    if (queryParams.count("status") && !queryParams.at("status").empty()) {
        sql += " AND e.status = '" + db.escape(queryParams.at("status")) + "'";
    }
    
    sql += " ORDER BY e.id DESC";
    auto result = db.query(sql);
    res.setJson(Json::fromDbResult(result));
}

void handleGetEquipment(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    
    auto result = db.query("SELECT e.*, c.name AS classroom_name "
                          "FROM equipment e "
                          "LEFT JOIN classroom c ON e.classroom_id = c.id "
                          "WHERE e.id = " + id);
    if (result.empty()) {
        res.setStatus(404);
        res.setJson("{\"error\": \"设备不存在\"}");
        return;
    }
    res.setJson(Json::fromDbRow(result[0]));
}

void handleCreateEquipment(const HttpRequest& req, HttpResponse& res) {
    auto params = Json::parse(req.body);
    auto& db = Database::getInstance();
    
    std::string classroomId = params["classroom_id"].empty() ? "NULL" : params["classroom_id"];
    std::string purchaseDate = params["purchase_date"].empty() ? "NULL" : "'" + db.escape(params["purchase_date"]) + "'";
    
    std::string sql = "INSERT INTO equipment (equipment_code, name, equipment_type, classroom_id, brand, model, quantity, status, purchase_date, remark) VALUES ('"
        + db.escape(params["equipment_code"]) + "', '"
        + db.escape(params["name"]) + "', '"
        + db.escape(params["equipment_type"]) + "', "
        + classroomId + ", '"
        + db.escape(params["brand"]) + "', '"
        + db.escape(params["model"]) + "', "
        + (params["quantity"].empty() ? "1" : params["quantity"]) + ", '"
        + (params["status"].empty() ? "normal" : db.escape(params["status"])) + "', "
        + purchaseDate + ", '"
        + db.escape(params["remark"]) + "')";
    
    if (db.execute(sql)) {
        res.setStatus(201);
        res.setJson("{\"id\": " + std::to_string(db.lastInsertId()) + "}");
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"创建失败\"}");
    }
}

void handleUpdateEquipment(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto params = Json::parse(req.body);
    auto& db = Database::getInstance();
    
    std::string classroomId = params["classroom_id"].empty() ? "NULL" : params["classroom_id"];
    std::string purchaseDate = params["purchase_date"].empty() ? "NULL" : "'" + db.escape(params["purchase_date"]) + "'";
    
    std::string sql = "UPDATE equipment SET "
        "name = '" + db.escape(params["name"]) + "', "
        "equipment_type = '" + db.escape(params["equipment_type"]) + "', "
        "classroom_id = " + classroomId + ", "
        "brand = '" + db.escape(params["brand"]) + "', "
        "model = '" + db.escape(params["model"]) + "', "
        "quantity = " + (params["quantity"].empty() ? "1" : params["quantity"]) + ", "
        "status = '" + db.escape(params["status"]) + "', "
        "purchase_date = " + purchaseDate + ", "
        "remark = '" + db.escape(params["remark"]) + "' "
        "WHERE id = " + id;
    
    if (db.execute(sql)) {
        res.setStatus(200);
        res.setJson("{\"success\": true}");
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"更新失败\"}");
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

void handleGetCourse(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    
    auto result = db.query("SELECT c.*, t.name AS teacher_name FROM course c "
                          "LEFT JOIN teacher t ON c.teacher_id = t.id WHERE c.id = " + id);
    if (result.empty()) {
        res.setStatus(404);
        res.setJson("{\"error\": \"课程不存在\"}");
        return;
    }
    res.setJson(Json::fromDbRow(result[0]));
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

void handleUpdateCourse(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto params = Json::parse(req.body);
    auto& db = Database::getInstance();
    
    std::string sql = "UPDATE course SET course_code = '" + db.escape(params["course_code"]) + "', "
        "name = '" + db.escape(params["name"]) + "', "
        "teacher_id = " + (params["teacher_id"].empty() ? "NULL" : params["teacher_id"]) + ", "
        "credits = " + (params["credits"].empty() ? "NULL" : params["credits"]) + ", "
        "hours = " + (params["hours"].empty() ? "NULL" : params["hours"]) + ", "
        "course_type = '" + (params["course_type"].empty() ? "required" : db.escape(params["course_type"])) + "', "
        "capacity = " + (params["capacity"].empty() ? "NULL" : params["capacity"]) + " "
        "WHERE id = " + id;
    
    if (db.execute(sql)) {
        res.setJson("{\"success\": true}");
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"更新失败: " + db.getError() + "\"}");
    }
}

void handleDeleteCourse(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    
    // 先删除相关的排课记录
    db.execute("DELETE FROM schedule WHERE course_id = " + id);
    
    std::string sql = "DELETE FROM course WHERE id = " + id;
    if (db.execute(sql)) {
        res.setStatus(204);
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"删除失败: " + db.getError() + "\"}");
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
void handleGetTeachers([[maybe_unused]] const HttpRequest& req, HttpResponse& res) {
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
    auto queryParams = req.parseQuery();
    
    std::string sql = "SELECT * FROM class_info WHERE 1=1";
    
    if (queryParams.count("name") && !queryParams.at("name").empty()) {
        sql += " AND class_name LIKE '%" + db.escape(queryParams.at("name")) + "%'";
    }
    if (queryParams.count("grade") && !queryParams.at("grade").empty()) {
        sql += " AND grade = '" + db.escape(queryParams.at("grade")) + "'";
    }
    if (queryParams.count("department") && !queryParams.at("department").empty()) {
        sql += " AND department LIKE '%" + db.escape(queryParams.at("department")) + "%'";
    }
    
    sql += " ORDER BY class_code";
    auto result = db.query(sql);
    res.setJson(Json::fromDbResult(result));
}

void handleGetClass(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    
    auto result = db.query("SELECT * FROM class_info WHERE id = " + id);
    if (result.empty()) {
        res.setStatus(404);
        res.setJson("{\"error\": \"班级不存在\"}");
        return;
    }
    res.setJson(Json::fromDbRow(result[0]));
}

void handleCreateClass(const HttpRequest& req, HttpResponse& res) {
    auto params = Json::parse(req.body);
    auto& db = Database::getInstance();
    
    std::string sql = "INSERT INTO class_info (class_code, class_name, grade, major, department, student_count, remark) VALUES ('"
        + db.escape(params["class_code"]) + "', '"
        + db.escape(params["class_name"]) + "', '"
        + db.escape(params["grade"]) + "', '"
        + db.escape(params["major"]) + "', '"
        + db.escape(params["department"]) + "', "
        + (params["student_count"].empty() ? "30" : params["student_count"]) + ", '"
        + db.escape(params["remark"]) + "')";
    
    if (db.execute(sql)) {
        res.setStatus(201);
        res.setJson("{\"id\": " + std::to_string(db.lastInsertId()) + "}");
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"创建失败\"}");
    }
}

void handleUpdateClass(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto params = Json::parse(req.body);
    auto& db = Database::getInstance();
    
    std::string sql = "UPDATE class_info SET "
        "class_name = '" + db.escape(params["class_name"]) + "', "
        "grade = '" + db.escape(params["grade"]) + "', "
        "major = '" + db.escape(params["major"]) + "', "
        "department = '" + db.escape(params["department"]) + "', "
        "student_count = " + (params["student_count"].empty() ? "30" : params["student_count"]) + ", "
        "remark = '" + db.escape(params["remark"]) + "' "
        "WHERE id = " + id;
    
    if (db.execute(sql)) {
        res.setStatus(200);
        res.setJson("{\"success\": true}");
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"更新失败\"}");
    }
}

void handleDeleteClass(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    
    if (db.execute("DELETE FROM class_info WHERE id = " + id)) {
        res.setStatus(204);
    } else {
        res.setStatus(400);
        res.setJson("{\"error\": \"删除失败\"}");
    }
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
void handleGetSectionTimes([[maybe_unused]] const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto result = db.query("SELECT * FROM section_time ORDER BY section_no");
    res.setJson(Json::fromDbResult(result));
}

// ========== 通知公告 ==========
void handleGetNotices([[maybe_unused]] const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    std::string sql = R"(
        SELECT n.*, u.real_name as author_name 
        FROM notice n 
        LEFT JOIN user u ON n.author_id = u.id 
        WHERE n.status = 'published'
        ORDER BY n.is_top DESC, n.publish_time DESC
        LIMIT 50
    )";
    auto result = db.query(sql);
    res.setJson(Json::fromDbResult(result));
}

void handleGetNotice(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    
    // 增加浏览次数
    db.execute("UPDATE notice SET view_count = view_count + 1 WHERE id = " + id);
    
    auto result = db.query(
        "SELECT n.*, u.real_name as author_name FROM notice n "
        "LEFT JOIN user u ON n.author_id = u.id WHERE n.id = " + id
    );
    
    if (result.empty()) {
        res.setStatus(404);
        res.setJson("{\"error\": \"通知不存在\"}");
        return;
    }
    res.setJson(Json::fromDbRow(result[0]));
}

void handleCreateNotice(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto data = Json::parse(req.body);
    
    std::string sql = "INSERT INTO notice (title, content, author_id, notice_type, is_top) VALUES ('" +
        db.escape(data["title"]) + "', '" +
        db.escape(data["content"]) + "', " +
        data["author_id"] + ", '" +
        db.escape(data["notice_type"]) + "', " +
        (data["is_top"] == "true" ? "1" : "0") + ")";
    
    if (db.execute(sql)) {
        res.setJson("{\"id\": " + std::to_string(db.lastInsertId()) + ", \"message\": \"发布成功\"}");
    } else {
        res.setStatus(500);
        res.setJson("{\"error\": \"发布失败\"}");
    }
}

void handleUpdateNotice(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    auto data = Json::parse(req.body);
    
    std::string sql = "UPDATE notice SET title = '" + db.escape(data["title"]) + 
        "', content = '" + db.escape(data["content"]) +
        "', notice_type = '" + db.escape(data["notice_type"]) +
        "', is_top = " + (data["is_top"] == "true" ? "1" : "0") +
        " WHERE id = " + id;
    
    if (db.execute(sql)) {
        res.setJson("{\"message\": \"更新成功\"}");
    } else {
        res.setStatus(500);
        res.setJson("{\"error\": \"更新失败\"}");
    }
}

void handleDeleteNotice(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    
    if (db.execute("DELETE FROM notice WHERE id = " + id)) {
        res.setStatus(204);
    } else {
        res.setStatus(500);
        res.setJson("{\"error\": \"删除失败\"}");
    }
}

// ========== 教室预约 ==========
void handleGetBookings(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto queryParams = req.parseQuery();
    std::string status = queryParams.count("status") ? queryParams["status"] : "";
    std::string classroomId = queryParams.count("classroom_id") ? queryParams["classroom_id"] : "";
    
    std::string sql = R"(
        SELECT b.*, c.classroom_code, c.name as classroom_name, 
               u.real_name as applicant_name, a.real_name as approver_name
        FROM booking b
        LEFT JOIN classroom c ON b.classroom_id = c.id
        LEFT JOIN user u ON b.applicant_id = u.id
        LEFT JOIN user a ON b.approver_id = a.id
        WHERE 1=1
    )";
    
    if (!status.empty()) sql += " AND b.status = '" + db.escape(status) + "'";
    if (!classroomId.empty()) sql += " AND b.classroom_id = " + classroomId;
    
    sql += " ORDER BY b.booking_date DESC, b.start_section";
    
    auto result = db.query(sql);
    res.setJson(Json::fromDbResult(result));
}

void handleCreateBooking(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto data = Json::parse(req.body);
    
    // 检查时间冲突
    std::string checkSql = "SELECT id FROM booking WHERE classroom_id = " + data["classroom_id"] +
        " AND booking_date = '" + data["booking_date"] + "'" +
        " AND status IN ('pending', 'approved')" +
        " AND ((start_section <= " + data["end_section"] + " AND end_section >= " + data["start_section"] + "))";
    
    auto existing = db.query(checkSql);
    if (!existing.empty()) {
        res.setStatus(400);
        res.setJson("{\"error\": \"该时间段已有预约\"}");
        return;
    }
    
    std::string sql = "INSERT INTO booking (classroom_id, applicant_id, booking_date, start_section, end_section, purpose) VALUES (" +
        data["classroom_id"] + ", " +
        data["applicant_id"] + ", '" +
        data["booking_date"] + "', " +
        data["start_section"] + ", " +
        data["end_section"] + ", '" +
        db.escape(data["purpose"]) + "')";
    
    if (db.execute(sql)) {
        res.setJson("{\"id\": " + std::to_string(db.lastInsertId()) + ", \"message\": \"预约提交成功，等待审批\"}");
    } else {
        res.setStatus(500);
        res.setJson("{\"error\": \"预约失败\"}");
    }
}

void handleApproveBooking(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    auto data = Json::parse(req.body);
    
    std::string status = data["approved"] == "true" ? "approved" : "rejected";
    std::string sql = "UPDATE booking SET status = '" + status + 
        "', approver_id = " + data["approver_id"] +
        ", approved_at = NOW() WHERE id = " + id;
    
    if (db.execute(sql)) {
        res.setJson("{\"message\": \"" + std::string(status == "approved" ? "审批通过" : "已拒绝") + "\"}");
    } else {
        res.setStatus(500);
        res.setJson("{\"error\": \"操作失败\"}");
    }
}

// ========== 选课相关 ==========
void handleGetEnrollments(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto queryParams = req.parseQuery();
    std::string studentId = queryParams.count("student_id") ? queryParams["student_id"] : "";
    std::string courseId = queryParams.count("course_id") ? queryParams["course_id"] : "";
    
    std::string sql = R"(
        SELECT e.*, s.student_code, s.name as student_name,
               c.course_code, c.name as course_name, t.name as teacher_name
        FROM enrollment e
        LEFT JOIN student s ON e.student_id = s.id
        LEFT JOIN course c ON e.course_id = c.id
        LEFT JOIN teacher t ON c.teacher_id = t.id
        WHERE 1=1
    )";
    
    if (!studentId.empty()) sql += " AND e.student_id = " + studentId;
    if (!courseId.empty()) sql += " AND e.course_id = " + courseId;
    
    sql += " ORDER BY e.created_at DESC";
    
    auto result = db.query(sql);
    res.setJson(Json::fromDbResult(result));
}

void handleEnrollCourse(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto data = Json::parse(req.body);
    
    // 检查是否已选
    auto existing = db.query("SELECT id FROM enrollment WHERE student_id = " + data["student_id"] + 
        " AND course_id = " + data["course_id"] + " AND semester = '" + data["semester"] + "'");
    
    if (!existing.empty()) {
        res.setStatus(400);
        res.setJson("{\"error\": \"已选该课程\"}");
        return;
    }
    
    // 检查课程容量
    auto course = db.query("SELECT capacity FROM course WHERE id = " + data["course_id"]);
    auto enrolled = db.query("SELECT COUNT(*) as cnt FROM enrollment WHERE course_id = " + data["course_id"] + 
        " AND semester = '" + data["semester"] + "' AND status = 'enrolled'");
    
    if (!course.empty() && !enrolled.empty()) {
        int capacity = std::stoi(course[0]["capacity"]);
        int current = std::stoi(enrolled[0]["cnt"]);
        if (current >= capacity) {
            res.setStatus(400);
            res.setJson("{\"error\": \"课程已满\"}");
            return;
        }
    }
    
    std::string sql = "INSERT INTO enrollment (student_id, course_id, semester) VALUES (" +
        data["student_id"] + ", " + data["course_id"] + ", '" + data["semester"] + "')";
    
    if (db.execute(sql)) {
        res.setJson("{\"message\": \"选课成功\"}");
    } else {
        res.setStatus(500);
        res.setJson("{\"error\": \"选课失败\"}");
    }
}

void handleDropCourse(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    
    if (db.execute("UPDATE enrollment SET status = 'dropped' WHERE id = " + id)) {
        res.setJson("{\"message\": \"退课成功\"}");
    } else {
        res.setStatus(500);
        res.setJson("{\"error\": \"退课失败\"}");
    }
}

// ========== 用户管理 ==========
void handleGetUsers(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto queryParams = req.parseQuery();
    std::string search = queryParams.count("search") ? queryParams["search"] : "";
    std::string role = queryParams.count("role") ? queryParams["role"] : "";
    
    std::string sql = "SELECT id, username, real_name, role, email, phone, created_at FROM user WHERE 1=1";
    
    if (!search.empty()) {
        sql += " AND (username LIKE '%" + db.escape(search) + "%' OR real_name LIKE '%" + db.escape(search) + "%')";
    }
    if (!role.empty()) {
        sql += " AND role = '" + db.escape(role) + "'";
    }
    
    sql += " ORDER BY created_at DESC";
    
    auto result = db.query(sql);
    res.setJson(Json::fromDbResult(result));
}

void handleCreateUser(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto data = Json::parse(req.body);
    
    // 检查用户名是否已存在
    auto existing = db.query("SELECT id FROM user WHERE username = '" + db.escape(data["username"]) + "'");
    if (!existing.empty()) {
        res.setStatus(400);
        res.setJson("{\"error\": \"用户名已存在\"}");
        return;
    }
    
    std::string password = data["password"].empty() ? "123456" : data["password"];
    
    std::string sql = "INSERT INTO user (username, password, real_name, role, email, phone) VALUES ('" +
        db.escape(data["username"]) + "', SHA2('" + db.escape(password) + "', 256), '" +
        db.escape(data["real_name"]) + "', '" +
        db.escape(data["role"]) + "', '" +
        db.escape(data["email"]) + "', '" +
        db.escape(data["phone"]) + "')";
    
    if (db.execute(sql)) {
        res.setJson("{\"id\": " + std::to_string(db.lastInsertId()) + ", \"message\": \"创建成功\"}");
    } else {
        res.setStatus(500);
        res.setJson("{\"error\": \"创建失败\"}");
    }
}

void handleUpdateUser(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    auto data = Json::parse(req.body);
    
    std::string sql = "UPDATE user SET real_name = '" + db.escape(data["real_name"]) + 
        "', role = '" + db.escape(data["role"]) +
        "', email = '" + db.escape(data["email"]) +
        "', phone = '" + db.escape(data["phone"]) + "'";
    
    if (!data["password"].empty()) {
        sql += ", password = SHA2('" + db.escape(data["password"]) + "', 256)";
    }
    
    sql += " WHERE id = " + id;
    
    if (db.execute(sql)) {
        res.setJson("{\"message\": \"更新成功\"}");
    } else {
        res.setStatus(500);
        res.setJson("{\"error\": \"更新失败\"}");
    }
}

void handleDeleteUser(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    
    // 不允许删除admin用户
    auto user = db.query("SELECT username FROM user WHERE id = " + id);
    if (!user.empty() && user[0]["username"] == "admin") {
        res.setStatus(400);
        res.setJson("{\"error\": \"不能删除管理员账户\"}");
        return;
    }
    
    if (db.execute("DELETE FROM user WHERE id = " + id)) {
        res.setJson("{\"message\": \"删除成功\"}");
    } else {
        res.setStatus(500);
        res.setJson("{\"error\": \"删除失败\"}");
    }
}

void handleResetPassword(const HttpRequest& req, HttpResponse& res) {
    std::string id = req.params.at("id");
    auto& db = Database::getInstance();
    
    if (db.execute("UPDATE user SET password = SHA2('123456', 256) WHERE id = " + id)) {
        res.setJson("{\"message\": \"密码已重置为123456\"}");
    } else {
        res.setStatus(500);
        res.setJson("{\"error\": \"重置失败\"}");
    }
}

void handleBatchCreateUsers(const HttpRequest& req, HttpResponse& res) {
    auto& db = Database::getInstance();
    auto data = Json::parse(req.body);
    
    int success = 0, failed = 0;
    
    // 解析用户数据 - 简单的逗号分隔格式: username,real_name,role,email
    std::string usersData = data["users"];
    std::istringstream stream(usersData);
    std::string line;
    
    while (std::getline(stream, line)) {
        if (line.empty()) continue;
        
        std::vector<std::string> parts;
        std::istringstream lineStream(line);
        std::string part;
        while (std::getline(lineStream, part, ',')) {
            parts.push_back(part);
        }
        
        if (parts.size() >= 3) {
            std::string username = parts[0];
            std::string realName = parts[1];
            std::string role = parts[2];
            std::string email = parts.size() > 3 ? parts[3] : "";
            
            // 检查用户名是否已存在
            auto existing = db.query("SELECT id FROM user WHERE username = '" + db.escape(username) + "'");
            if (!existing.empty()) {
                failed++;
                continue;
            }
            
            std::string sql = "INSERT INTO user (username, password, real_name, role, email) VALUES ('" +
                db.escape(username) + "', SHA2('123456', 256), '" +
                db.escape(realName) + "', '" + db.escape(role) + "', '" + db.escape(email) + "')";
            
            if (db.execute(sql)) {
                success++;
            } else {
                failed++;
            }
        }
    }
    
    res.setJson("{\"success\": " + std::to_string(success) + ", \"failed\": " + std::to_string(failed) + "}");
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
    
    // 设置静态文件目录 (使用绝对路径)
    server.setStaticDir("/Users/fengrr/Desktop/程序设计方法实现/code/sys/frontend");
    
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
    server.get("/api/equipments", handleGetEquipments);
    server.get("/api/equipments/:id", handleGetEquipment);
    server.post("/api/equipments", handleCreateEquipment);
    server.put("/api/equipments/:id", handleUpdateEquipment);
    server.del("/api/equipments/:id", handleDeleteEquipment);
    server.get("/api/classrooms/:classroomId/equipments", handleGetEquipmentsByClassroom);
    
    // 课程管理
    server.get("/api/courses", handleGetCourses);
    server.get("/api/courses/:id", handleGetCourse);
    server.post("/api/courses", handleCreateCourse);
    server.put("/api/courses/:id", handleUpdateCourse);
    server.del("/api/courses/:id", handleDeleteCourse);
    
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
    
    // 班级管理
    server.get("/api/classes", handleGetClasses);
    server.get("/api/classes/:id", handleGetClass);
    server.post("/api/classes", handleCreateClass);
    server.put("/api/classes/:id", handleUpdateClass);
    server.del("/api/classes/:id", handleDeleteClass);
    
    // 统计
    server.get("/api/statistics/utilization", handleGetUtilization);
    
    // 排课建议
    server.get("/api/schedule-suggestion", handleGetScheduleSuggestion);
    
    // 节次时间
    server.get("/api/section-times", handleGetSectionTimes);
    
    // 通知公告
    server.get("/api/notices", handleGetNotices);
    server.get("/api/notices/:id", handleGetNotice);
    server.post("/api/notices", handleCreateNotice);
    server.put("/api/notices/:id", handleUpdateNotice);
    server.del("/api/notices/:id", handleDeleteNotice);
    
    // 教室预约
    server.get("/api/bookings", handleGetBookings);
    server.post("/api/bookings", handleCreateBooking);
    server.put("/api/bookings/:id/approve", handleApproveBooking);
    
    // 选课
    server.get("/api/enrollments", handleGetEnrollments);
    server.post("/api/enrollments", handleEnrollCourse);
    server.put("/api/enrollments/:id/drop", handleDropCourse);
    
    // 用户管理
    server.get("/api/users", handleGetUsers);
    server.post("/api/users", handleCreateUser);
    server.put("/api/users/:id", handleUpdateUser);
    server.del("/api/users/:id", handleDeleteUser);
    server.put("/api/users/:id/reset-password", handleResetPassword);
    server.post("/api/users/batch", handleBatchCreateUsers);
    
    std::cout << "===== 教室资源管理系统后端 =====" << std::endl;
    std::cout << "API文档: http://localhost:8080/api" << std::endl;
    std::cout << "前端页面: http://localhost:8080" << std::endl;
    std::cout << "按 Ctrl+C 退出" << std::endl;
    
    server.start();
    
    return 0;
}
