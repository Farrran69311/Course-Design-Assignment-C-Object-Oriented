/**
 * 🍞 增强版小吐司桌宠系统
 * 包含：物理引擎、迷你剧场、场景互动、丰富动画
 */

console.log('🍞 pet.js 文件已加载');

class ToastPet {
    constructor() {
        // DOM 元素
        this.pet = document.getElementById('desktop-pet');
        this.speechBubble = document.getElementById('petSpeechBubble');
        this.statusIndicator = document.getElementById('petStatusIndicator');
        this.menu = document.getElementById('pet-menu');
        
        // 特效元素
        this.sweatDrop = document.querySelector('.sweat-drop');
        this.heartPop = document.querySelector('.heart-pop');
        this.starPop = document.querySelector('.star-pop');
        this.steam = document.querySelector('.steam');
        this.heldItem = document.querySelector('.held-item');
        
        // 场景元素
        this.strawberryBush = document.getElementById('strawberry-bush');
        this.bathtub = document.getElementById('bathtub');
        this.toasterOven = document.getElementById('toaster-oven');
        
        // 状态
        this.state = {
            mood: 100,
            toastLevel: 0,
            currentTopping: 'butter',
            currentState: 'idle',
            isBusy: false,
            isHidingAtEdge: false,
            isDragging: false,
            isBurnt: false,
            holdingItem: null
        };
        
        // 物理状态
        this.physics = {
            enabled: true,
            x: window.innerWidth - 110,
            y: window.innerHeight - 130,
            velocityX: 0,
            velocityY: 0,
            lastX: 0,
            lastY: 0,
            lastTime: Date.now(),
            dragStartTime: 0,
            gravity: 2000,
            bounceFactor: 0.3,
            friction: 0.95,
            dragSpeedThreshold: 800,
        };
        
        // 计时器
        this.timers = {
            autoActivity: null,
            speech: null,
            state: null,
            physics: null,
            idleCheck: null
        };
        
        // 设置
        this.settings = {
            autoActivity: true,
            physicsEnabled: true,
            idleTimeout: 30000
        };
        
        // 对话库
        this.dialogues = {
            greeting: [
                '早上好呀！今天也要元气满满~ 🌟',
                '嘿嘿，我是小吐司！✨',
                '有什么我能帮到你的吗？🍞'
            ],
            idle: [
                '无聊呀...要不要一起玩？',
                '嗯...在想今天涂什么酱好呢',
                '(*￣▽￣)ノ',
                '好想被黄油亲亲~'
            ],
            happy: [
                '太开心了！(≧▽≦)/',
                '耶耶耶！🎉',
                '最喜欢你了！💕',
                '幸福就是这样的吧~'
            ],
            dragged: [
                '呀呀呀！轻点轻点！',
                '我会头晕的啦~',
                '慢一点嘛...>_<',
                '要、要飞起来了！'
            ],
            worried: [
                '呜呜，太快了！',
                '我晕了...@_@',
                '能不能温柔一点呀...'
            ],
            strawberry: [
                '去采草莓酱啦！🍓',
                '草莓草莓~好甜！',
                '找到好多草莓！🍓✨'
            ],
            bath: [
                '洗澡澡咯~🛁',
                '泡泡浴好舒服呀~',
                '搓搓搓，洗干净~'
            ],
            toasting: [
                '要变成烤吐司了！',
                '好、好热呀...！🔥',
                '不要烤太久哦...'
            ],
            burnt: [
                '呜...我变焦了...',
                '好像有点糊了... (；′⌒`)',
                '焦香味...算是特色吧？'
            ],
            hiding: [
                '让我躲一会儿...',
                '偷偷看看~👀',
                '嘿嘿，找不到我吧'
            ],
            petting: [
                '嘿嘿，好痒~',
                '再摸摸嘛~ 💕',
                '舒服舒服~'
            ]
        };
        
        // 初始化
        this.init();
    }
    
