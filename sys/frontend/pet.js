/**
 * 桌宠系统 - Desktop Pet System
 * 一个可爱的桌宠助手，支持拖拽、互动、系统集成
 */

class DesktopPet {
    constructor() {
        this.element = document.getElementById('desktop-pet');
        this.speechBubble = document.getElementById('petSpeechBubble');
        this.speechText = document.getElementById('petSpeechText');
        this.menu = document.getElementById('pet-menu');
        this.statusIndicator = document.getElementById('petStatusIndicator');
        
        // 状态
        this.state = {
            name: '小助手',
            happiness: 100,
            energy: 100,
            mood: 'idle',  // idle, happy, surprised, sleeping, thinking, waving
            isSleeping: false,
            isDragging: false,
            lastInteraction: Date.now(),
            position: { x: null, y: null },
            settings: {
                position: 'bottom-right',
                interactionFreq: 'medium',
                soundEnabled: false,
                notifyEnabled: true,
                autoSleep: true
            }
        };
        
        // 拖拽相关
        this.dragOffset = { x: 0, y: 0 };
        
        // 定时器
        this.timers = {
            autoTalk: null,
            sleep: null,
            statusUpdate: null,
            eyeFollow: null
        };
        
        // 话语库
        this.dialogues = {
            greet: [
                '你好呀！今天也要加油哦~',
                '嗨！见到你真开心 ヾ(≧▽≦*)o',
                '欢迎回来！我等你好久啦~',
                '哇，你来啦！(◕ᴗ◕✿)',
                '今天天气真不错呢~'
            ],
            idle: [
                '有什么我可以帮你的吗？',
                '点击我可以和我互动哦~',
                '无聊的话可以找我聊天~',
                '我在这里陪着你呢 ♪(´▽｀)',
                '嗯...今天要做什么呢？'
            ],
            click: [
                '嘿嘿，被你发现啦~',
                '别戳我啦，痒痒的 (>﹏<)',
                '想和我说什么呀？',
                '呀！你点到我了~',
                '哈哈，我在呢！'
            ],
            drag: [
                '呀！你要带我去哪里~',
                '稳住稳住，不要掉下去！',
                '嘻嘻，飞起来啦~',
                '哇，好高好高！',
                '我可以看到新风景啦~'
            ],
            encourage: [
                '你是最棒的！加油！💪',
                '相信自己，你可以的！',
                '每一步都是进步，继续加油~',
                '困难只是暂时的，你一定能克服！',
                '我永远支持你！(ง •̀_•́)ง',
                '今天的努力是明天的收获~',
                '休息一下也很重要哦~'
            ],
            summary: [
                '让我看看今天的情况...',
                '正在为您整理数据~',
                '今天系统运行正常！',
                '数据已经准备好啦~'
            ],
            sleep: [
                '好困呀...让我休息一下吧...',
                'zzZ...zzZ...',
                '晚安...做个好梦...',
                '我先睡一会儿...有事叫我哦...'
            ],
            wakeup: [
                '嗯...醒了醒了！',
                '哈~睡得真香~',
                '我回来啦！精神满满~',
                '呀，睡过头了吗？'
            ],
            notice: [
                '📢 有新通知哦！',
                '叮咚~ 来消息啦！',
                '主人，有新消息！',
                '注意！有事情要处理~'
            ],
            weather: [
                '今天心情晴朗~☀️',
                '感觉今天会很顺利呢~',
                '有点想吃好吃的...',
                '今天适合努力工作！'
            ]
        };
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.bindEvents();
        this.startTimers();
        this.setInitialPosition();
        
        // 初始化后打招呼
        setTimeout(() => {
            this.say(this.getRandomDialogue('greet'));
            this.setMood('waving');
            setTimeout(() => this.setMood('idle'), 2000);
        }, 1000);
        
        console.log('🐱 桌宠系统已启动！');
    }
    
    // ========== 设置管理 ==========
    
