#include <iostream>
#include <cstring> // 用于 strcmp
#include <string>  // 用于 std::string
using namespace std;

class Comparator {
public:
    // 1. 通用模板：处理 int, double, std::string 等
    template <typename T>
    static T getMax(T a, T b) {
        return (a > b) ? a : b;
    }
    
    // char* 比较的是地址，用 strcmp 比较内容
    static const char* getMax(const char* a, const char* b) {
        if (std::strcmp(a, b) > 0) {
            return a;
        } else {
            return b;
        }
    }
};

int main() {
    cout << "\n=== 最大值模板 (含字符串处理) ===" << endl;

    int i1 = 10, i2 = 20;
    double d1 = 3.14, d2 = 5.28;
    string s1 = "Apple", s2 = "Banana"; // C++ string 对象
    const char* c1 = "Hello";           // C 风格字符串
    const char* c2 = "World";

    cout << "较大的整数: " << Comparator::getMax(i1, i2) << endl;
    cout << "较大的浮点: " << Comparator::getMax(d1, d2) << endl;
    
    // std::string 直接走通用模板
    cout << "较大的 string: " << Comparator::getMax(s1, s2) << endl;

    // const char* 走特化版本
    cout << "较大的 C-String: " << Comparator::getMax(c1, c2) << endl;

    return 0;
}