    init() {
        // 检查 DOM 元素是否存在
        if (!this.pet) {
            console.error('❌ 桌宠容器未找到！检查 ID 是否为 "desktop-pet"');
            return;
        }
        
        this.bindEvents();
        this.setPosition(this.physics.x, this.physics.y);
        this.startIdleTimer();
        this.setState('idle');
        
        setTimeout(() => {
            this.speak(this.getRandomDialogue('greeting'), '👋');
        }, 1000);
        
        console.log('🍞 小吐司桌宠已加载！');
    }
    
    bindEvents() {
        // 拖拽事件
        console.log('✅ 绑定拖拽事件，pet元素:', this.pet);
        this.pet.addEventListener('mousedown', (e) => {
            console.log('🖱️ mousedown 事件触发');
            this.onDragStart(e);
        });
        document.addEventListener('mousemove', (e) => this.onDragMove(e));
        document.addEventListener('mouseup', (e) => this.onDragEnd(e));
        
        // 触摸支持
        this.pet.addEventListener('touchstart', (e) => this.onDragStart(e));
        document.addEventListener('touchmove', (e) => this.onDragMove(e));
        document.addEventListener('touchend', (e) => this.onDragEnd(e));
        
        // 点击/双击事件
        this.pet.addEventListener('click', (e) => this.onClick(e));
        this.pet.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        
        // 右键菜单
        this.pet.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.toggleMenu();
        });
        
        // 菜单关闭
        document.querySelector('.pet-menu-close')?.addEventListener('click', () => {
            this.hideMenu();
        });
        
        // 菜单项
        document.querySelectorAll('.pet-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleMenuAction(action);
                this.hideMenu();
            });
        });
        
        // 点击其他地方关闭菜单
        document.addEventListener('click', (e) => {
            if (this.pet && !this.pet.contains(e.target) && this.menu && !this.menu.contains(e.target)) {
                this.hideMenu();
            }
        });
        
        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.constrainPosition();
        });
    }
    
    // ===== 拖拽系统 =====
    onDragStart(e) {
        if (this.state.isBusy) return;
        
        e.preventDefault();
        const pos = this.getEventPosition(e);
        
        this.state.isDragging = true;
        this.physics.dragStartTime = Date.now();
        this.physics.lastX = pos.x;
        this.physics.lastY = pos.y;
        this.physics.lastTime = Date.now();
        this.physics.velocityX = 0;
        this.physics.velocityY = 0;
        
        this.pet.classList.add('dragging');
        this.setState('idle');
        this.resetIdleTimer();
    }
    
    onDragMove(e) {
        if (!this.state.isDragging) return;
        
        const pos = this.getEventPosition(e);
        const now = Date.now();
        const dt = Math.max(now - this.physics.lastTime, 1) / 1000;
        
        const dx = pos.x - this.physics.lastX;
        const dy = pos.y - this.physics.lastY;
        this.physics.velocityX = dx / dt;
        this.physics.velocityY = dy / dt;
        
        const speed = Math.sqrt(this.physics.velocityX ** 2 + this.physics.velocityY ** 2);
        
        if (this.settings.physicsEnabled && speed > this.physics.dragSpeedThreshold) {
            this.showWorried();
            
            if (dx > 50) {
                this.pet.classList.add('tilted-left');
                this.pet.classList.remove('tilted-right');
            } else if (dx < -50) {
                this.pet.classList.add('tilted-right');
                this.pet.classList.remove('tilted-left');
            }
        } else {
            this.pet.classList.remove('worried', 'tilted-left', 'tilted-right');
            this.sweatDrop?.classList.remove('show');
        }
        
        const petRect = this.pet.getBoundingClientRect();
        const newX = pos.x - petRect.width / 2;
        const newY = pos.y - petRect.height / 2;
        
        this.physics.x = newX;
        this.physics.y = newY;
        this.setPosition(newX, newY);
        
        this.physics.lastX = pos.x;
        this.physics.lastY = pos.y;
        this.physics.lastTime = now;
    }
    
    onDragEnd(e) {
        if (!this.state.isDragging) return;
        
        this.state.isDragging = false;
        this.pet.classList.remove('dragging', 'tilted-left', 'tilted-right');
        
        if (this.settings.physicsEnabled) {
            const speed = Math.sqrt(this.physics.velocityX ** 2 + this.physics.velocityY ** 2);
            
            if (speed > 600) {
                this.speak(this.getRandomDialogue('worried'), '😵');
            }
            
            const bottomDistance = window.innerHeight - this.physics.y - 100;
            if (bottomDistance > 50 || this.physics.velocityY !== 0) {
                this.startFallPhysics();
            } else {
                this.setState('idle');
                this.pet.classList.remove('worried');
                this.sweatDrop?.classList.remove('show');
            }
        } else {
            this.constrainPosition();
            this.setState('idle');
        }
        
        this.resetIdleTimer();
    }
    
    showWorried() {
        this.pet.classList.add('worried');
        this.sweatDrop?.classList.add('show');
        
        if (Math.random() < 0.1) {
            this.speak(this.getRandomDialogue('dragged'), '😰');
        }
    }
    
    // ===== 物理引擎 =====
    startFallPhysics() {
        if (this.timers.physics) cancelAnimationFrame(this.timers.physics);
        
        const animate = () => {
            const now = Date.now();
            const dt = Math.min((now - this.physics.lastTime) / 1000, 0.05);
            this.physics.lastTime = now;
            
            this.physics.velocityY += this.physics.gravity * dt;
            this.physics.velocityX *= this.physics.friction;
            
            this.physics.x += this.physics.velocityX * dt;
            this.physics.y += this.physics.velocityY * dt;
            
            const bounds = this.getBounds();
            let hitGround = false;
            
            if (this.physics.y > bounds.bottom) {
                this.physics.y = bounds.bottom;
                if (Math.abs(this.physics.velocityY) > 100) {
                    this.triggerSquash();
                    hitGround = true;
                }
                this.physics.velocityY = -this.physics.velocityY * this.physics.bounceFactor;
                
                if (Math.abs(this.physics.velocityY) < 50) {
                    this.physics.velocityY = 0;
                }
            }
            
            if (this.physics.x < bounds.left) {
                this.physics.x = bounds.left;
                this.physics.velocityX = -this.physics.velocityX * this.physics.bounceFactor;
            } else if (this.physics.x > bounds.right) {
                this.physics.x = bounds.right;
                this.physics.velocityX = -this.physics.velocityX * this.physics.bounceFactor;
            }
            
            if (this.physics.y < bounds.top) {
                this.physics.y = bounds.top;
                this.physics.velocityY = Math.abs(this.physics.velocityY) * this.physics.bounceFactor;
            }
            
            this.setPosition(this.physics.x, this.physics.y);
            
            const isMoving = Math.abs(this.physics.velocityX) > 10 || 
                           Math.abs(this.physics.velocityY) > 10 ||
                           this.physics.y < bounds.bottom - 5;
            
            if (isMoving) {
                this.timers.physics = requestAnimationFrame(animate);
            } else {
                this.physics.velocityX = 0;
                this.physics.velocityY = 0;
                this.pet.classList.remove('worried', 'squash');
                this.sweatDrop?.classList.remove('show');
                this.setState('idle');
            }
        };
        
        this.physics.lastTime = Date.now();
        this.timers.physics = requestAnimationFrame(animate);
    }
    
    triggerSquash() {
        this.pet.classList.add('squash');
        this.showEffect('star');
        
        setTimeout(() => {
            this.pet.classList.remove('squash');
        }, 500);
    }
    
    getBounds() {
        const petRect = this.pet.getBoundingClientRect();
        return {
            left: 0,
            right: window.innerWidth - petRect.width,
            top: 0,
            bottom: window.innerHeight - petRect.height - 10
        };
    }
    
    // ===== 活动系统 =====
    startIdleTimer() {
        if (this.timers.idleCheck) clearTimeout(this.timers.idleCheck);
        
        this.timers.idleCheck = setTimeout(() => {
            if (!this.state.isBusy && this.settings.autoActivity) {
                this.triggerRandomActivity();
            }
        }, this.settings.idleTimeout);
    }
    
    resetIdleTimer() {
        this.startIdleTimer();
    }
    
    triggerRandomActivity() {
        const activities = ['strawberry', 'bath', 'hide', 'toaster'];
        const weights = [0.35, 0.3, 0.2, 0.15];
        
        const random = Math.random();
        let cumulative = 0;
        let selected = activities[0];
        
        for (let i = 0; i < activities.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                selected = activities[i];
                break;
            }
        }
        
        switch (selected) {
            case 'strawberry':
                this.activityPickStrawberry();
                break;
            case 'bath':
                this.activityBath();
                break;
            case 'hide':
                this.activityHideAtEdge();
                break;
            case 'toaster':
                this.activityToaster();
                break;
        }
    }
    
    async activityPickStrawberry() {
        console.log('🍓 开始采草莓活动, isBusy:', this.state.isBusy);
        if (this.state.isBusy) {
            console.log('⚠️ 正忙，跳过采草莓');
            return;
        }
        this.state.isBusy = true;
        this.pet.classList.add('busy');
        
        this.speak(this.getRandomDialogue('strawberry'), '🍓');
        this.showScene('strawberry-bush');
        
        await this.walkTo(100, window.innerHeight - 130);
        
        this.setState('happy');
        await this.sleep(1000);
        
        this.state.holdingItem = 'strawberry';
        if (this.heldItem) {
            this.heldItem.textContent = '🍓';
            this.heldItem.classList.add('show');
        }
        
        this.speak('采到了！好漂亮的草莓~ 🍓', '😊');
        await this.sleep(2000);
        
        this.hideScene('strawberry-bush');
        await this.activityBath();
    }
    
    async activityBath() {
        console.log('🛁 开始泡澡活动');
        if (this.state.isBusy && !this.state.holdingItem) {
            console.log('⚠️ 正忙且没拿东西，跳过泡澡');
            return;
        }
        if (!this.state.isBusy) {
            this.state.isBusy = true;
            this.pet.classList.add('busy');
        }
        
        this.speak(this.getRandomDialogue('bath'), '🛁');
        this.showScene('bathtub');
        
        await this.walkTo(200, window.innerHeight - 130);
        
        this.setState('bathing');
        this.pet.style.zIndex = '9996';
        
        if (this.state.holdingItem) {
            this.speak('把草莓洗干净~', '✨');
            await this.sleep(1500);
            if (this.heldItem) {
                this.heldItem.classList.remove('show');
            }
            this.state.holdingItem = null;
            
            this.changeTopping('jam');
            this.speak('涂上草莓酱啦！', '🍓');
        }
        
        await this.sleep(3000);
        
        this.pet.style.zIndex = '9999';
        this.hideScene('bathtub');
        
        await this.activityHideAtEdge();
    }
    
    async activityHideAtEdge() {
        console.log('👀 开始躲边边活动');
        if (this.state.isBusy && !this.state.isHidingAtEdge) {
            // 继续执行（从其他活动链式调用）
        } else if (this.state.isBusy) {
            console.log('⚠️ 正忙，跳过躲边边');
            return;
        } else {
            this.state.isBusy = true;
            this.pet.classList.add('busy');
        }
        
        this.speak(this.getRandomDialogue('hiding'), '👀');
        
        const goRight = this.physics.x > window.innerWidth / 2;
        
        if (goRight) {
            await this.walkTo(window.innerWidth - 45, window.innerHeight - 130);
            this.pet.classList.add('hiding-edge', 'right-edge');
        } else {
            await this.walkTo(-35, window.innerHeight - 130);
            this.pet.classList.add('hiding-edge', 'left-edge');
        }
        
        this.state.isHidingAtEdge = true;
        this.setState('idle');
        
        await this.sleep(5000);
        
        this.pet.classList.remove('hiding-edge', 'right-edge', 'left-edge');
        if (goRight) {
            this.physics.x = window.innerWidth - 110;
        } else {
            this.physics.x = 30;
        }
        this.setPosition(this.physics.x, this.physics.y);
        
        this.state.isHidingAtEdge = false;
        this.state.isBusy = false;
        this.pet.classList.remove('busy');
        this.setState('idle');
        this.resetIdleTimer();
        console.log('✅ 躲边边活动完成');
    }
    
    async activityToaster() {
        console.log('🔥 开始烤箱活动');
        if (this.state.isBusy) {
            console.log('⚠️ 正忙，跳过烤箱');
            return;
        }
        this.state.isBusy = true;
        this.pet.classList.add('busy');
        
        this.speak(this.getRandomDialogue('toasting'), '🔥');
        this.showScene('toaster-oven');
        
        await this.walkTo(window.innerWidth - 190, window.innerHeight - 130);
        
        this.setState('toasting');
        if (this.steam) this.steam.classList.add('show');
        if (this.toasterOven) this.toasterOven.classList.add('heating');
        
        await this.sleep(1000);
        this.speak('好、好热...！', '🥵');
        await this.sleep(1500);
        this.speak('快要糊了！', '😱');
        await this.sleep(1500);
        
        this.state.isBurnt = true;
        this.state.toastLevel = 100;
        this.pet.classList.add('burnt');
        if (this.steam) this.steam.classList.remove('show');
        if (this.toasterOven) this.toasterOven.classList.remove('heating');
        
        this.speak(this.getRandomDialogue('burnt'), '😅');
        
        await this.sleep(2000);
        this.hideScene('toaster-oven');
        
        setTimeout(() => {
            this.state.isBurnt = false;
            this.state.toastLevel = 0;
            this.pet.classList.remove('burnt');
            this.speak('恢复了！下次小心点...', '😌');
        }, 10000);
        
        this.state.isBusy = false;
        this.pet.classList.remove('busy');
        this.setState('idle');
        this.resetIdleTimer();
        console.log('✅ 烤箱活动完成');
    }
    
    async walkTo(targetX, targetY) {
        this.setState('walking');
        
        const startX = this.physics.x;
        const startY = this.physics.y;
        const distance = Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2);
        const duration = Math.max(distance * 3, 500);
        const startTime = Date.now();
        
        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                
                this.physics.x = startX + (targetX - startX) * easeProgress;
                this.physics.y = startY + (targetY - startY) * easeProgress;
                this.setPosition(this.physics.x, this.physics.y);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }
    
    // ===== 场景管理 =====
    showScene(sceneId) {
        const scene = document.getElementById(sceneId);
        if (scene) {
            scene.classList.add('active');
        }
    }
    
    hideScene(sceneId) {
        const scene = document.getElementById(sceneId);
        if (scene) {
            scene.classList.remove('active');
        }
    }
    
    // ===== 特效系统 =====
    showEffect(type) {
        switch (type) {
            case 'heart':
                this.heartPop?.classList.add('show');
                setTimeout(() => this.heartPop?.classList.remove('show'), 1000);
                break;
            case 'star':
                this.starPop?.classList.add('show');
                setTimeout(() => this.starPop?.classList.remove('show'), 600);
                break;
            case 'sweat':
                this.sweatDrop?.classList.add('show');
                setTimeout(() => this.sweatDrop?.classList.remove('show'), 800);
                break;
        }
    }
    
    // ===== 交互处理 =====
    onClick(e) {
        if (this.state.isBusy) return;
        
        if (this.state.isHidingAtEdge) {
            this.pet.classList.remove('hiding-edge', 'right-edge', 'left-edge');
            this.state.isHidingAtEdge = false;
            this.physics.x = Math.max(30, Math.min(this.physics.x, window.innerWidth - 110));
            this.setPosition(this.physics.x, this.physics.y);
            return;
        }
        
        this.showEffect('heart');
        this.setState('happy');
        this.speak(this.getRandomDialogue('petting'), '💕');
        
        this.resetIdleTimer();
        
        setTimeout(() => {
            if (this.state.currentState === 'happy') {
                this.setState('idle');
            }
        }, 2000);
    }
    
    onDoubleClick(e) {
        if (this.state.isBusy) return;
        
        const toppings = ['butter', 'jam', 'honey', 'chocolate'];
        const currentIndex = toppings.indexOf(this.state.currentTopping);
        const nextIndex = (currentIndex + 1) % toppings.length;
        this.changeTopping(toppings[nextIndex]);
        
        this.setState('happy');
        setTimeout(() => this.setState('idle'), 1500);
    }
    
    // ===== 菜单处理 =====
    handleMenuAction(action) {
        console.log('🎬 执行菜单动作:', action);
        switch (action) {
            case 'greet':
                this.setState('waving');
                this.speak(this.getRandomDialogue('greeting'), '👋');
                setTimeout(() => this.setState('idle'), 1600);
                break;
                
            case 'summary':
                this.showSummary();
                break;
                
            case 'pickStrawberry':
                this.activityPickStrawberry();
                break;
                
            case 'bath':
                this.activityBath();
                break;
                
            case 'toast':
                this.activityToaster();
                break;
                
            case 'hideEdge':
                this.activityHideAtEdge();
                break;
                
            case 'encourage':
                this.encourage();
                break;
                
            case 'sleep':
                this.setState('sleeping');
                this.speak('晚安...zzZ', '😴');
                break;
                
            case 'changeTopping':
                const toppings = ['butter', 'jam', 'honey', 'chocolate'];
                const currentIndex = toppings.indexOf(this.state.currentTopping);
                const nextIndex = (currentIndex + 1) % toppings.length;
                this.changeTopping(toppings[nextIndex]);
                break;
                
            case 'settings':
                this.showSettings();
                break;
                
            default:
                console.warn('⚠️ 未知动作:', action);
        }
        
        this.resetIdleTimer();
    }
    
    toggleMenu() {
        if (!this.menu) {
            console.warn('⚠️ 菜单元素未找到');
            return;
        }
        this.menu.classList.toggle('show');
        this.updateStats();
    }
    
    hideMenu() {
        if (this.menu) {
            this.menu.classList.remove('show');
        }
    }
    
    showSummary() {
        // 显示今日概览
        const hour = new Date().getHours();
        let greeting = '';
        if (hour < 12) greeting = '早上好！';
        else if (hour < 18) greeting = '下午好！';
        else greeting = '晚上好！';
        
        const messages = [
            `${greeting} 今天也要加油哦~ 💪`,
            '记得按时休息，劳逸结合！☕',
            '有什么需要帮忙的随时叫我~ 🍞'
        ];
        
        this.setState('happy');
        this.speak(messages[Math.floor(Math.random() * messages.length)], '📊');
        setTimeout(() => this.setState('idle'), 3000);
    }
    
    encourage() {
        // 鼓励用户
        const encouragements = [
            '你做得很棒！继续加油~ 🌟',
            '相信自己，你一定可以的！💪',
            '今天的你也很努力呢~ ✨',
            '休息一下也很重要哦！☕',
            '小吐司永远支持你！❤️',
            '遇到困难不要怕，我陪着你！🍞'
        ];
        
        this.setState('happy');
        this.showEffect('heart');
        this.speak(encouragements[Math.floor(Math.random() * encouragements.length)], '💕');
        setTimeout(() => this.setState('idle'), 3000);
    }
    
    showSettings() {
        const modal = document.getElementById('petSettingsModal');
        if (modal) {
            const autoActivityCheckbox = document.getElementById('petAutoActivity');
            const physicsCheckbox = document.getElementById('petPhysicsEnabled');
            
            if (autoActivityCheckbox) autoActivityCheckbox.checked = this.settings.autoActivity;
            if (physicsCheckbox) physicsCheckbox.checked = this.settings.physicsEnabled;
            
            autoActivityCheckbox?.addEventListener('change', (e) => {
                this.settings.autoActivity = e.target.checked;
            });
            
            physicsCheckbox?.addEventListener('change', (e) => {
                this.settings.physicsEnabled = e.target.checked;
                this.physics.enabled = e.target.checked;
            });
            
            new bootstrap.Modal(modal).show();
        }
    }
    
    updateStats() {
        const moodSpan = document.getElementById('petMoodValue');
        const toastLevelSpan = document.getElementById('petToastLevel');
        
        if (moodSpan) moodSpan.textContent = `${this.state.mood}%`;
        if (toastLevelSpan) toastLevelSpan.textContent = `${this.state.toastLevel}%`;
    }
    
    // ===== 状态管理 =====
    setState(state) {
        const states = ['idle', 'happy', 'surprised', 'sleeping', 'thinking', 
                       'waving', 'walking', 'bathing', 'toasting', 'worried'];
        states.forEach(s => this.pet.classList.remove(s));
        
        this.pet.classList.add(state);
        this.state.currentState = state;
    }
    
    // ===== 配料系统 =====
    changeTopping(topping) {
        const toppingElement = document.querySelector('.toast-topping');
        if (!toppingElement) return;
        
        toppingElement.classList.remove('butter', 'jam', 'honey', 'chocolate');
        toppingElement.classList.add(topping);
        this.state.currentTopping = topping;
        
        const toppingNames = {
            butter: '黄油',
            jam: '草莓酱',
            honey: '蜂蜜',
            chocolate: '巧克力'
        };
        
        this.speak(`涂上${toppingNames[topping]}~`, '✨');
        this.setState('happy');
    }
    
    // ===== 对话系统 =====
    speak(text, emoji = '') {
        console.log('💬 说话:', text, emoji);
        
        if (!this.speechBubble) {
            console.warn('⚠️ speechBubble 未找到');
            return;
        }
        
        // 使用正确的选择器
        const bubbleText = document.getElementById('petSpeechText') || this.speechBubble;
        const bubbleEmoji = document.getElementById('speechEmoji');
        
        if (bubbleText) {
            bubbleText.textContent = text;
        }
        if (bubbleEmoji) {
            bubbleEmoji.textContent = emoji;
            bubbleEmoji.style.display = emoji ? 'block' : 'none';
        }
        
        this.speechBubble.classList.add('show');
        
        if (this.timers.speech) clearTimeout(this.timers.speech);
        
        this.timers.speech = setTimeout(() => {
            this.speechBubble.classList.remove('show');
        }, 3500);
    }
    
    getRandomDialogue(category) {
        const dialogues = this.dialogues[category] || this.dialogues.idle;
        return dialogues[Math.floor(Math.random() * dialogues.length)];
    }
    
    // ===== 工具函数 =====
    getEventPosition(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }
    
    setPosition(x, y) {
        this.pet.style.right = 'auto';
        this.pet.style.left = `${x}px`;
        this.pet.style.bottom = 'auto';
        this.pet.style.top = `${y}px`;
    }
    
    constrainPosition() {
        const bounds = this.getBounds();
        this.physics.x = Math.max(bounds.left, Math.min(this.physics.x, bounds.right));
        this.physics.y = Math.max(bounds.top, Math.min(this.physics.y, bounds.bottom));
        this.setPosition(this.physics.x, this.physics.y);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 初始化桌宠
document.addEventListener('DOMContentLoaded', () => {
    window.toastPet = new ToastPet();
});

// ===== 全局函数供 HTML onclick 调用 =====
function petAction(action) {
    if (window.toastPet) {
        window.toastPet.handleMenuAction(action);
        window.toastPet.hideMenu();
    } else {
        console.error('❌ 桌宠未初始化');
    }
}

function closePetMenu() {
    if (window.toastPet) {
        window.toastPet.hideMenu();
    }
}

function savePetSettings() {
    if (window.toastPet) {
        window.toastPet.saveSettings();
    }
}
