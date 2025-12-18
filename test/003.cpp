#include <iostream>
#include <vector>

using namespace std;

// 基类：形状
class Shape {
public:
    // 虚函数：绘制
    // virtual 关键字告诉编译器，这个函数可以在派生类中被重写 (override)
    // 并且在运行时根据对象的实际类型来决定调用哪个版本
    virtual void draw() {
        cout << "绘制一个通用形状" << endl;
    }

    // 虚函数：计算面积
    virtual double area() {
        return 0.0;
    }

    // 虚析构函数 (非常重要！)
    // 如果基类析构函数不是虚函数，当通过基类指针删除派生类对象时，
    // 只会调用基类的析构函数，导致派生类的资源无法释放（内存泄漏）。
    virtual ~Shape() {
        cout << "Shape 析构函数被调用" << endl;
    }
};

// 派生类：圆形
class Circle : public Shape {
private:
    double radius;
public:
    Circle(double r) : radius(r) {}

    // override 关键字 (C++11) 显式声明我们要重写基类虚函数
    // 这有助于编译器检查拼写错误
    void draw() override {
        cout << "绘制一个圆形 (半径: " << radius << ")" << endl;
    }

    double area() override {
        return 3.14159 * radius * radius;
    }

    ~Circle() {
        cout << "Circle 析构函数被调用" << endl;
    }
};

// 派生类：矩形
class Rectangle : public Shape {
private:
    double width, height;
public:
    Rectangle(double w, double h) : width(w), height(h) {}

    void draw() override {
        cout << "绘制一个矩形 (宽: " << width << ", 高: " << height << ")" << endl;
    }

    double area() override {
        return width * height;
    }

    ~Rectangle() {
        cout << "Rectangle 析构函数被调用" << endl;
    }
};

int main() {
    cout << "--- 1. 静态绑定 (普通对象) ---" << endl;
    Circle c(5.0);
    Rectangle r(4.0, 6.0);
    
    // 编译时就已经确定调用哪个函数
    c.draw(); 
    r.draw(); 

    cout << "\n--- 2. 动态绑定 (多态性) ---" << endl;
    // 基类指针指向派生类对象
    Shape* s1 = new Circle(2.0);
    Shape* s2 = new Rectangle(3.0, 4.0);

    // 运行时根据指针实际指向的对象类型调用对应的函数
    cout << "[s1]: ";
    s1->draw(); // 调用 Circle::draw
    cout << "      面积: " << s1->area() << endl;

    cout << "[s2]: ";
    s2->draw(); // 调用 Rectangle::draw
    cout << "      面积: " << s2->area() << endl;

    cout << "\n--- 3. 虚析构函数演示 ---" << endl;
    // 如果 Shape 析构函数不是 virtual，这里只会打印 "Shape 析构函数被调用"
    // 而不会调用 Circle 或 Rectangle 的析构函数
    delete s1; 
    delete s2; 

    return 0;
}
