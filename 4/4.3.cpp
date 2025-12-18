#include <iostream>
using namespace std;

// 定义一个排序工具类
class Sorter {
public:
    // 函数模板：可以处理 int, float, double 等支持 > 运算符的类型
    template <typename T>
    static void sortArray(T arr[], int n) {
        for (int i = 0; i < n - 1; ++i) {
            for (int j = 0; j < n - i - 1; ++j) {
                if (arr[j] > arr[j + 1]) {
                    T temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }

    // 辅助函数：打印数组
    template <typename T>
    static void printArray(T arr[], int n) {
        for (int i = 0; i < n; ++i) {
            cout << arr[i] << " ";
        }
        cout << endl;
    }
};

int main() {
    cout << "=== 多类型排序 ===" << endl;

    int intArr[] = {5, 2, 9, 1, 5, 6};
    float floatArr[] = {3.5f, 1.2f, 4.8f, 2.1f};
    double doubleArr[] = {9.99, 1.11, 5.55, 3.33};

    // 调用类的静态成员函数
    Sorter::sortArray(intArr, 6);
    cout << "Int 排序后: ";
    Sorter::printArray(intArr, 6);

    Sorter::sortArray(floatArr, 4);
    cout << "Float 排序后: ";
    Sorter::printArray(floatArr, 4);

    Sorter::sortArray(doubleArr, 4);
    cout << "Double 排序后: ";
    Sorter::printArray(doubleArr, 4);

    return 0;
}