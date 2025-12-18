#!/bin/bash
# 教室资源管理系统 - 服务器启动脚本

SERVER_DIR="/Users/fengrr/Desktop/程序设计方法实现/code/sys/server/build"
SERVER_NAME="classroom_server"
LOG_FILE="$SERVER_DIR/server.log"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

start() {
    echo -e "${YELLOW}启动教室资源管理系统服务器...${NC}"
    
    # 检查是否已经在运行
    if pgrep -f "$SERVER_NAME" > /dev/null; then
        echo -e "${YELLOW}服务器已经在运行中${NC}"
        return
    fi
    
    # 启动服务器
    cd "$SERVER_DIR"
    nohup ./$SERVER_NAME >> "$LOG_FILE" 2>&1 &
    
    sleep 2
    
    if pgrep -f "$SERVER_NAME" > /dev/null; then
        echo -e "${GREEN}✓ 服务器启动成功${NC}"
        echo -e "${GREEN}  访问地址: http://localhost:8080${NC}"
    else
        echo -e "${RED}✗ 服务器启动失败，请查看日志: $LOG_FILE${NC}"
    fi
}

stop() {
    echo -e "${YELLOW}停止服务器...${NC}"
    pkill -f "$SERVER_NAME"
    sleep 1
    if ! pgrep -f "$SERVER_NAME" > /dev/null; then
        echo -e "${GREEN}✓ 服务器已停止${NC}"
    else
        echo -e "${RED}✗ 无法停止服务器${NC}"
    fi
}

restart() {
    stop
    sleep 1
    start
}

status() {
    if pgrep -f "$SERVER_NAME" > /dev/null; then
        echo -e "${GREEN}✓ 服务器运行中${NC}"
        PID=$(pgrep -f "$SERVER_NAME")
        echo -e "  PID: $PID"
        echo -e "  访问地址: http://localhost:8080"
    else
        echo -e "${RED}✗ 服务器未运行${NC}"
    fi
}

log() {
    echo -e "${YELLOW}显示最近的日志...${NC}"
    tail -50 "$LOG_FILE"
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    log)
        log
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|log}"
        echo ""
        echo "  start   - 启动服务器"
        echo "  stop    - 停止服务器"
        echo "  restart - 重启服务器"
        echo "  status  - 查看服务器状态"
        echo "  log     - 查看最近日志"
        exit 1
        ;;
esac

exit 0
