#include "db.hpp"
#include <iostream>
#include <stdexcept>

Database& Database::getInstance() {
    static Database instance;
    return instance;
}

Database::Database() : conn_(nullptr), connected_(false), port_(3306) {
    conn_ = mysql_init(nullptr);
    if (!conn_) {
        throw std::runtime_error("MySQL init failed");
    }
}

Database::~Database() {
    disconnect();
    if (conn_) {
        mysql_close(conn_);
    }
}

bool Database::connect(const std::string& host, const std::string& user,
                       const std::string& password, const std::string& database,
                       unsigned int port) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    // 保存连接参数用于重连
    host_ = host;
    user_ = user;
    password_ = password;
    database_ = database;
    port_ = port;
    
    if (connected_) {
        connected_ = false;
    }
    
    // 设置字符集
    mysql_options(conn_, MYSQL_SET_CHARSET_NAME, "utf8mb4");
    
    // 设置自动重连
    bool reconnect = true;
    mysql_options(conn_, MYSQL_OPT_RECONNECT, &reconnect);
    
    // 设置连接超时
    unsigned int timeout = 10;
    mysql_options(conn_, MYSQL_OPT_CONNECT_TIMEOUT, &timeout);
    mysql_options(conn_, MYSQL_OPT_READ_TIMEOUT, &timeout);
    mysql_options(conn_, MYSQL_OPT_WRITE_TIMEOUT, &timeout);
    
    if (!mysql_real_connect(conn_, host.c_str(), user.c_str(), password.c_str(),
                            database.c_str(), port, nullptr, 0)) {
        std::cerr << "MySQL连接失败: " << mysql_error(conn_) << std::endl;
        return false;
    }
    
    connected_ = true;
    std::cout << "MySQL连接成功: " << host << ":" << port << "/" << database << std::endl;
    return true;
}

void Database::disconnect() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (connected_ && conn_) {
        connected_ = false;
    }
}

bool Database::isConnected() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return connected_ && conn_ && mysql_ping(conn_) == 0;
}

// 检查并重连 (内部方法，调用前必须已持有锁)
bool Database::ensureConnected() {
    // 注意：此方法由 query/execute 调用，它们已经持有锁
    // 不要在这里再次加锁，否则会死锁
    
    if (!conn_) return false;
    
    // 尝试ping，如果失败则重连
    if (mysql_ping(conn_) != 0) {
        std::cerr << "MySQL连接已断开，尝试重连..." << std::endl;
        
        // 手动重新连接
        mysql_close(conn_);
        conn_ = mysql_init(nullptr);
        if (!conn_) {
            std::cerr << "MySQL重新初始化失败" << std::endl;
            connected_ = false;
            return false;
        }
        
        // 重新设置选项
        mysql_options(conn_, MYSQL_SET_CHARSET_NAME, "utf8mb4");
        bool reconnect = true;
        mysql_options(conn_, MYSQL_OPT_RECONNECT, &reconnect);
        
        unsigned int timeout = 10;
        mysql_options(conn_, MYSQL_OPT_CONNECT_TIMEOUT, &timeout);
        mysql_options(conn_, MYSQL_OPT_READ_TIMEOUT, &timeout);
        mysql_options(conn_, MYSQL_OPT_WRITE_TIMEOUT, &timeout);
        
        // 使用保存的连接参数重连
        const char* host = host_.empty() ? "localhost" : host_.c_str();
        const char* user = user_.empty() ? "root" : user_.c_str();
        const char* pwd = password_.empty() ? "@123Fengaoran" : password_.c_str();
        const char* db = database_.empty() ? "classroom_system" : database_.c_str();
        
        if (!mysql_real_connect(conn_, host, user, pwd, db, port_, nullptr, 0)) {
            std::cerr << "MySQL重连失败: " << mysql_error(conn_) << std::endl;
            connected_ = false;
            return false;
        }
        
        std::cout << "MySQL重连成功" << std::endl;
        connected_ = true;
    }
    return true;
}

DbResult Database::query(const std::string& sql) {
    std::lock_guard<std::mutex> lock(mutex_);
    DbResult result;
    
    if (!ensureConnected()) {
        std::cerr << "数据库未连接" << std::endl;
        return result;
    }
    
    if (mysql_query(conn_, sql.c_str()) != 0) {
        std::cerr << "SQL查询失败: " << mysql_error(conn_) << "\nSQL: " << sql << std::endl;
        // 尝试重连后重试一次
        if (ensureConnected() && mysql_query(conn_, sql.c_str()) != 0) {
            return result;
        }
    }
    
    MYSQL_RES* res = mysql_store_result(conn_);
    if (!res) {
        // 可能是非SELECT语句
        return result;
    }
    
    int numFields = mysql_num_fields(res);
    MYSQL_FIELD* fields = mysql_fetch_fields(res);
    
    MYSQL_ROW row;
    while ((row = mysql_fetch_row(res))) {
        DbRow dbRow;
        for (int i = 0; i < numFields; i++) {
            std::string key = fields[i].name;
            std::string value = row[i] ? row[i] : "";
            dbRow[key] = value;
        }
        result.push_back(dbRow);
    }
    
    mysql_free_result(res);
    return result;
}

bool Database::execute(const std::string& sql) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (!ensureConnected()) {
        std::cerr << "数据库未连接" << std::endl;
        return false;
    }
    
    if (mysql_query(conn_, sql.c_str()) != 0) {
        std::cerr << "SQL执行失败: " << mysql_error(conn_) << "\nSQL: " << sql << std::endl;
        return false;
    }
    
    return true;
}

unsigned long long Database::lastInsertId() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return mysql_insert_id(conn_);
}

unsigned long long Database::affectedRows() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return mysql_affected_rows(conn_);
}

std::string Database::escape(const std::string& str) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (!conn_) return str;
    
    std::vector<char> buffer(str.size() * 2 + 1);
    mysql_real_escape_string(conn_, buffer.data(), str.c_str(), str.size());
    return std::string(buffer.data());
}

std::string Database::getError() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return conn_ ? mysql_error(conn_) : "No connection";
}
