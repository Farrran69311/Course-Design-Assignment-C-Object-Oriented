#include <iostream>
#include <cmath>
#include <string>

using namespace std;

// 定义 PI 常量 
const double PI = 3.1415926;

// 1. 抽象基类 Shape
class Shape {
public:
    // 纯虚函数：计算面积
    virtual double area() const = 0;
    
    // 纯虚函数：计算体积
    virtual double volume() const = 0;
    
    // 纯虚函数：打印信息
    virtual void print() const = 0;

    // 重要：虚析构函数
    // 确保删除基类指针指向的派生类对象时，派生类的析构函数会被调用
    virtual ~Shape() {
        cout << "Shape destructor called" << endl;
    }
};

// 2. Circle 类，继承自 Shape
class Circle : public Shape {
protected: // 使用 protected 以便 Cylinder 可以访问 radius
    double radius;

public:
    Circle(double r = 0) : radius(r) {}

    // 实现纯虚函数
    double area() const override {
        return PI * radius * radius;
    }

    // 圆是二维图形，体积通常定义为0
    double volume() const override {
        return 0;
    }

    void print() const override {
        cout << "[Circle] Radius: " << radius << endl;
    }
    
    ~Circle() override {
        cout << "Circle destructor called" << endl;
    }
};

// 3. Cylinder 类，继承自 Circle
class Cylinder : public Circle {
private:
    double height;

public:
    Cylinder(double r = 0, double h = 0) : Circle(r), height(h) {}

    // 重写面积计算：圆柱体表面积 = 2 * 底面积 + 侧面积
    double area() const override {
        // Circle::area() 计算的是底面积
        return 2 * Circle::area() + (2 * PI * radius * height);
    }

    // 重写体积计算：底面积 * 高
    double volume() const override {
        return Circle::area() * height;
    }

    void print() const override {
        cout << "[Cylinder] Radius: " << radius << ", Height: " << height << endl;
    }
    
    ~Cylinder() override {
        cout << "Cylinder destructor called" << endl;
    }
};

int main() {
    // 使用基类指针演示多态
    Shape* shapes[2];

    // 创建对象
    shapes[0] = new Circle(5.0);        // 半径为 5 的圆
    shapes[1] = new Cylinder(3.0, 10.0); // 半径为 3，高为 10 的圆柱体

    cout << "=== Calculation Results ===" << endl;

    // 遍历并调用接口
    for (int i = 0; i < 2; i++) {
        shapes[i]->print();
        cout << "Area: " << shapes[i]->area() << endl;
        cout << "Volume: " << shapes[i]->volume() << endl;
        cout << "-----------------------" << endl;
    }

    // 清理内存
    cout << "=== Cleaning up ===" << endl;
    for (int i = 0; i < 2; i++) {
        delete shapes[i]; // 这里会触发虚析构机制
    }

    return 0;
}