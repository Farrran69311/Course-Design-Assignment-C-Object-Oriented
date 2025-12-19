/**
 * 桌宠系统 - 小吐司 Toast Pet
 * 可爱的卡通吐司桌宠，支持鼠标互动、平台集成和多种状态
 */

class DesktopPet {
    constructor() {
        this.pet = document.getElementById('desktop-pet');
        this.speechBubble = document.getElementById('petSpeechBubble');
        this.speechText = document.getElementById('petSpeechText');
        this.statusIndicator = document.getElementById('petStatusIndicator');
        this.menu = document.getElementById('pet-menu');
        this.topping = document.getElementById('toastTopping');
        
        // 状态
        this.state = 'idle'; // idle, happy, surprised, sleeping, thinking, waving
        this.happiness = 100;
        this.energy = 100;
        this.currentTopping = 'none'; // none, butter, jam, honey, chocolate
        
        // 拖拽状态
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // 设置
        this.settings = this.loadSettings();
        
        // 对话库 - 吐司主题
        this.dialogues = {
            greet: [
                '你好呀！我是小吐司～🍞',
                '今天也要元气满满哦！',
                '嘿！需要我帮忙吗？',
                '见到你真开心！✨',
                '早上好！来片吐司吗？',
                '嗨嗨！我刚烤好的～'
            ],
            idle: [
                '今天的课程安排好了吗？',
                '要不要看看今日概览？',
                '别忘了查看预约情况哦～',
                '有什么需要帮忙的吗？',
                '我闻起来香不香？🍞',
                '好想被涂上黄油啊...',
                '吐司的日常，烤得刚刚好～'
            ],
            encourage: [
                '你做得很棒！继续加油！💪',
                '相信自己，你是最棒的！',
                '每一步努力都有意义！',
                '今天也是美好的一天！',
                '像吐司一样温暖你～🍞',
                '金黄酥脆，活力满满！'
            ],
            weather: [
                '今天天气真不错呢～☀️',
                '适合出去走走的天气！',
                '窗外的风景一定很美！',
                '希望天气像我一样金黄！'
            ],
            sleepy: [
                '呼呼...让我休息一下...',
                'Zzz...梦到黄油了...',
                '好困...吐司也需要休息...',
                '晚安...明天见...🌙'
            ],
            wakeup: [
                '啊！我醒啦！刚烤好！',
                '嗯？有人叫我吗？',
                '我在我在！香喷喷的！',
                '吐司报到！✨'
            ],
            drag: [
                '哇！被拿起来了！',
                '轻点轻点～别掉渣！',
                '好高好高！',
                '我可以飞了吗？🍞'
            ],
            click: [
                '戳到我啦！痒痒的～',
                '嘻嘻，你好呀！',
                '有什么事吗？',
                '被点到了！酥脆！'
            ],
            topping: [
                '哇！涂上{topping}了！好香！',
                '谢谢你给我涂{topping}～',
                '{topping}最配吐司了！',
                '现在我更好吃了！🍞'
            ]
        };
        
        // 配料名称映射
        this.toppingNames = {
            butter: '黄油',
            jam: '果酱',
            honey: '蜂蜜',
            chocolate: '巧克力'
        };
        
        // 定时器
        this.idleTimer = null;
        this.sleepTimer = null;
        this.speechTimer = null;
        
        // 初始化
        this.init();
    }
    
    init() {
        // 检查是否登录
        if (!this.isLoggedIn()) {
            this.hide();
            return;
        }
        
        this.show();
        this.applySettings();
        this.bindEvents();
        this.startIdleTimer();
        
        // 延迟打招呼
        setTimeout(() => {
            this.say(this.getRandomDialogue('greet'));
            this.setState('waving');
            setTimeout(() => this.setState('idle'), 2000);
        }, 1500);
        
        // 恢复配料状态
        const savedTopping = localStorage.getItem('petTopping');
        if (savedTopping && savedTopping !== 'none') {
            this.setTopping(savedTopping, false);
        }
    }
    
