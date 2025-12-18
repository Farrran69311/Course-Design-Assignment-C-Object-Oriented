#include <iostream>
#include <cmath> // 用于 sqrt() 和 pow()

using namespace std;

// 定义 Point 类
class Point {
public:
    double x, y;

    // 构造函数
    Point(double x = 0, double y = 0) : x(x), y(y) {}
};

// 定义 Line 类
class Line {
private:
    Point p1; // 端点1
    Point p2; // 端点2

public:
    // 构造函数：接收两个 Point 对象作为参数
    Line(Point start, Point end) : p1(start), p2(end) {}

    // 成员函数：计算线段长度
    double getLength() {
        // 距离公式: sqrt((x1-x2)^2 + (y1-y2)^2)
        double dx = p1.x - p2.x;
        double dy = p1.y - p2.y;
        return std::sqrt(std::pow(dx, 2) + std::pow(dy, 2));
    }
};

int main() {
    double x1, y1, x2, y2;
    cout << "请输入起点坐标 (x1 y1): ";
    cin >> x1 >> y1;
    cout << "请输入终点坐标 (x2 y2): ";
    cin >> x2 >> y2;

    // 1. 创建两个点对象
    Point startPoint(x1, y1);
    Point endPoint(x2, y2);

    // 2. 用这两个点创建一个线段对象
    Line line(startPoint, endPoint);

    // 3. 计算并输出长度
    cout << "线段长度: " << line.getLength() << endl;
    
    return 0;
}