// 题目3: 点类 Point
#include <iostream>
using namespace std;

class Point {
private:
    int x, y;

public:
    Point(int x = 0, int y = 0) : x(x), y(y) {}

    void show() const {
        cout << "Point(" << x << ", " << y << ")" << endl;
    }

    // --- 重载 ++ (自增) ---
    
    // 1. 前缀形式 (++p): 先加，再返回自己
    Point& operator++() {
        x++;
        y++;
        return *this; 
    }

    // 2. 后缀形式 (p++): 先保存旧值，再加，返回旧值
    // 注意参数里的 int 是占位符，专门用来区分后缀
    Point operator++(int) {
        Point temp = *this; // 保存旧状态
        x++;
        y++;
        return temp; // 返回改变前的状态
    }

    // --- 重载 -- (自减) ---

    // 1. 前缀形式 (--p)
    Point& operator--() {
        x--;
        y--;
        return *this;
    }

    // 2. 后缀形式 (p--)
    Point operator--(int) {
        Point temp = *this;
        x--;
        y--;
        return temp;
    }
};

int main() {
    int x, y;
    cout << "--- 题目3: 点的自增自减 ---" << endl;
    cout << "请输入点的坐标 (x y): ";
    cin >> x >> y;
    
    Point p(x, y);
    cout << "初始状态: "; p.show();

    // 测试前缀 ++
    cout << "\n[测试前缀 ++p]" << endl;
    Point p2 = ++p; 
    cout << "执行 p2 = ++p 后: " << endl;
    cout << "p  = "; p.show();
    cout << "p2 = "; p2.show();

    // 测试后缀 ++
    cout << "\n[测试后缀 p++]" << endl;
    Point p3 = p++;
    cout << "执行 p3 = p++ 后: " << endl;
    cout << "p  = "; p.show();
    cout << "p3 = "; p3.show();
    
    // 测试前缀 --
    cout << "\n[测试前缀 --p]" << endl;
    Point p4 = --p;
    cout << "执行 p4 = --p 后: " << endl;
    cout << "p  = "; p.show();
    cout << "p4 = "; p4.show();

    // 测试后缀 --
    cout << "\n[测试后缀 p--]" << endl;
    Point p5 = p--;
    cout << "执行 p5 = p-- 后: " << endl;
    cout << "p  = "; p.show();
    cout << "p5 = "; p5.show();

    return 0;
}