#!/bin/bash
# 教室资源管理系统 - 服务器守护进程
# 自动监控并重启崩溃的服务器

SERVER_DIR="/Users/fengrr/Desktop/程序设计方法实现/code/sys/server/build"
SERVER_NAME="classroom_server"
LOG_FILE="$SERVER_DIR/server.log"
CHECK_INTERVAL=10  # 检查间隔（秒）

echo "[$(date)] 守护进程启动"

while true; do
    # 检查服务器是否在运行
    if ! pgrep -f "$SERVER_NAME" > /dev/null; then
        echo "[$(date)] 检测到服务器已停止，正在重启..." >> "$LOG_FILE"
        
        cd "$SERVER_DIR"
        nohup ./$SERVER_NAME >> "$LOG_FILE" 2>&1 &
        
        sleep 3
        
        if pgrep -f "$SERVER_NAME" > /dev/null; then
            echo "[$(date)] 服务器重启成功" >> "$LOG_FILE"
        else
            echo "[$(date)] 服务器重启失败" >> "$LOG_FILE"
        fi
    fi
    
    sleep $CHECK_INTERVAL
done
