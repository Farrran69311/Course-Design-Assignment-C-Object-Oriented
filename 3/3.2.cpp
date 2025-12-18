// 题目2: 向量类 Vector
#include <iostream>
using namespace std;

class Vector {
private:
    int x, y;

public:
    Vector(int x = 0, int y = 0) : x(x), y(y) {}

    // 重载 + : 向量加法
    Vector operator+(const Vector& other) {
        return Vector(this->x + other.x, this->y + other.y);
    }

    // 重载 - : 向量减法
    Vector operator-(const Vector& other) {
        return Vector(this->x - other.x, this->y - other.y);
    }

    void show() const {
        cout << "(" << x << ", " << y << ")" << endl;
    }
};

int main() {
    int x1, y1, x2, y2;
    
    cout << "--- 题目2: 向量加减法 ---" << endl;
    
    cout << "请输入向量 v1 的坐标 (x y): ";
    cin >> x1 >> y1;
    Vector v1(x1, y1);

    cout << "请输入向量 v2 的坐标 (x y): ";
    cin >> x2 >> y2;
    Vector v2(x2, y2);

    Vector vSum = v1 + v2;
    Vector vSub = v1 - v2;

    cout << "v1 + v2 = "; vSum.show();
    cout << "v1 - v2 = "; vSub.show();
    
    return 0;
}