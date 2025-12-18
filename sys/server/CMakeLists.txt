cmake_minimum_required(VERSION 3.14)
project(classroom_server LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# macOS Homebrew mysql-client 路径
set(MYSQL_ROOT "/opt/homebrew/opt/mysql-client")
set(MYSQL_INCLUDE_DIRS "${MYSQL_ROOT}/include/mysql")
set(MYSQL_LIBRARY_DIRS "${MYSQL_ROOT}/lib")
set(MYSQL_LIBRARIES "mysqlclient")

link_directories(${MYSQL_LIBRARY_DIRS})

# 添加可执行文件
add_executable(classroom_server
    src/main.cpp
    src/db.cpp
    src/http_server.cpp
)

# 包含目录
target_include_directories(classroom_server PRIVATE 
    include
    ${MYSQL_INCLUDE_DIRS}
)

# 链接库
target_link_libraries(classroom_server
    ${MYSQL_LIBRARIES}
    pthread
)

# 链接目录
target_link_directories(classroom_server PRIVATE
    ${MYSQL_LIBRARY_DIRS}
)
