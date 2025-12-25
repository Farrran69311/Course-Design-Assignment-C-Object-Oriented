#include <iostream>
#include <cmath>
#include <iomanip>
using namespace std;

// 1. 定义类
class PiCalculator {
public:
    // 成员函数
    double run() {
        double sum = 0.0;
        double n = 1.0;   // 分母
        int sign = 1;     // 符号
        double term;      // 当前项

        while (true) {
            term = sign / n;      
            if (abs(term) < 1e-7) break; 

            sum += term;          // 累加
            sign = -sign;         // 变号
            n += 2.0;             // 分母+2
        }
        return sum * 4.0;
    }
};

int main() {
    // 2. 实例化对象
    PiCalculator p; 

    // 3.调用方法）
    double result = p.run();

    // 输出结果
    cout << fixed << setprecision(6) << "Pi = " << result << endl;

    return 0;
}