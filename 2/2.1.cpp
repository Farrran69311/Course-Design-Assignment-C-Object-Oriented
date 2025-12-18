#include <iostream>
#include <cmath> // 用于 abs() 函数

using namespace std;

class Rectangle {
private:
    // 矩形的属性：左下角 (x1, y1) 和 右上角 (x2, y2)
    double x1, y1, x2, y2;

public:
    // 构造函数：初始化矩形的两个顶点
    Rectangle(double x1, double y1, double x2, double y2) {
        this->x1 = x1;
        this->y1 = y1;
        this->x2 = x2;
        this->y2 = y2;
    }

    // 成员函数：计算面积
    double getArea() {
        double width = std::abs(x2 - x1);  // 计算宽度
        double height = std::abs(y2 - y1); // 计算高度
        return width * height;
    }
};

int main() {
    double x1, y1, x2, y2;
    cout << "请输入矩形左下角坐标 (x1 y1) 和右上角坐标 (x2 y2): ";
    cin >> x1 >> y1 >> x2 >> y2;

    // 实例化一个矩形对象
    Rectangle rect(x1, y1, x2, y2);

    cout << "矩形面积: " << rect.getArea() << endl;
    return 0;
}