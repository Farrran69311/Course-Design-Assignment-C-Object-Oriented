#include "http_server.hpp"
#include <iostream>
#include <sstream>
#include <fstream>
#include <algorithm>
#include <cstring>
#include <regex>

// ========== HttpRequest ==========
std::map<std::string, std::string> HttpRequest::parseQuery() const {
    std::map<std::string, std::string> result;
    if (query.empty()) return result;
    
    std::istringstream iss(query);
    std::string pair;
    while (std::getline(iss, pair, '&')) {
        size_t pos = pair.find('=');
        if (pos != std::string::npos) {
            std::string key = pair.substr(0, pos);
            std::string value = pair.substr(pos + 1);
            // URL解码（简化版）
            result[key] = value;
        }
    }
    return result;
}

std::string HttpRequest::getPathParam(const std::string& pattern, int index) const {
    // 简单实现：按/分割比较
    auto splitPath = [](const std::string& p) {
        std::vector<std::string> parts;
        std::istringstream iss(p);
        std::string part;
        while (std::getline(iss, part, '/')) {
            if (!part.empty()) parts.push_back(part);
        }
        return parts;
    };
    
    auto pathParts = splitPath(path);
    auto patternParts = splitPath(pattern);
    
    int paramIndex = 0;
    for (size_t i = 0; i < patternParts.size() && i < pathParts.size(); i++) {
        if (patternParts[i][0] == ':') {
            if (paramIndex == index) {
                return pathParts[i];
            }
            paramIndex++;
        }
    }
    return "";
}

// ========== HttpResponse ==========
void HttpResponse::setJson(const std::string& json) {
    headers["Content-Type"] = "application/json; charset=utf-8";
    body = json;
}

void HttpResponse::setHtml(const std::string& html) {
    headers["Content-Type"] = "text/html; charset=utf-8";
    body = html;
}

void HttpResponse::setStatus(int code, const std::string& message) {
    statusCode = code;
    if (!message.empty()) {
        body = message;
    }
}

std::string HttpResponse::toString() const {
    std::ostringstream oss;
    
    // 状态行
    std::string statusText;
    switch (statusCode) {
        case 200: statusText = "OK"; break;
        case 201: statusText = "Created"; break;
        case 204: statusText = "No Content"; break;
        case 400: statusText = "Bad Request"; break;
        case 401: statusText = "Unauthorized"; break;
        case 403: statusText = "Forbidden"; break;
        case 404: statusText = "Not Found"; break;
        case 409: statusText = "Conflict"; break;
        case 500: statusText = "Internal Server Error"; break;
        default: statusText = "Unknown";
    }
    
    oss << "HTTP/1.1 " << statusCode << " " << statusText << "\r\n";
    
    // 默认头
    oss << "Access-Control-Allow-Origin: *\r\n";
    oss << "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n";
    oss << "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";
    
    // 自定义头
    for (const auto& [key, value] : headers) {
        oss << key << ": " << value << "\r\n";
    }
    
    // Content-Length
    oss << "Content-Length: " << body.size() << "\r\n";
    oss << "\r\n";
    oss << body;
    
    return oss.str();
}

// ========== HttpServer ==========
HttpServer::HttpServer(int port) : port_(port), serverFd_(-1), running_(false) {}

HttpServer::~HttpServer() {
    stop();
}

void HttpServer::get(const std::string& path, RouteHandler handler) {
    routes_["GET"][path] = handler;
}

void HttpServer::post(const std::string& path, RouteHandler handler) {
    routes_["POST"][path] = handler;
}

void HttpServer::put(const std::string& path, RouteHandler handler) {
    routes_["PUT"][path] = handler;
}

void HttpServer::del(const std::string& path, RouteHandler handler) {
    routes_["DELETE"][path] = handler;
}

void HttpServer::setStaticDir(const std::string& dir) {
    staticDir_ = dir;
}

bool HttpServer::matchRoute(const std::string& pattern, const std::string& path, HttpRequest& req) {
    // 精确匹配
    if (pattern == path) return true;
    
    // 带参数的路由匹配（如 /api/classrooms/:id）
    auto splitPath = [](const std::string& p) {
        std::vector<std::string> parts;
        std::istringstream iss(p);
        std::string part;
        while (std::getline(iss, part, '/')) {
            if (!part.empty()) parts.push_back(part);
        }
        return parts;
    };
    
    auto patternParts = splitPath(pattern);
    auto pathParts = splitPath(path);
    
    if (patternParts.size() != pathParts.size()) return false;
    
    for (size_t i = 0; i < patternParts.size(); i++) {
        if (patternParts[i][0] == ':') {
            // 参数占位符
            std::string paramName = patternParts[i].substr(1);
            req.params[paramName] = pathParts[i];
        } else if (patternParts[i] != pathParts[i]) {
            return false;
        }
    }
    
    return true;
}

