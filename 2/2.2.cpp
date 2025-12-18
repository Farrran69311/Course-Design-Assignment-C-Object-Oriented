#include <iostream>
#include <string>

using namespace std;

class Song {
private:
    string singer;
    string title;
    double size; // 假设单位为 MB

public:
    // 构造函数：初始化歌曲信息
    Song(string singer, string title, double size) {
        this->singer = singer;
        this->title = title;
        this->size = size;
    }

    // 成员函数：显示歌曲基本信息
    void show() {
        cout << "--- 歌曲详情 ---" << endl;
        cout << "歌名: " << title << endl;
        cout << "歌手: " << singer << endl;
        cout << "大小: " << size << " MB" << endl;
    }
};

int main() {
    string singer, title;
    double size;

    cout << "请输入歌手姓名: ";
    cin >> singer;
    cout << "请输入歌曲标题: ";
    cin >> title;
    cout << "请输入歌曲大小(MB): ";
    cin >> size;

    // 实例化一个 Song 对象
    Song mySong(singer, title, size);
    
    cout << "歌曲信息:" << endl;
    mySong.show();
    
    return 0;
}