    loadSettings() {
        const saved = localStorage.getItem('petSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.state = { ...this.state, ...settings };
            } catch (e) {
                console.error('加载桌宠设置失败:', e);
            }
        }
        this.updateStatsDisplay();
    }
    
    saveSettings() {
        const toSave = {
            name: this.state.name,
            happiness: this.state.happiness,
            energy: this.state.energy,
            position: this.state.position,
            settings: this.state.settings
        };
        localStorage.setItem('petSettings', JSON.stringify(toSave));
    }
    
    // ========== 事件绑定 ==========
    
    bindEvents() {
        // 鼠标事件
        this.element.addEventListener('mousedown', (e) => this.onDragStart(e));
        document.addEventListener('mousemove', (e) => this.onDragMove(e));
        document.addEventListener('mouseup', (e) => this.onDragEnd(e));
        
        // 触摸事件（移动端）
        this.element.addEventListener('touchstart', (e) => this.onDragStart(e));
        document.addEventListener('touchmove', (e) => this.onDragMove(e));
        document.addEventListener('touchend', (e) => this.onDragEnd(e));
        
        // 点击事件
        this.element.addEventListener('click', (e) => this.onClick(e));
        
        // 右键菜单
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.toggleMenu();
        });
        
        // 双击事件
        this.element.addEventListener('dblclick', () => {
            this.toggleMenu();
        });
        
        // 鼠标移动 - 眼睛跟随
        document.addEventListener('mousemove', (e) => this.followEyes(e));
        
        // 点击其他区域关闭菜单
        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target) && !this.menu.contains(e.target)) {
                this.closeMenu();
            }
        });
        
        // 监听系统通知
        this.listenForNotifications();
    }
    
    // ========== 拖拽功能 ==========
    
    onDragStart(e) {
        if (e.button === 2) return; // 右键不拖拽
        
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        
        const rect = this.element.getBoundingClientRect();
        this.dragOffset.x = clientX - rect.left;
        this.dragOffset.y = clientY - rect.top;
        
        this.state.isDragging = true;
        this.element.classList.add('dragging');
        
        // 关闭菜单
        this.closeMenu();
    }
    
    onDragMove(e) {
        if (!this.state.isDragging) return;
        
        e.preventDefault();
        
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        
        let newX = clientX - this.dragOffset.x;
        let newY = clientY - this.dragOffset.y;
        
        // 边界限制
        const maxX = window.innerWidth - this.element.offsetWidth;
        const maxY = window.innerHeight - this.element.offsetHeight;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        this.element.style.left = newX + 'px';
        this.element.style.top = newY + 'px';
        this.element.style.right = 'auto';
        this.element.style.bottom = 'auto';
        
        this.state.position = { x: newX, y: newY };
    }
    
    onDragEnd(e) {
        if (!this.state.isDragging) return;
        
        this.state.isDragging = false;
        this.element.classList.remove('dragging');
        
        // 拖拽结束说话
        if (Math.random() > 0.5) {
            this.say(this.getRandomDialogue('drag'));
        }
        
        this.saveSettings();
        this.recordInteraction();
    }
    
    // ========== 点击互动 ==========
    
    onClick(e) {
        // 忽略拖拽触发的点击
        if (this.state.isDragging) return;
        
        this.recordInteraction();
        
        // 如果在睡觉，先唤醒
        if (this.state.isSleeping) {
            this.wakeUp();
            return;
        }
        
        // 随机互动
        this.say(this.getRandomDialogue('click'));
        this.setMood('happy');
        this.addHappiness(5);
        
        // 一段时间后恢复
        setTimeout(() => {
            if (!this.state.isSleeping) {
                this.setMood('idle');
            }
        }, 2000);
    }
    
    // ========== 眼睛跟随鼠标 ==========
    
    followEyes(e) {
        if (this.state.isSleeping || this.state.isDragging) return;
        
        const eyes = this.element.querySelectorAll('.pet-pupil');
        const rect = this.element.getBoundingClientRect();
        const petCenterX = rect.left + rect.width / 2;
        const petCenterY = rect.top + rect.height / 3;
        
        const angle = Math.atan2(e.clientY - petCenterY, e.clientX - petCenterX);
        const distance = Math.min(3, Math.hypot(e.clientX - petCenterX, e.clientY - petCenterY) / 50);
        
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        
        eyes.forEach(pupil => {
            pupil.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
        });
    }
    
    // ========== 状态管理 ==========
    
    setMood(mood) {
        this.element.classList.remove('idle', 'happy', 'surprised', 'sleeping', 'thinking', 'waving');
        this.element.classList.add(mood);
        this.state.mood = mood;
    }
    
    addHappiness(amount) {
        this.state.happiness = Math.min(100, Math.max(0, this.state.happiness + amount));
        this.updateStatsDisplay();
        this.saveSettings();
    }
    
    addEnergy(amount) {
        this.state.energy = Math.min(100, Math.max(0, this.state.energy + amount));
        this.updateStatsDisplay();
        this.saveSettings();
    }
    
    updateStatsDisplay() {
        const happinessEl = document.getElementById('petHappiness');
        const energyEl = document.getElementById('petEnergy');
        
        if (happinessEl) happinessEl.textContent = this.state.happiness;
        if (energyEl) energyEl.textContent = this.state.energy;
    }
    
    recordInteraction() {
        this.state.lastInteraction = Date.now();
        
        // 重置睡眠定时器
        if (this.state.settings.autoSleep) {
            this.resetSleepTimer();
        }
    }
    
    // ========== 说话功能 ==========
    
    say(text, duration = 4000) {
        if (!text) return;
        
        this.speechText.textContent = text;
        this.speechBubble.classList.add('show');
        
        // 清除之前的隐藏定时器
        if (this.timers.hideSpeech) {
            clearTimeout(this.timers.hideSpeech);
        }
        
        this.timers.hideSpeech = setTimeout(() => {
            this.speechBubble.classList.remove('show');
        }, duration);
    }
    
    getRandomDialogue(category) {
        const dialogues = this.dialogues[category];
        if (!dialogues || dialogues.length === 0) return '';
        return dialogues[Math.floor(Math.random() * dialogues.length)];
    }
    
    // ========== 菜单功能 ==========
    
    toggleMenu() {
        if (this.menu.classList.contains('show')) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    openMenu() {
        this.menu.classList.add('show');
        this.updateMenuPosition();
    }
    
    closeMenu() {
        this.menu.classList.remove('show');
    }
    
    updateMenuPosition() {
        const petRect = this.element.getBoundingClientRect();
        const menuHeight = this.menu.offsetHeight;
        
        // 确保菜单在视口内
        let top = petRect.top - menuHeight - 10;
        let left = petRect.left;
        
        if (top < 10) {
            top = petRect.bottom + 10;
        }
        
        if (left + 200 > window.innerWidth) {
            left = window.innerWidth - 210;
        }
        
        this.menu.style.top = top + 'px';
        this.menu.style.left = left + 'px';
        this.menu.style.bottom = 'auto';
        this.menu.style.right = 'auto';
    }
    
    // ========== 定时器 ==========
    
    startTimers() {
        // 自动说话
        this.startAutoTalk();
        
        // 状态更新
        this.timers.statusUpdate = setInterval(() => {
            this.updateStatus();
        }, 60000); // 每分钟
        
        // 睡眠检测
        if (this.state.settings.autoSleep) {
            this.resetSleepTimer();
        }
    }
    
    startAutoTalk() {
        const intervals = {
            high: 30000,    // 30秒
            medium: 60000,  // 1分钟
            low: 180000     // 3分钟
        };
        
        const interval = intervals[this.state.settings.interactionFreq] || intervals.medium;
        
        if (this.timers.autoTalk) {
            clearInterval(this.timers.autoTalk);
        }
        
        this.timers.autoTalk = setInterval(() => {
            if (!this.state.isSleeping && Math.random() > 0.5) {
                this.say(this.getRandomDialogue('idle'));
            }
        }, interval);
    }
    
    resetSleepTimer() {
        if (this.timers.sleep) {
            clearTimeout(this.timers.sleep);
        }
        
        // 5分钟无操作进入睡眠
        this.timers.sleep = setTimeout(() => {
            if (this.state.settings.autoSleep && !this.state.isSleeping) {
                this.goToSleep();
            }
        }, 300000);
    }
    
    updateStatus() {
        // 随时间降低能量
        this.addEnergy(-2);
        
        // 如果能量太低，自动睡觉
        if (this.state.energy < 20 && !this.state.isSleeping) {
            this.say('好累呀...需要休息一下...');
            setTimeout(() => this.goToSleep(), 3000);
        }
    }
    
    // ========== 睡眠功能 ==========
    
    goToSleep() {
        this.state.isSleeping = true;
        this.setMood('sleeping');
        this.say(this.getRandomDialogue('sleep'), 3000);
        this.closeMenu();
        
        // 睡眠恢复能量
        this.timers.sleepRecover = setInterval(() => {
            this.addEnergy(5);
            if (this.state.energy >= 100) {
                clearInterval(this.timers.sleepRecover);
            }
        }, 10000);
    }
    
    wakeUp() {
        this.state.isSleeping = false;
        this.setMood('idle');
        this.say(this.getRandomDialogue('wakeup'));
        
        if (this.timers.sleepRecover) {
            clearInterval(this.timers.sleepRecover);
        }
        
        this.recordInteraction();
    }
    
    // ========== 位置设置 ==========
    
    setInitialPosition() {
        if (this.state.position.x !== null && this.state.position.y !== null) {
            // 使用保存的位置
            this.element.style.left = this.state.position.x + 'px';
            this.element.style.top = this.state.position.y + 'px';
            this.element.style.right = 'auto';
            this.element.style.bottom = 'auto';
        } else {
            // 使用默认位置
            this.applyPositionPreset(this.state.settings.position);
        }
    }
    
    applyPositionPreset(preset) {
        this.element.style.left = 'auto';
        this.element.style.top = 'auto';
        this.element.style.right = 'auto';
        this.element.style.bottom = 'auto';
        
        switch (preset) {
            case 'bottom-right':
                this.element.style.bottom = '30px';
                this.element.style.right = '30px';
                break;
            case 'bottom-left':
                this.element.style.bottom = '30px';
                this.element.style.left = '30px';
                break;
            case 'top-right':
                this.element.style.top = '100px';
                this.element.style.right = '30px';
                break;
            case 'top-left':
                this.element.style.top = '100px';
                this.element.style.left = '30px';
                break;
        }
        
        this.state.position = { x: null, y: null };
    }
    
    // ========== 系统集成 ==========
    
    listenForNotifications() {
        // 监听全局通知事件
        window.addEventListener('system-notification', (e) => {
            this.onSystemNotification(e.detail);
        });
        
        // 重写 showAlert 以触发桌宠反应
        const originalShowAlert = window.showAlert;
        if (typeof originalShowAlert === 'function') {
            window.showAlert = (message, type) => {
                originalShowAlert(message, type);
                this.onSystemNotification({ message, type });
            };
        }
    }
    
    onSystemNotification(notification) {
        if (!this.state.settings.notifyEnabled) return;
        
        // 唤醒
        if (this.state.isSleeping) {
            this.wakeUp();
        }
        
        // 根据通知类型反应
        const { message, type } = notification;
        
        if (type === 'success') {
            this.setMood('happy');
            this.say('太棒了！操作成功啦~ 🎉');
        } else if (type === 'danger' || type === 'error') {
            this.setMood('surprised');
            this.say('哎呀！出了点问题... 😟');
        } else if (type === 'warning') {
            this.setMood('thinking');
            this.say('嗯...需要注意一下哦~');
        } else {
            this.showStatusIndicator();
            this.say(this.getRandomDialogue('notice'));
        }
        
        setTimeout(() => {
            this.setMood('idle');
            this.hideStatusIndicator();
        }, 3000);
    }
    
    showStatusIndicator() {
        this.statusIndicator.classList.add('show');
    }
    
    hideStatusIndicator() {
        this.statusIndicator.classList.remove('show');
    }
    
    // ========== 获取系统数据 ==========
    
    async getSystemSummary() {
        try {
            const [classrooms, courses, schedules] = await Promise.all([
                api('/classrooms').catch(() => []),
                api('/courses').catch(() => []),
                api('/schedules').catch(() => [])
            ]);
            
            return {
                classroomCount: classrooms.length,
                courseCount: courses.length,
                scheduleCount: schedules.length,
                availableClassrooms: classrooms.filter(c => c.status === 'available').length
            };
        } catch (e) {
            return null;
        }
    }
}

