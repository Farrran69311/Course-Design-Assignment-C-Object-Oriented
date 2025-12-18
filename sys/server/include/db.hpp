#ifndef DB_HPP
#define DB_HPP

#include <string>
#include <vector>
#include <map>
#include <memory>
#include <mysql.h>

// 数据库结果行
using DbRow = std::map<std::string, std::string>;
using DbResult = std::vector<DbRow>;

class Database {
public:
    static Database& getInstance();
    
    bool connect(const std::string& host, const std::string& user, 
                 const std::string& password, const std::string& database, 
                 unsigned int port = 3306);
    void disconnect();
    bool isConnected() const;
    bool ensureConnected();  // 检查连接并自动重连
    
    // 执行查询并返回结果
    DbResult query(const std::string& sql);
    
    // 执行非查询语句（INSERT/UPDATE/DELETE）
    bool execute(const std::string& sql);
    
    // 获取最后插入的ID
    unsigned long long lastInsertId() const;
    
    // 获取受影响的行数
    unsigned long long affectedRows() const;
    
    // 转义字符串防止SQL注入
    std::string escape(const std::string& str);
    
    // 获取错误信息
    std::string getError() const;

private:
    Database();
    ~Database();
    Database(const Database&) = delete;
    Database& operator=(const Database&) = delete;
    
    MYSQL* conn_;
    bool connected_;
};

#endif // DB_HPP
