#include <iostream>
using namespace std;

// 基类
class High {
protected:
    double h; // 高度

public:
    High(double height) : h(height) {}

    // 虚函数
    virtual void disp() {
        cout << "这是一个通用高度对象，高度为: " << h << endl;
    }
};

// 长方体类
class Cuboid : public High {
private:
    double length;
    double width;

public:
    Cuboid(double height, double l, double w) : High(height), length(l), width(w) {}

    void disp() override {
        double volume = length * width * h;
        cout << "长方体 (长" << length << ", 宽" << width << ", 高" << h 
             << ") 的体积是: " << volume << endl;
    }
};

// 圆柱体类
class Cylinder : public High {
private:
    double radius;
    const double PI = 3.14159;

public:
    Cylinder(double height, double r) : High(height), radius(r) {}

    void disp() override {
        double volume = PI * radius * radius * h;
        cout << "圆柱体 (半径" << radius << ", 高" << h 
             << ") 的体积是: " << volume << endl;
    }
};

int main() {
    cout << "=== 题目3：动态调用虚函数求体积 ===" << endl;
    
    // 1. 定义基类指针
    High* p;

    // 2. 创建派生类对象
    Cuboid box(10.0, 5.0, 4.0);    // 高10, 长5, 宽4
    Cylinder can(10.0, 2.0);       // 高10, 半径2

    // 3. 动态调用 - 指向长方体
    p = &box;
    p->disp(); // 调用的是 Cuboid::disp()

    // 4. 动态调用 - 指向圆柱体
    p = &can;
    p->disp(); // 调用的是 Cylinder::disp()

    return 0;
}