// ========== 全局函数 ==========

let desktopPet = null;

// 页面加载后初始化桌宠
document.addEventListener('DOMContentLoaded', () => {
    // 只在登录后显示桌宠
    const checkLogin = setInterval(() => {
        if (document.getElementById('mainContainer')?.style.display !== 'none') {
            if (!desktopPet) {
                desktopPet = new DesktopPet();
            }
            clearInterval(checkLogin);
        }
    }, 1000);
});

// 菜单操作
function closePetMenu() {
    if (desktopPet) {
        desktopPet.closeMenu();
    }
}

// 桌宠动作
async function petAction(action) {
    if (!desktopPet) return;
    
    desktopPet.closeMenu();
    desktopPet.recordInteraction();
    
    switch (action) {
        case 'greet':
            desktopPet.setMood('waving');
            desktopPet.say(desktopPet.getRandomDialogue('greet'));
            desktopPet.addHappiness(10);
            setTimeout(() => desktopPet.setMood('idle'), 2000);
            break;
            
        case 'summary':
            desktopPet.setMood('thinking');
            desktopPet.say('让我看看今天的数据...');
            
            const summary = await desktopPet.getSystemSummary();
            
            setTimeout(() => {
                if (summary) {
                    desktopPet.say(`📊 系统概览：\n教室 ${summary.classroomCount} 间\n课程 ${summary.courseCount} 门\n排课 ${summary.scheduleCount} 条`, 6000);
                } else {
                    desktopPet.say('哎呀，获取数据失败了...');
                }
                desktopPet.setMood('idle');
            }, 2000);
            break;
            
        case 'remind':
            desktopPet.setMood('thinking');
            const now = new Date();
            const hour = now.getHours();
            let reminder = '';
            
            if (hour < 9) {
                reminder = '早上好！新的一天开始了~';
            } else if (hour < 12) {
                reminder = '上午工作时间，加油哦！';
            } else if (hour < 14) {
                reminder = '中午啦，记得吃午饭休息~';
            } else if (hour < 18) {
                reminder = '下午了，继续努力！';
            } else if (hour < 22) {
                reminder = '晚上了，注意劳逸结合~';
            } else {
                reminder = '夜深了，早点休息吧~';
            }
            
            desktopPet.say(reminder);
            setTimeout(() => desktopPet.setMood('idle'), 2000);
            break;
            
        case 'weather':
            desktopPet.setMood('happy');
            desktopPet.say(desktopPet.getRandomDialogue('weather'));
            setTimeout(() => desktopPet.setMood('idle'), 2000);
            break;
            
        case 'encourage':
            desktopPet.setMood('happy');
            desktopPet.say(desktopPet.getRandomDialogue('encourage'));
            desktopPet.addHappiness(15);
            setTimeout(() => desktopPet.setMood('idle'), 3000);
            break;
            
        case 'sleep':
            if (desktopPet.state.isSleeping) {
                desktopPet.wakeUp();
            } else {
                desktopPet.goToSleep();
            }
            break;
            
        case 'settings':
            openPetSettings();
            break;
    }
}

