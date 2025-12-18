#ifndef JSON_HPP
#define JSON_HPP

#include <string>
#include <vector>
#include <map>
#include <sstream>
#include <iomanip>

// 简单JSON构建器
class Json {
public:
    static std::string object(const std::map<std::string, std::string>& data) {
        std::ostringstream oss;
        oss << "{";
        bool first = true;
        for (const auto& [key, value] : data) {
            if (!first) oss << ",";
            first = false;
            oss << "\"" << escapeString(key) << "\":" << value;
        }
        oss << "}";
        return oss.str();
    }
    
    static std::string array(const std::vector<std::string>& items) {
        std::ostringstream oss;
        oss << "[";
        for (size_t i = 0; i < items.size(); i++) {
            if (i > 0) oss << ",";
            oss << items[i];
        }
        oss << "]";
        return oss.str();
    }
    
    static std::string string(const std::string& s) {
        return "\"" + escapeString(s) + "\"";
    }
    
    static std::string number(int n) {
        return std::to_string(n);
    }
    
    static std::string number(double n) {
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(2) << n;
        return oss.str();
    }
    
    static std::string boolean(bool b) {
        return b ? "true" : "false";
    }
    
    static std::string null() {
        return "null";
    }
    
    // 从DbRow构建JSON对象
    static std::string fromDbRow(const std::map<std::string, std::string>& row) {
        std::map<std::string, std::string> data;
        for (const auto& [key, value] : row) {
            // 尝试判断是否为数字
            if (isNumber(value)) {
                data[key] = value;
            } else if (value == "true" || value == "false") {
                data[key] = value;
            } else if (value.empty()) {
                data[key] = "null";
            } else {
                data[key] = string(value);
            }
        }
        return object(data);
    }
    
    // 从DbResult构建JSON数组
    static std::string fromDbResult(const std::vector<std::map<std::string, std::string>>& result) {
        std::vector<std::string> items;
        for (const auto& row : result) {
            items.push_back(fromDbRow(row));
        }
        return array(items);
    }
    
    // 简单JSON解析（只支持简单对象）
    static std::map<std::string, std::string> parse(const std::string& json) {
        std::map<std::string, std::string> result;
        
        // 简化解析：找键值对
        size_t pos = 0;
        while ((pos = json.find('"', pos)) != std::string::npos) {
            size_t keyStart = pos + 1;
            size_t keyEnd = json.find('"', keyStart);
            if (keyEnd == std::string::npos) break;
            
            std::string key = json.substr(keyStart, keyEnd - keyStart);
            
            // 找冒号
            size_t colonPos = json.find(':', keyEnd);
            if (colonPos == std::string::npos) break;
            
            // 找值
            size_t valueStart = json.find_first_not_of(" \t\n\r", colonPos + 1);
            if (valueStart == std::string::npos) break;
            
            std::string value;
            if (json[valueStart] == '"') {
                // 字符串值
                size_t valueEnd = json.find('"', valueStart + 1);
                if (valueEnd != std::string::npos) {
                    value = json.substr(valueStart + 1, valueEnd - valueStart - 1);
                    pos = valueEnd + 1;
                }
            } else {
                // 数字或布尔值
                size_t valueEnd = json.find_first_of(",}", valueStart);
                if (valueEnd != std::string::npos) {
                    value = json.substr(valueStart, valueEnd - valueStart);
                    // 去除空白
                    value.erase(value.find_last_not_of(" \t\n\r") + 1);
                    pos = valueEnd;
                }
            }
            
            result[key] = value;
            pos++;
        }
        
        return result;
    }
    
private:
    static std::string escapeString(const std::string& s) {
        std::ostringstream oss;
        for (char c : s) {
            switch (c) {
                case '"': oss << "\\\""; break;
                case '\\': oss << "\\\\"; break;
                case '\b': oss << "\\b"; break;
                case '\f': oss << "\\f"; break;
                case '\n': oss << "\\n"; break;
                case '\r': oss << "\\r"; break;
                case '\t': oss << "\\t"; break;
                default: oss << c;
            }
        }
        return oss.str();
    }
    
    static bool isNumber(const std::string& s) {
        if (s.empty()) return false;
        size_t start = 0;
        if (s[0] == '-') start = 1;
        bool hasDot = false;
        for (size_t i = start; i < s.size(); i++) {
            if (s[i] == '.') {
                if (hasDot) return false;
                hasDot = true;
            } else if (!isdigit(s[i])) {
                return false;
            }
        }
        return start < s.size();
    }
};

#endif // JSON_HPP
