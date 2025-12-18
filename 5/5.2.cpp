#include <iostream>
#include <string>
using namespace std;

// 1. 定义配件基类
class ComputerAccessory {
protected:
    string manufacturer; // 制造商
    double price;        // 价格

public:
    ComputerAccessory(string m, double p) {
        manufacturer = m;
        price = p;
    }
    
    double getPrice() const { return price; }
    
    void showBasicInfo() const {
        cout << "厂商: " << manufacturer << ", 价格: " << price;
    }
};

// 2. 定义具体配件 (继承自基类)

// 主板
class MotherBoard : public ComputerAccessory {
private:
    string chipset; // 芯片组
public:
    MotherBoard(string m, double p, string chip) 
        : ComputerAccessory(m, p), chipset(chip) {}
};

// 内存
class Memory : public ComputerAccessory {
private:
    int capacity; // 容量 (GB)
public:
    Memory(string m, double p, int cap) 
        : ComputerAccessory(m, p), capacity(cap) {}
};

// 显示器
class Monitor : public ComputerAccessory {
private:
    string mtype; 
public:
    Monitor(string m, double p, string type) 
        : ComputerAccessory(m, p), mtype(type) {}
};

// 3. 定义计算机类 (包含配件)
class Computer {
private:
    MotherBoard mb;
    Memory mem;
    Monitor mon;

public:
    // 构造函数初始化列表：初始化内部的配件对象
    Computer(MotherBoard b, Memory m, Monitor s) 
        : mb(b), mem(m), mon(s) {}

    // 计算总价
    double calculateTotalPrice() {
        return mb.getPrice() + mem.getPrice() + mon.getPrice();
    }

    void showSpecs() {
        cout << "--- 计算机配置清单 ---" << endl;
        cout << "主板: "; mb.showBasicInfo(); cout << endl;
        cout << "内存: "; mem.showBasicInfo(); cout << endl;
        cout << "显示: "; mon.showBasicInfo(); cout << endl;
    }
};

int main() {
    cout << "\n=== 计算机组装 ===" << endl;
    
    // 创建配件
    MotherBoard myMB("Asus", 1500.0, "Z790");
    Memory myMem("Kingston", 400.0, 16);
    Monitor myMon("Dell", 1200.0, "IPS 2K");

    // 组装电脑
    Computer myPC(myMB, myMem, myMon);

    // 显示信息和总价
    myPC.showSpecs();
    cout << "整机总价: " << myPC.calculateTotalPrice() << " 元" << endl;

    return 0;
}