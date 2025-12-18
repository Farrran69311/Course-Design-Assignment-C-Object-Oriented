#include <iostream>
#include <string>
using namespace std;

// 顶级基类: 员工
class Employee {
protected:
    string name;
    int id;
    
public:
    Employee(string n, int i) : name(n), id(i) {}
    
    // 纯虚函数，使 Employee 成为抽象类 (可选，但推荐)
    // 这里为了简单，我们定义一个普通的虚函数
    virtual double calculateSalary() {
        return 0; 
    }

    void showBasic() {
        cout << "姓名: " << name << " (ID: " << id << ")";
    }
};

// 派生类 1: 销售人员 (使用 virtual 继承解决菱形问题)
class Salesman : virtual public Employee {
protected:
    double sales; // 销售额
    double rate;  // 提成率

public:
    // 注意：虚继承的派生类构造函数只负责初始化自己的成员
    Salesman(string n, int i, double s, double r) 
        : Employee(n, i), sales(s), rate(r) {}

    double calculateSalary() override {
        return sales * rate;
    }
};

// 派生类 2: 经理 (使用 virtual 继承)
class Manager : virtual public Employee {
protected:
    double monthly_salary; // 固定月薪

public:
    Manager(string n, int i, double m) 
        : Employee(n, i), monthly_salary(m) {}

    double calculateSalary() override {
        return monthly_salary;
    }
};

// 最终派生类: 销售经理
class SalesManager : public Salesman, public Manager {
public:
    // 关键点：对于虚继承，最底层的派生类必须显式初始化【顶级基类 Employee】
    SalesManager(string n, int i, double s, double r, double m)
        : Employee(n, i),         // 直接初始化顶级基类
          Salesman(n, i, s, r),   // 初始化父类1
          Manager(n, i, m)        // 初始化父类2
    {}

    // 工资计算：这里定义为 固定工资 + 提成
    double calculateSalary() override {
        return monthly_salary + (sales * rate);
    }
};

int main() {
    cout << "\n=== 题目3: 工资系统 (虚继承) ===" << endl;

    // 1. 普通销售
    Salesman s1("小王", 101, 50000, 0.05);
    s1.showBasic();
    cout << " 工资: " << s1.calculateSalary() << endl;

    // 2. 普通经理
    Manager m1("老李", 102, 8000);
    m1.showBasic();
    cout << " 工资: " << m1.calculateSalary() << endl;

    // 3. 销售经理 (兼具两者特性)
    // 假设: 固定工资 6000 + 销售额 100000 * 提成 0.03
    SalesManager sm("张总", 103, 100000, 0.03, 6000);
    sm.showBasic();
    cout << " 工资: " << sm.calculateSalary() << endl;
    
    return 0;
}