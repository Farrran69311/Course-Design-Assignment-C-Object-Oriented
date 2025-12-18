//复制构造函数的应用
#define NAME_LEN 20
#define GENDER_LEN 10
#include <iostream>
#include <cstring>
using namespace std;
class Student {
public:
    char name[NAME_LEN];
    char gender[GENDER_LEN];
    long student_id;

    Student(const char* a,const char* b,long c):student_id(c){
        strcpy(name, a);
        strcpy(gender, b);
        cout<<"Object has been initialized (Constructor)"<<endl;
    }

    // 复制构造函数
    Student(const Student &s) : student_id(s.student_id) {
        strcpy(name, s.name);
        strcpy(gender, s.gender);
        cout<<"Object has been initialized (Copy Constructor)"<<endl;
    }

    //赋值运算符重载
    Student& operator =(const Student &s){
        if (this != &s) {
            strcpy(name, s.name);
            strcpy(gender, s.gender);
            student_id = s.student_id;
            cout<<"Object has been assigned (Operator=)"<<endl;
        }
        return *this;
    }

    // Getters and Setters
    const char* getName() const {
        return name;
    }

    void setName(const char* n) {
        strncpy(name, n, NAME_LEN - 1);
        name[NAME_LEN - 1] = '\0'; // Ensure null-termination
    }

    const char* getGender() const {
        return gender;
    }

    void setGender(const char* g) {
        strncpy(gender, g, GENDER_LEN - 1);
        gender[GENDER_LEN - 1] = '\0'; // Ensure null-termination
    }

    long getStudentId() const {
        return student_id;
    }

    void setStudentId(long id) {
        student_id = id;
    }

    void display(){
        cout<<"Name: "<<name<<", Gender: "<<gender  <<", ID: "<<student_id<<endl;
    }
};
int main(){
    cout << "--- 1. 普通构造 ---" << endl;
    Student stu1("Alice","Female",1001);
    stu1.display();

    cout << "\n--- 2. 复制构造 (初始化) ---" << endl;
    Student stu2 = stu1; // 调用复制构造函数
    stu2.display();

    cout << "\n--- 3. 赋值操作 (已存在对象) ---" << endl;
    Student stu3("Bob", "Male", 1002); // 先普通构造
    stu3 = stu1; // 调用赋值运算符
    stu3.display();

    cout << "\n--- 4. 测试 Get/Set 方法 ---" << endl;
    stu3.setName("Charlie");
    stu3.setStudentId(2001);
    cout << "修改后 stu3: Name=" << stu3.getName() << ", ID=" << stu3.getStudentId() << endl;

    return 0;
}