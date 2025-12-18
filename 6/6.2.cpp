#include <iostream>
#include <cmath> // 用于 sqrt 和 acos(-1.0)
using namespace std;

const double PI = 3.1415926;

class Object {
protected:
    // 管理三个数据，具体含义由子类定义
    double data1, data2, data3;

public:
    Object(double d1, double d2, double d3) : data1(d1), data2(d2), data3(d3) {}

    // 纯虚函数：计算面积
    virtual double area() = 0;
};

// 圆类
class Circle : public Object {
public:
    // 假设数据为：圆心x, 圆心y, 半径r
    // 计算面积只需要 r (data3)
    Circle(double x, double y, double r) : Object(x, y, r) {}

    double area() override {
        return PI * data3 * data3;
    }
};

// 三角形类
class Triangle : public Object {
public:
    // 数据为三边长 a, b, c
    Triangle(double a, double b, double c) : Object(a, b, c) {}

    double area() override {
        // 海伦公式
        double p = (data1 + data2 + data3) / 2.0; // 半周长
        // 检查是否构成三角形
        if (data1 + data2 > data3 && data1 + data3 > data2 && data2 + data3 > data1) {
             return sqrt(p * (p - data1) * (p - data2) * (p - data3));
        } else {
            cout << " (无效的三角形边长) ";
            return 0.0;
        }
    }
};

int main() {
    cout << "=== 题目2：图形面积计算 ===" << endl;
    
    // 使用基类指针实现多态
    Object* shape1 = new Circle(0, 0, 5.0);   // 半径为 5 的圆
    Object* shape2 = new Triangle(3, 4, 5);   // 边长 3,4,5 的三角形

    cout << "圆的面积: " << shape1->area() << endl;
    cout << "三角形的面积: " << shape2->area() << endl;

    delete shape1;
    delete shape2;
    cout << endl;
    return 0;
}