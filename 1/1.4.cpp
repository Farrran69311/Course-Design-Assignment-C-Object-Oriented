#include <iostream>
#include <string>
#include <cctype> // 包含 isalpha 函数

using namespace std;

// 定义统计函数
// 参数使用 const string& (常量引用)，避免复制长字符串，提高效率
int countLetters(const string& sentence) {
    int count = 0;
    
    // 使用范围 for 循环遍历字符串中的每一个字符
    for (char c : sentence) {
        // isalpha(c) 检查字符 c 是否为字母（包括大写和小写）
        if (isalpha(c)) {
            count++;
        }
    }
    
    return count;
}

int main() {
    string inputSentence;

    // 1. 输入提示
    cout << "请输入一条英文句子: ";

    // 2. 获取输入
    // 注意：这里使用 getline 而不是 cin >>，因为句子可能包含空格
    getline(cin, inputSentence);

    // 3. 调用函数处理
    int result = countLetters(inputSentence);

    // 4. 输出结果
    cout << "该句子中字母的个数为: " << result << endl;

    return 0;
}