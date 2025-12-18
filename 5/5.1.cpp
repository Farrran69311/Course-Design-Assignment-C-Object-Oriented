#include <iostream>
#include <string>
using namespace std;

// 基类 1: 书籍
class Book {
public:
    void read() {
        cout << "[功能] 正在阅读书籍内容..." << endl;
    }
};

// 基类 2: 报刊
class Newspaper {
public:
    void browse() {
        cout << "[功能] 正在浏览新闻资讯..." << endl;
    }
};

// 基类 3: 音乐播放器
class MusicPlayer {
public:
    void playMusic() {
        cout << "[功能] 正在播放背景音乐..." << endl;
    }
};

// 派生类: Ebook (多重继承)
class Ebook : public Book, public Newspaper, public MusicPlayer {
public:
    void start() {
        cout << "--- Ebook 启动 ---" << endl;
    }
};

int main() {
    cout << "=== Ebook 多重继承 ===" << endl;
    Ebook myPad;
    myPad.start();
    
    // 调用继承来的各个功能
    myPad.read();       // 来自 Book
    myPad.browse();     // 来自 Newspaper
    myPad.playMusic();  // 来自 MusicPlayer
    
    return 0;
}