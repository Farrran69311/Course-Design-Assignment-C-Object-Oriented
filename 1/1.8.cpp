#include <iostream>

using namespace std;

int main() {
    int sum = 0;
    int sign = 1; // 符号控制：1代表正，-1代表负

    // 循环处理从 1 到 99 的奇数
    // i 每次增加 2 (1, 3, 5...)
    for (int i = 1; i <= 99; i += 2) {
        sum += i * sign; // 累加当前项
        sign = -sign;    // 每次循环后符号取反
    }

    // 加上最后的一个数 100
    sum += 100;

    // 输出结果
    cout << "计算结果为: " << sum << endl;

    return 0;
}