HttpRequest HttpServer::parseRequest(const std::string& raw) {
    HttpRequest req;
    std::istringstream iss(raw);
    std::string line;
    
    // 解析请求行
    if (std::getline(iss, line)) {
        // 去除\r
        if (!line.empty() && line.back() == '\r') line.pop_back();
        
        std::istringstream lineStream(line);
        lineStream >> req.method >> req.path;
        
        // 分离路径和查询参数
        size_t queryPos = req.path.find('?');
        if (queryPos != std::string::npos) {
            req.query = req.path.substr(queryPos + 1);
            req.path = req.path.substr(0, queryPos);
        }
    }
    
    // 解析请求头
    while (std::getline(iss, line) && line != "\r" && !line.empty()) {
        if (!line.empty() && line.back() == '\r') line.pop_back();
        size_t colonPos = line.find(':');
        if (colonPos != std::string::npos) {
            std::string key = line.substr(0, colonPos);
            std::string value = line.substr(colonPos + 1);
            // 去除前导空格
            value.erase(0, value.find_first_not_of(" \t"));
            req.headers[key] = value;
        }
    }
    
    // 解析请求体
    std::ostringstream bodyStream;
    bodyStream << iss.rdbuf();
    req.body = bodyStream.str();
    
    return req;
}

std::string HttpServer::getMimeType(const std::string& path) {
    if (path.ends_with(".html")) return "text/html";
    if (path.ends_with(".css")) return "text/css";
    if (path.ends_with(".js")) return "application/javascript";
    if (path.ends_with(".json")) return "application/json";
    if (path.ends_with(".png")) return "image/png";
    if (path.ends_with(".jpg") || path.ends_with(".jpeg")) return "image/jpeg";
    if (path.ends_with(".gif")) return "image/gif";
    if (path.ends_with(".svg")) return "image/svg+xml";
    if (path.ends_with(".ico")) return "image/x-icon";
    return "application/octet-stream";
}

void HttpServer::serveStaticFile(const std::string& path, HttpResponse& res) {
    std::string filePath = staticDir_ + path;
    
    // 默认首页
    if (path == "/" || path.empty()) {
        filePath = staticDir_ + "/index.html";
    }
    
    std::ifstream file(filePath, std::ios::binary);
    if (!file.is_open()) {
        res.setStatus(404, "File not found");
        return;
    }
    
    std::ostringstream oss;
    oss << file.rdbuf();
    res.body = oss.str();
    res.headers["Content-Type"] = getMimeType(filePath);
    res.statusCode = 200;
}

void HttpServer::handleClient(int clientFd) {
    try {
        char buffer[8192] = {0};
        ssize_t bytesRead = recv(clientFd, buffer, sizeof(buffer) - 1, 0);
    
        if (bytesRead <= 0) {
            close(clientFd);
            return;
        }
        
        HttpRequest req = parseRequest(buffer);
        HttpResponse res;
        
        // OPTIONS请求（CORS预检）
        if (req.method == "OPTIONS") {
            res.statusCode = 204;
            std::string response = res.toString();
            send(clientFd, response.c_str(), response.size(), 0);
            close(clientFd);
            return;
        }
        
        // 查找路由
        bool found = false;
        if (routes_.count(req.method)) {
            for (const auto& [pattern, handler] : routes_[req.method]) {
                if (matchRoute(pattern, req.path, req)) {
                    try {
                        handler(req, res);
                    } catch (const std::exception& e) {
                        std::cerr << "Handler error: " << e.what() << std::endl;
                        res.setStatus(500);
                        res.setJson("{\"error\": \"服务器内部错误\"}");
                    }
                    found = true;
                    break;
                }
            }
        }
        
        // 未找到路由，尝试静态文件
        if (!found && !staticDir_.empty() && req.method == "GET") {
            serveStaticFile(req.path, res);
            found = true;
        }
        
        if (!found) {
            res.setStatus(404, "{\"error\": \"Not Found\"}");
            res.headers["Content-Type"] = "application/json";
        }
        
        std::string response = res.toString();
        send(clientFd, response.c_str(), response.size(), 0);
        close(clientFd);
    } catch (const std::exception& e) {
        std::cerr << "Client handling error: " << e.what() << std::endl;
        close(clientFd);
    } catch (...) {
        std::cerr << "Unknown error in client handling" << std::endl;
        close(clientFd);
    }
}

void HttpServer::start() {
    serverFd_ = socket(AF_INET, SOCK_STREAM, 0);
    if (serverFd_ < 0) {
        throw std::runtime_error("Failed to create socket");
    }
    
    int opt = 1;
    setsockopt(serverFd_, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    
    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(port_);
    
    if (bind(serverFd_, (sockaddr*)&addr, sizeof(addr)) < 0) {
        close(serverFd_);
        throw std::runtime_error("Failed to bind port " + std::to_string(port_));
    }
    
    if (listen(serverFd_, 10) < 0) {
        close(serverFd_);
        throw std::runtime_error("Failed to listen");
    }
    
    running_ = true;
    std::cout << "服务器启动: http://localhost:" << port_ << std::endl;
    
    while (running_) {
        sockaddr_in clientAddr{};
        socklen_t clientLen = sizeof(clientAddr);
        int clientFd = accept(serverFd_, (sockaddr*)&clientAddr, &clientLen);
        
        if (clientFd < 0) {
            if (running_) {
                std::cerr << "Accept failed" << std::endl;
            }
            continue;
        }
        
        // 使用线程处理客户端请求
        std::thread(&HttpServer::handleClient, this, clientFd).detach();
    }
}

void HttpServer::stop() {
    running_ = false;
    if (serverFd_ >= 0) {
        close(serverFd_);
        serverFd_ = -1;
    }
}
