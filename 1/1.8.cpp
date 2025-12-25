#include <iostream>
using namespace std;

// 1. 定义一个类，专门用来做这个求和任务
class SumCalculator {
public:
    // 成员函数：封装具体的计算逻辑
    int getResult() {
        int sum = 0;
        int sign = 1; // 符号：1正，-1负

        // 逻辑保持原样：处理 1 到 99 的奇数
        for (int i = 1; i <= 99; i += 2) {
            sum += i * sign;
            sign = -sign;     // 变号
        }

        // 加上最后的一个数 100
        sum += 100;

        return sum; // 把算好的结果交出去
    }
};

int main() {
    // 2. 实例化对象（创建一个计算器）
    SumCalculator solver;

    // 3. 调用对象的方法获取结果
    int result = solver.getResult();

    // 4. 输出
    cout << "计算结果为: " << result << endl;

    return 0;
}