// 打开设置
function openPetSettings() {
    if (!desktopPet) return;
    
    // 填充当前设置
    document.getElementById('petNameInput').value = desktopPet.state.name;
    document.getElementById('petPositionSelect').value = desktopPet.state.settings.position;
    document.getElementById('petInteractionFreq').value = desktopPet.state.settings.interactionFreq;
    document.getElementById('petSoundEnabled').checked = desktopPet.state.settings.soundEnabled;
    document.getElementById('petNotifyEnabled').checked = desktopPet.state.settings.notifyEnabled;
    document.getElementById('petAutoSleep').checked = desktopPet.state.settings.autoSleep;
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('petSettingsModal'));
    modal.show();
}

// 保存设置
function savePetSettings() {
    if (!desktopPet) return;
    
    const newName = document.getElementById('petNameInput').value.trim();
    const newPosition = document.getElementById('petPositionSelect').value;
    const newFreq = document.getElementById('petInteractionFreq').value;
    const soundEnabled = document.getElementById('petSoundEnabled').checked;
    const notifyEnabled = document.getElementById('petNotifyEnabled').checked;
    const autoSleep = document.getElementById('petAutoSleep').checked;
    
    // 更新状态
    desktopPet.state.name = newName || '小助手';
    desktopPet.state.settings.position = newPosition;
    desktopPet.state.settings.interactionFreq = newFreq;
    desktopPet.state.settings.soundEnabled = soundEnabled;
    desktopPet.state.settings.notifyEnabled = notifyEnabled;
    desktopPet.state.settings.autoSleep = autoSleep;
    
    // 应用位置变更
    if (newPosition !== desktopPet.state.settings.position || desktopPet.state.position.x !== null) {
        desktopPet.applyPositionPreset(newPosition);
    }
    
    // 重启自动说话
    desktopPet.startAutoTalk();
    
    // 保存
    desktopPet.saveSettings();
    
    // 关闭模态框
    bootstrap.Modal.getInstance(document.getElementById('petSettingsModal')).hide();
    
    // 反馈
    desktopPet.say(`设置已保存！你可以叫我"${desktopPet.state.name}"哦~`);
    desktopPet.setMood('happy');
    setTimeout(() => desktopPet.setMood('idle'), 2000);
    
    if (typeof showAlert === 'function') {
        showAlert('桌宠设置已保存', 'success');
    }
}

// 触发桌宠说话（供外部调用）
function petSay(text, duration) {
    if (desktopPet) {
        desktopPet.say(text, duration);
    }
}

// 触发桌宠心情（供外部调用）
function petMood(mood) {
    if (desktopPet) {
        desktopPet.setMood(mood);
    }
}

// 导出供全局使用
window.petSay = petSay;
window.petMood = petMood;
window.petAction = petAction;
