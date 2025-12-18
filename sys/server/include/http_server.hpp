#ifndef HTTP_SERVER_HPP
#define HTTP_SERVER_HPP

#include <string>
#include <map>
#include <functional>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <thread>
#include <vector>
#include <atomic>

// HTTP请求结构
struct HttpRequest {
    std::string method;
    std::string path;
    std::string query;
    std::map<std::string, std::string> headers;
    std::map<std::string, std::string> params;  // URL参数
    std::string body;
    
    // 解析查询参数
    std::map<std::string, std::string> parseQuery() const;
    
    // 获取路径中的参数（如 /api/classrooms/123 中的 123）
    std::string getPathParam(const std::string& pattern, int index) const;
};

// HTTP响应结构
struct HttpResponse {
    int statusCode = 200;
    std::map<std::string, std::string> headers;
    std::string body;
    
    void setJson(const std::string& json);
    void setHtml(const std::string& html);
    void setStatus(int code, const std::string& message = "");
    std::string toString() const;
};

// 路由处理函数类型
using RouteHandler = std::function<void(const HttpRequest&, HttpResponse&)>;

// 简单HTTP服务器
class HttpServer {
public:
    HttpServer(int port = 8080);
    ~HttpServer();
    
    // 注册路由
    void get(const std::string& path, RouteHandler handler);
    void post(const std::string& path, RouteHandler handler);
    void put(const std::string& path, RouteHandler handler);
    void del(const std::string& path, RouteHandler handler);
    
    // 设置静态文件目录
    void setStaticDir(const std::string& dir);
    
    // 启动服务器
    void start();
    void stop();
    
private:
    int port_;
    int serverFd_;
    std::atomic<bool> running_;
    std::string staticDir_;
    
    std::map<std::string, std::map<std::string, RouteHandler>> routes_;
    
    void handleClient(int clientFd);
    HttpRequest parseRequest(const std::string& raw);
    bool matchRoute(const std::string& pattern, const std::string& path, HttpRequest& req);
    void serveStaticFile(const std::string& path, HttpResponse& res);
    std::string getMimeType(const std::string& path);
};

#endif // HTTP_SERVER_HPP
