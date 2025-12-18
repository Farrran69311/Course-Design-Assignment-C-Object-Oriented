#include <iostream>
#include <string>
using namespace std;

// 辅助结构：日期
struct Date {
    int year, month, day;

    // 简单地将日期转换为总天数（简化版，假设每月30天，仅供演示逻辑）
    long toDays() const {
        return year * 365 + month * 30 + day;
    }
};

class Product {
protected:
    string name;
    Date productionDate;
    int shelfLifeDays; // 保质期天数

public:
    Product(string n, Date d, int life) : name(n), productionDate(d), shelfLifeDays(life) {}

    // 虚函数：检查是否过期
    virtual void checkExpiration(Date currentDate) {
        long prodDays = productionDate.toDays();
        long currentDays = currentDate.toDays();
        long diff = currentDays - prodDays;

        if (diff > shelfLifeDays) {
            cout << "【警告】商品 [" << name << "] 已过期! (超期 " << diff - shelfLifeDays << " 天)" << endl;
        } else {
            cout << "商品 [" << name << "] 正常，剩余保质期 " << shelfLifeDays - diff << " 天。" << endl;
        }
    }
};

int main() {
    cout << "=== 题目1：商品过期检查 ===" << endl;
    Date today = {2023, 10, 27}; // 假设今天是 2023年10月27日

    // 创建几个商品
    // 面包：2023-10-20 生产，保质期 5 天 -> 应过期
    Product p1("全麦面包", {2023, 10, 20}, 5);
    // 牛奶：2023-10-25 生产，保质期 7 天 -> 正常
    Product p2("鲜牛奶", {2023, 10, 25}, 7);

    p1.checkExpiration(today);
    p2.checkExpiration(today);
    cout << endl;

    return 0;
}