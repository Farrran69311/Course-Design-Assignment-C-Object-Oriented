#include <iostream>
#include <string>
using namespace std;

class ArrayUtils {
public:
    // 函数模板：统计数组 arr 中等于 target 的元素个数
    template <typename T>
    static int countEquals(T arr[], int n, T target) {
        int count = 0;
        for (int i = 0; i < n; ++i) {
            if (arr[i] == target) {
                count++;
            }
        }
        return count;
    }
};

int main() {
    cout << "\n=== 统计相等元素个数 ===" << endl;

    int intArr[] = {1, 2, 3, 2, 4, 2, 5};
    char charArr[] = {'a', 'b', 'a', 'c', 'a'};
    string strArr[] = {"cat", "dog", "cat", "bird"};

    // 统计整数 2 出现的次数
    int intCount = ArrayUtils::countEquals(intArr, 7, 2);
    cout << "整数数组中 2 出现的次数: " << intCount << endl;

    // 统计字符 'a' 出现的次数
    int charCount = ArrayUtils::countEquals(charArr, 5, 'a');
    cout << "字符数组中 'a' 出现的次数: " << charCount << endl;

    // 统计字符串 "cat" 出现的次数
    int strCount = ArrayUtils::countEquals(strArr, 4, string("cat"));
    cout << "字符串数组中 \"cat\" 出现的次数: " << strCount << endl;

    return 0;
}