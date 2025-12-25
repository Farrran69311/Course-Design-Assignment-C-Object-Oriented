#include <iostream>
#include <string>
#include <cctype> // 包含 isalpha 函数

using namespace std;

// 面向对象方式：定义句子分析器类
class SentenceAnalyzer {
private:
    string sentence;// 私有成员变量：存储句子

public:
    // 构造函数：初始化句子
    SentenceAnalyzer(const string& s) : sentence(s) {}

    // 设置句子的方法
    void setSentence(const string& s) {
        sentence = s;
    }

    // 获取句子的方法
    string getSentence() const {
        return sentence;
    }

    // 统计字母个数的方法
    int countLetters() const {
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

    // 显示分析结果的方法
    void displayResult() const {
        cout << "该句子中字母的个数为: " << countLetters() << endl;
    }
};

int main() {
    string inputSentence;

    // 1. 输入提示
    cout << "请输入一条英文句子: ";

    // 2. 获取输入
    // 注意：这里使用 getline 而不是 cin >>，因为句子可能包含空格
    getline(cin, inputSentence);

    // 3. 创建对象并处理
    SentenceAnalyzer analyzer(inputSentence);

    // 4. 调用对象方法输出结果
    analyzer.displayResult();

    return 0;
}
