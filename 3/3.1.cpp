#include <iostream>
using namespace std;

// 题目1: 设计一个矩形类 Triangle
class Triangle {
private:
    double width;
    double height;

public:
    Triangle(double w, double h) : width(w), height(h) {}

    double getArea() const {
        return width * height;
    }

    // 重载 + 运算符：两个对象相加，返回面积之和
    double operator+(const Triangle& other) {
        return this->getArea() + other.getArea();
    }
    
    // 友元函数：允许 double + Triangle 的操作，支持连加
    // 例如: t1 + t2 返回 double，然后结果再 + t3
    friend double operator+(double areaSum, const Triangle& t);
};

// 全局重载函数实现
double operator+(double areaSum, const Triangle& t) {
    return areaSum + t.getArea();
}

int main() {
    int n;
    cout << "--- 题目1: 多个矩形(Triangle类)面积相加 ---" << endl;
    cout << "请输入矩形的数量: ";
    cin >> n;

    if (n <= 0) {
        cout << "数量必须大于0" << endl;
        return 0;
    }

    double totalArea = 0.0;
    
    for (int i = 1; i <= n; ++i) {
        double w, h;
        cout << "请输入第 " << i << " 个矩形的宽和高: ";
        cin >> w >> h;
        Triangle t(w, h);
        
        // 利用重载的 friend operator+(double, Triangle) 累加面积
        // 初始 totalArea 为 0，0 + t1 -> t1.area
        // 之后 (t1.area) + t2 -> t1.area + t2.area ...
        totalArea = totalArea + t;
    }

    cout << "所有 " << n << " 个矩形的面积总和: " << totalArea << endl;
    
    return 0;
}