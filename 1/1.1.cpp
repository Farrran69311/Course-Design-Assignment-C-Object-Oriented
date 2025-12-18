#include <iostream>
#include <cmath>    // 用于 abs()
#include <iomanip>  // 用于 setprecision

// 定义一个专门用于计算 Pi 的类
class PiCalculator {
private:
    double precisionThreshold; // 精度阈值

public:
    // 构造函数：初始化精度要求
    // 默认使用 1e-7 以确保小数点后 6 位的准确性
    PiCalculator(double threshold = 1e-7) {
        this->precisionThreshold = threshold;
    }

    // 核心计算方法
    double calculate() {
        double sum = 0.0;
        double denominator = 1.0; // 分母，初始为 1
        int sign = 1;             // 符号，1 表示正，-1 表示负
        double term = 0.0;        // 当前项的值

        while (true) {
            // 计算当前项：符号 / 分母
            term = sign / denominator;
            
            // 累加
            sum += term;

            // 检查精度：如果当前项的绝对值小于阈值，则停止循环
            // std::abs 获取绝对值
            if (std::abs(term) < precisionThreshold) {
                break;
            }

            // 准备下一次迭代
            sign = -sign;           // 符号取反
            denominator += 2.0;     // 分母增加 2 (1, 3, 5, 7...)
        }

        // 公式是 sum = pi / 4，所以 pi = sum * 4
        return sum * 4.0;
    }
};

int main() {
    // 1. 实例化对象
    PiCalculator solver; 

    // 2. 调用对象的方法进行计算
    double result = solver.calculate();

    // 3. 按要求输出结果：精确到小数点后 6 位
    std::cout << "计算结果 Pi 的近似值：" << std::endl;
    std::cout << std::fixed << std::setprecision(6) << result << std::endl;

    return 0;
}