    isLoggedIn() {
        const mainContainer = document.getElementById('mainContainer');
        return mainContainer && mainContainer.style.display !== 'none';
    }
    
    show() {
        if (this.pet) {
            this.pet.style.display = 'block';
        }
    }
    
    hide() {
        if (this.pet) {
            this.pet.style.display = 'none';
        }
    }
    
    // 事件绑定
    bindEvents() {
        // 拖拽事件
        this.pet.addEventListener('mousedown', (e) => this.onDragStart(e));
        document.addEventListener('mousemove', (e) => this.onDragMove(e));
        document.addEventListener('mouseup', () => this.onDragEnd());
        
        // 触摸事件
        this.pet.addEventListener('touchstart', (e) => this.onTouchStart(e));
        document.addEventListener('touchmove', (e) => this.onTouchMove(e));
        document.addEventListener('touchend', () => this.onDragEnd());
        
        // 点击事件
        this.pet.addEventListener('click', (e) => this.onClick(e));
        
        // 右键菜单
        this.pet.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.toggleMenu();
        });
        
        // 眼睛跟随鼠标
        document.addEventListener('mousemove', (e) => this.eyeFollow(e));
        
        // 监听系统通知
        this.observeNotifications();
        
        // 监听登录状态变化
        this.observeLoginState();
        
        // 点击其他地方关闭菜单
        document.addEventListener('click', (e) => {
            if (!this.menu.contains(e.target) && !this.pet.contains(e.target)) {
                this.closeMenu();
            }
        });
    }
    
    // 眼睛跟随鼠标
    eyeFollow(e) {
        if (this.state === 'sleeping' || this.isDragging) return;
        
        const pupils = this.pet.querySelectorAll('.toast-pupil');
        const petRect = this.pet.getBoundingClientRect();
        const petCenterX = petRect.left + petRect.width / 2;
        const petCenterY = petRect.top + petRect.height / 3;
        
        const angle = Math.atan2(e.clientY - petCenterY, e.clientX - petCenterX);
        const distance = Math.min(2, Math.hypot(e.clientX - petCenterX, e.clientY - petCenterY) / 100);
        
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        pupils.forEach(pupil => {
            pupil.style.transform = `translate(${x}px, ${y}px)`;
        });
    }
    
    // 拖拽开始
    onDragStart(e) {
        if (e.button === 2) return; // 右键不拖拽
        
        this.isDragging = true;
        this.pet.classList.add('dragging');
        
        const rect = this.pet.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        this.say(this.getRandomDialogue('drag'));
    }
    
    // 触摸开始
    onTouchStart(e) {
        const touch = e.touches[0];
        this.isDragging = true;
        this.pet.classList.add('dragging');
        
        const rect = this.pet.getBoundingClientRect();
        this.dragOffset = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }
    
    // 拖拽移动
    onDragMove(e) {
        if (!this.isDragging) return;
        
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;
        
        // 边界检测
        const maxX = window.innerWidth - this.pet.offsetWidth;
        const maxY = window.innerHeight - this.pet.offsetHeight;
        
        this.pet.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
        this.pet.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        this.pet.style.right = 'auto';
        this.pet.style.bottom = 'auto';
    }
    
    // 触摸移动
    onTouchMove(e) {
        if (!this.isDragging) return;
        
        const touch = e.touches[0];
        const x = touch.clientX - this.dragOffset.x;
        const y = touch.clientY - this.dragOffset.y;
        
        const maxX = window.innerWidth - this.pet.offsetWidth;
        const maxY = window.innerHeight - this.pet.offsetHeight;
        
        this.pet.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
        this.pet.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        this.pet.style.right = 'auto';
        this.pet.style.bottom = 'auto';
    }
    
    // 拖拽结束
    onDragEnd() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.pet.classList.remove('dragging');
        this.resetIdleTimer();
    }
    
    // 点击事件
    onClick(e) {
        if (this.isDragging) return;
        
        // 如果在睡觉，点击唤醒
        if (this.state === 'sleeping') {
            this.wakeUp();
            return;
        }
        
        // 普通点击
        this.say(this.getRandomDialogue('click'));
        this.setState('happy');
        setTimeout(() => this.setState('idle'), 1500);
        
        // 增加好感度
        this.addHappiness(2);
        this.resetIdleTimer();
    }
    
    // 设置状态
    setState(state) {
        this.pet.classList.remove('idle', 'happy', 'surprised', 'sleeping', 'thinking', 'waving');
        this.state = state;
        this.pet.classList.add(state);
    }
    
    // 说话
    say(text, duration = 4000) {
        if (this.settings.interactionFreq === 'low' && this.state !== 'sleeping') {
            // 安静模式下减少说话
            if (Math.random() > 0.3) return;
        }
        
        this.speechText.textContent = text;
        this.speechBubble.classList.add('show');
        
        clearTimeout(this.speechTimer);
        this.speechTimer = setTimeout(() => {
            this.speechBubble.classList.remove('show');
        }, duration);
    }
    
    // 获取随机对话
    getRandomDialogue(type) {
        const dialogues = this.dialogues[type];
        return dialogues[Math.floor(Math.random() * dialogues.length)];
    }
    
    // 设置配料
    setTopping(type, showDialog = true) {
        // 移除所有配料样式
        this.topping.classList.remove('butter', 'jam', 'honey', 'chocolate');
        
        if (type && type !== 'none') {
            this.topping.classList.add(type);
            this.currentTopping = type;
            localStorage.setItem('petTopping', type);
            
            // 说话
            if (showDialog) {
                const text = this.getRandomDialogue('topping').replace('{topping}', this.toppingNames[type]);
                this.say(text);
                this.setState('happy');
                setTimeout(() => this.setState('idle'), 2000);
            }
        } else {
            this.currentTopping = 'none';
            localStorage.setItem('petTopping', 'none');
            if (showDialog) {
                this.say('清爽的原味吐司！');
            }
        }
    }
    
    // 切换配料
    cycleTopping() {
        const toppings = ['none', 'butter', 'jam', 'honey', 'chocolate'];
        const currentIndex = toppings.indexOf(this.currentTopping);
        const nextIndex = (currentIndex + 1) % toppings.length;
        this.setTopping(toppings[nextIndex]);
    }
    
    // 睡眠
    sleep() {
        this.setState('sleeping');
        this.say(this.getRandomDialogue('sleepy'));
        clearTimeout(this.idleTimer);
    }
    
    // 唤醒
    wakeUp() {
        this.setState('surprised');
        this.say(this.getRandomDialogue('wakeup'));
        setTimeout(() => this.setState('idle'), 1500);
        this.startIdleTimer();
    }
    
    // 开始空闲计时器
    startIdleTimer() {
        const intervals = {
            high: 30000,    // 30秒
            medium: 60000,  // 1分钟
            low: 180000     // 3分钟
        };
        
        clearInterval(this.idleTimer);
        this.idleTimer = setInterval(() => {
            if (this.state !== 'sleeping') {
                this.say(this.getRandomDialogue('idle'));
                
                // 随机动作
                const actions = ['thinking', 'waving'];
                const randomAction = actions[Math.floor(Math.random() * actions.length)];
                this.setState(randomAction);
                setTimeout(() => this.setState('idle'), 2000);
            }
        }, intervals[this.settings.interactionFreq] || intervals.medium);
        
        // 自动睡眠定时器
        if (this.settings.autoSleep) {
            this.startSleepTimer();
        }
    }
    
    // 重置空闲计时器
    resetIdleTimer() {
        clearTimeout(this.sleepTimer);
        if (this.settings.autoSleep) {
            this.startSleepTimer();
        }
    }
    
    // 开始睡眠计时器
    startSleepTimer() {
        clearTimeout(this.sleepTimer);
        this.sleepTimer = setTimeout(() => {
            if (this.state !== 'sleeping') {
                this.sleep();
            }
        }, 300000); // 5分钟
    }
    
    // 显示/隐藏菜单
    toggleMenu() {
        if (this.menu.classList.contains('show')) {
            this.closeMenu();
        } else {
            this.showMenu();
        }
    }
    
    showMenu() {
        // 更新菜单位置
        const petRect = this.pet.getBoundingClientRect();
        this.menu.style.left = 'auto';
        this.menu.style.right = (window.innerWidth - petRect.right) + 'px';
        this.menu.style.bottom = (window.innerHeight - petRect.top + 10) + 'px';
        this.menu.style.top = 'auto';
        
        this.menu.classList.add('show');
        this.updateStats();
    }
    
    closeMenu() {
        this.menu.classList.remove('show');
    }
    
    // 更新状态显示
    updateStats() {
        document.getElementById('petHappiness').textContent = this.happiness;
        document.getElementById('petEnergy').textContent = this.energy;
    }
    
    // 增加好感度
    addHappiness(amount) {
        this.happiness = Math.min(100, this.happiness + amount);
        this.updateStats();
    }
    
    // 监听系统通知
    observeNotifications() {
        // 监听 showAlert 调用
        const originalShowAlert = window.showAlert;
        if (originalShowAlert) {
            window.showAlert = (message, type = 'info') => {
                originalShowAlert(message, type);
                
                if (this.settings.notifyEnabled && this.state !== 'sleeping') {
                    this.onSystemNotification(message, type);
                }
            };
        }
    }
    
    // 处理系统通知
    onSystemNotification(message, type) {
        if (type === 'success') {
            this.setState('happy');
            this.say('太棒了！操作成功！🎉');
        } else if (type === 'danger' || type === 'error') {
            this.setState('surprised');
            this.say('哎呀，出错了！😟');
        } else if (type === 'warning') {
            this.setState('thinking');
            this.say('注意看这条提示哦！');
        }
        
        this.statusIndicator.classList.add('show');
        setTimeout(() => {
            this.statusIndicator.classList.remove('show');
            this.setState('idle');
        }, 3000);
    }
    
    // 监听登录状态
    observeLoginState() {
        const observer = new MutationObserver(() => {
            if (this.isLoggedIn()) {
                this.show();
            } else {
                this.hide();
            }
        });
        
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) {
            observer.observe(mainContainer, { attributes: true, attributeFilter: ['style'] });
        }
    }
    
    // 加载设置
    loadSettings() {
        const defaults = {
            name: '小吐司',
            position: 'bottom-right',
            interactionFreq: 'medium',
            soundEnabled: false,
            notifyEnabled: true,
            autoSleep: true
        };
        
        try {
            const saved = localStorage.getItem('petSettings');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch {
            return defaults;
        }
    }
    
    // 保存设置
    saveSettings() {
        this.settings = {
            name: document.getElementById('petNameInput').value || '小吐司',
            position: document.getElementById('petPositionSelect').value,
            interactionFreq: document.getElementById('petInteractionFreq').value,
            soundEnabled: document.getElementById('petSoundEnabled').checked,
            notifyEnabled: document.getElementById('petNotifyEnabled').checked,
            autoSleep: document.getElementById('petAutoSleep').checked
        };
        
        localStorage.setItem('petSettings', JSON.stringify(this.settings));
        this.applySettings();
        
        this.say('设置已保存！谢谢～');
        this.setState('happy');
        setTimeout(() => this.setState('idle'), 1500);
    }
    
    // 应用设置
    applySettings() {
        // 应用位置
        const positions = {
            'bottom-right': { bottom: '30px', right: '30px', top: 'auto', left: 'auto' },
            'bottom-left': { bottom: '30px', left: '30px', top: 'auto', right: 'auto' },
            'top-right': { top: '80px', right: '30px', bottom: 'auto', left: 'auto' },
            'top-left': { top: '80px', left: '30px', bottom: 'auto', right: 'auto' }
        };
        
        const pos = positions[this.settings.position];
        if (pos) {
            Object.assign(this.pet.style, pos);
        }
        
        // 更新设置表单
        const nameInput = document.getElementById('petNameInput');
        const posSelect = document.getElementById('petPositionSelect');
        const freqSelect = document.getElementById('petInteractionFreq');
        const soundCheck = document.getElementById('petSoundEnabled');
        const notifyCheck = document.getElementById('petNotifyEnabled');
        const sleepCheck = document.getElementById('petAutoSleep');
        
        if (nameInput) nameInput.value = this.settings.name;
        if (posSelect) posSelect.value = this.settings.position;
        if (freqSelect) freqSelect.value = this.settings.interactionFreq;
        if (soundCheck) soundCheck.checked = this.settings.soundEnabled;
        if (notifyCheck) notifyCheck.checked = this.settings.notifyEnabled;
        if (sleepCheck) sleepCheck.checked = this.settings.autoSleep;
    }
    
    // 执行动作
    action(type) {
        switch (type) {
            case 'greet':
                this.say(this.getRandomDialogue('greet'));
                this.setState('waving');
                setTimeout(() => this.setState('idle'), 2000);
                break;
                
            case 'summary':
                this.showSummary();
                break;
                
            case 'remind':
                this.showReminders();
                break;
                
            case 'weather':
                this.say(this.getRandomDialogue('weather'));
                this.setState('happy');
                setTimeout(() => this.setState('idle'), 2000);
                break;
                
            case 'encourage':
                this.say(this.getRandomDialogue('encourage'));
                this.setState('happy');
                this.addHappiness(5);
                setTimeout(() => this.setState('idle'), 2500);
                break;
                
            case 'topping':
                this.cycleTopping();
                break;
                
            case 'sleep':
                this.sleep();
                break;
                
            case 'settings':
                const modal = new bootstrap.Modal(document.getElementById('petSettingsModal'));
                modal.show();
                break;
        }
        
        this.closeMenu();
    }
    
    // 显示今日概览
    async showSummary() {
        this.setState('thinking');
        this.say('让我看看今天的情况...');
        
        try {
            // 尝试获取系统数据
            const stats = await this.fetchSystemStats();
            setTimeout(() => {
                this.say(`今日有 ${stats.bookings} 个预约，${stats.courses} 门课程～`);
                this.setState('happy');
                setTimeout(() => this.setState('idle'), 3000);
            }, 1500);
        } catch {
            setTimeout(() => {
                this.say('暂时无法获取数据，稍后再试吧！');
                this.setState('idle');
            }, 1500);
        }
    }
    
    // 获取系统统计
    async fetchSystemStats() {
        // 模拟数据，实际可以调用API
        return {
            bookings: Math.floor(Math.random() * 10) + 1,
            courses: Math.floor(Math.random() * 8) + 1,
            classrooms: Math.floor(Math.random() * 20) + 5
        };
    }
    
    // 显示提醒
    showReminders() {
        this.setState('thinking');
        
        setTimeout(() => {
            const reminders = [
                '记得检查今天的课程安排哦！',
                '有几个预约即将开始～',
                '别忘了更新设备状态！',
                '今天的任务完成了吗？'
            ];
            this.say(reminders[Math.floor(Math.random() * reminders.length)]);
            this.setState('idle');
        }, 1000);
    }
}

// 全局变量
let desktopPet = null;

// 初始化桌宠
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        desktopPet = new DesktopPet();
    }, 1000);
});

// 全局函数
function closePetMenu() {
    if (desktopPet) {
        desktopPet.closeMenu();
    }
}

function petAction(type) {
    if (desktopPet) {
        desktopPet.action(type);
    }
}

function savePetSettings() {
    if (desktopPet) {
        desktopPet.saveSettings();
        const modal = bootstrap.Modal.getInstance(document.getElementById('petSettingsModal'));
        if (modal) modal.hide();
    }
}
