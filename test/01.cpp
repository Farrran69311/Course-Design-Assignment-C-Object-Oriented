#include <iostream>
using namespace std;

class Base {
public:
    int id_number;
    Base(int id) : id_number(id) {}
    virtual void display() {
        cout << "Base ID: " << id_number << endl;
    }
};
class Derived : public Base {
public:
    Derived(int id) : Base(id) {}
    void display() override {
        cout << "Derived ID: " << id_number << endl;
    }
};
int main() {
    Base* obj = new Derived(42);
    obj->display(); // Should call Derived's display method
    delete obj;
    return 0;
}