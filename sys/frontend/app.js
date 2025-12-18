// 教室资源管理系统前端JS

const API_BASE = '/api';
let currentUser = null;
let categoryChart = null;
let loadingCount = 0;

// ========== 图表颜色配置 ==========
function getChartTextColor() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? '#e0e0e0' : '#666';
}

function getChartOptions() {
    const textColor = getChartTextColor();
    return {
        plugins: {
            legend: {
                labels: { color: textColor }
            }
        },
        scales: {
            x: { ticks: { color: textColor } },
            y: { ticks: { color: textColor } }
        }
    };
}

// ========== 分页配置 ==========
const PAGE_SIZE = 10; // 每页显示条数
let paginationState = {
    classrooms: { page: 1, total: 0 },
    courses: { page: 1, total: 0 },
    schedules: { page: 1, total: 0 },
    equipments: { page: 1, total: 0 },
    classes: { page: 1, total: 0 },
    bookings: { page: 1, total: 0 },
    notices: { page: 1, total: 0 },
    users: { page: 1, total: 0 },
    enrollment: { page: 1, total: 0 }
};

// ========== 实时时间显示 ==========
function updateCurrentTime() {
    const now = new Date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const formatted = `${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const timeEl = document.getElementById('currentTime');
    if (timeEl) {
        timeEl.textContent = formatted;
    }
}

// 初始化时钟
setInterval(updateCurrentTime, 60000); // 每分钟更新
document.addEventListener('DOMContentLoaded', updateCurrentTime);

// ========== 加载状态管理 ==========
function showLoading(message = '加载中...') {
    loadingCount++;
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
                <p class="loading-text mt-3 mb-0">${message}</p>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(255,255,255,0.9); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(2px);
        `;
        document.body.appendChild(overlay);
    } else {
        overlay.querySelector('.loading-text').textContent = message;
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    loadingCount--;
    if (loadingCount <= 0) {
        loadingCount = 0;
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }
}

// ========== 工具函数 ==========
async function api(endpoint, options = {}, retryCount = 0) {
    const url = API_BASE + endpoint;
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options
    };
    
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
    config.signal = controller.signal;
    
    try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || '请求失败');
        }
        if (response.status === 204) return null;
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('API Error:', error);
        
        // 网络错误自动重试一次
        if (retryCount < 1 && (error.name === 'AbortError' || error.message === 'Failed to fetch' || error.message.includes('NetworkError'))) {
            console.log('正在重试请求...');
            await new Promise(r => setTimeout(r, 1000)); // 等待1秒
            return api(endpoint, options, retryCount + 1);
        }
        
        // 更友好的错误消息
        if (error.name === 'AbortError') {
            throw new Error('请求超时，请检查网络连接或稍后重试');
        } else if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
            throw new Error('网络连接失败，请检查服务器是否启动');
        }
        throw error;
    }
}

// 带加载状态的API调用
async function apiWithLoading(endpoint, options = {}, loadingMsg = '加载中...') {
    showLoading(loadingMsg);
    try {
        const result = await api(endpoint, options);
        return result;
    } finally {
        hideLoading();
    }
}

function showAlert(message, type = 'success') {
    // 创建容器（如果不存在）
    let container = document.getElementById('alertContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'alertContainer';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
        document.body.appendChild(container);
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.style.cssText = `
        min-width: 320px;
        max-width: 450px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        border-radius: 12px;
        border: none;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    
    const icons = {
        'success': '<i class="bi bi-check-circle-fill me-2" style="font-size: 1.2em;"></i>',
        'danger': '<i class="bi bi-exclamation-triangle-fill me-2" style="font-size: 1.2em;"></i>',
        'warning': '<i class="bi bi-exclamation-circle-fill me-2" style="font-size: 1.2em;"></i>',
        'info': '<i class="bi bi-info-circle-fill me-2" style="font-size: 1.2em;"></i>'
    };
    
    alertDiv.innerHTML = `
        <div style="display: flex; align-items: center;">
            ${icons[type] || ''}
            <span style="flex: 1;">${message}</span>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%);"></button>
        <div class="progress-bar-wrapper" style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; border-radius: 0 0 12px 12px; overflow: hidden;">
            <div class="alert-progress" style="height: 100%; background: rgba(255,255,255,0.5); width: 100%; transition: width 3s linear;"></div>
        </div>
    `;
    
    container.appendChild(alertDiv);
    
    // 入场动画
    requestAnimationFrame(() => {
        alertDiv.style.transform = 'translateX(0)';
        alertDiv.style.opacity = '1';
    });
    
    // 进度条动画
    const progressBar = alertDiv.querySelector('.alert-progress');
    setTimeout(() => {
        progressBar.style.width = '0%';
    }, 100);
    
    // 自动移除
    setTimeout(() => {
        alertDiv.style.transform = 'translateX(100%)';
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 400);
    }, 3000);
}

// ========== 分页渲染函数 ==========
function renderPagination(containerId, module, totalItems, loadFunction) {
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    const currentPage = paginationState[module].page;
    paginationState[module].total = totalItems;
    
    if (totalPages <= 1) {
        document.getElementById(containerId).innerHTML = '';
        return;
    }
    
    let html = '<nav><ul class="pagination justify-content-center mb-0">';
    
    // 上一页
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="goToPage('${module}', ${currentPage - 1}, ${loadFunction.name}); return false;">
            <i class="bi bi-chevron-left"></i>
        </a>
    </li>`;
    
    // 页码
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage('${module}', 1, ${loadFunction.name}); return false;">1</a></li>`;
        if (startPage > 2) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" onclick="goToPage('${module}', ${i}, ${loadFunction.name}); return false;">${i}</a>
        </li>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
        html += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage('${module}', ${totalPages}, ${loadFunction.name}); return false;">${totalPages}</a></li>`;
    }
    
    // 下一页
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="goToPage('${module}', ${currentPage + 1}, ${loadFunction.name}); return false;">
            <i class="bi bi-chevron-right"></i>
        </a>
    </li>`;
    
    html += '</ul></nav>';
    
    // 显示信息
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, totalItems);
    html += `<div class="text-center text-muted small mt-2">显示 ${start}-${end} 条，共 ${totalItems} 条</div>`;
    
    document.getElementById(containerId).innerHTML = html;
}

function goToPage(module, page, loadFunction) {
    paginationState[module].page = page;
    loadFunction();
}

function paginateData(data, module) {
    const page = paginationState[module].page;
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return data.slice(start, end);
}

// ========== 美化确认对话框 ==========
function confirmAction(message, title = '确认操作', type = 'warning') {
    return new Promise((resolve) => {
        // 移除旧的确认框
        const oldModal = document.getElementById('confirmModal');
        if (oldModal) oldModal.remove();
        
        const iconMap = {
            'warning': '<i class="bi bi-exclamation-triangle-fill text-warning" style="font-size: 48px;"></i>',
            'danger': '<i class="bi bi-x-circle-fill text-danger" style="font-size: 48px;"></i>',
            'info': '<i class="bi bi-info-circle-fill text-primary" style="font-size: 48px;"></i>',
            'success': '<i class="bi bi-check-circle-fill text-success" style="font-size: 48px;"></i>'
        };
        
        const btnClassMap = {
            'warning': 'btn-warning',
            'danger': 'btn-danger',
            'info': 'btn-primary',
            'success': 'btn-success'
        };
        
        const modalHtml = `
            <div class="modal fade" id="confirmModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content" style="border-radius: 20px; overflow: hidden;">
                        <div class="modal-body text-center py-4">
                            <div class="mb-3 confirm-icon">${iconMap[type] || iconMap.warning}</div>
                            <h5 class="mb-2">${title}</h5>
                            <p class="text-muted mb-0">${message}</p>
                        </div>
                        <div class="modal-footer justify-content-center border-0 pb-4">
                            <button type="button" class="btn btn-outline-secondary px-4" id="confirmCancel">取消</button>
                            <button type="button" class="btn ${btnClassMap[type] || btnClassMap.warning} px-4" id="confirmOk">确定</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        
        document.getElementById('confirmOk').onclick = () => {
            modal.hide();
            resolve(true);
        };
        
        document.getElementById('confirmCancel').onclick = () => {
            modal.hide();
            resolve(false);
        };
        
        document.getElementById('confirmModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('confirmModal').remove();
        });
        
        modal.show();
    });
}

// ========== 表单验证 ==========
function validateForm(formId, rules) {
    const form = document.getElementById(formId);
    if (!form) return { valid: false, errors: ['表单不存在'] };
    
    const errors = [];
    let valid = true;
    
    // 清除之前的验证状态
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    
    for (const [fieldName, fieldRules] of Object.entries(rules)) {
        const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (!field) continue;
        
        const value = field.value.trim();
        
        for (const rule of fieldRules) {
            let isValid = true;
            let message = '';
            
            if (rule.required && !value) {
                isValid = false;
                message = rule.message || '此字段为必填';
            } else if (rule.minLength && value.length < rule.minLength) {
                isValid = false;
                message = rule.message || `最少需要${rule.minLength}个字符`;
            } else if (rule.maxLength && value.length > rule.maxLength) {
                isValid = false;
                message = rule.message || `最多允许${rule.maxLength}个字符`;
            } else if (rule.min !== undefined && Number(value) < rule.min) {
                isValid = false;
                message = rule.message || `最小值为${rule.min}`;
            } else if (rule.max !== undefined && Number(value) > rule.max) {
                isValid = false;
                message = rule.message || `最大值为${rule.max}`;
            } else if (rule.pattern && !rule.pattern.test(value)) {
                isValid = false;
                message = rule.message || '格式不正确';
            } else if (rule.custom && !rule.custom(value)) {
                isValid = false;
                message = rule.message || '验证失败';
            }
            
            if (!isValid) {
                valid = false;
                errors.push(message);
                field.classList.add('is-invalid');
                
                // 添加错误提示
                const feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.textContent = message;
                field.parentNode.appendChild(feedback);
                break;
            }
        }
    }
    
    return { valid, errors };
}

// 确认对话框
function confirmAction(message, title = '确认操作') {
    return new Promise((resolve) => {
        // 创建确认模态框
        const modalId = 'confirmModal_' + Date.now();
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="bi bi-question-circle text-warning me-2"></i>${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0">${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-danger" id="${modalId}_confirm">确认</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modalEl = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalEl);
        
        modalEl.querySelector(`#${modalId}_confirm`).addEventListener('click', () => {
            modal.hide();
            resolve(true);
        });
        
        modalEl.addEventListener('hidden.bs.modal', () => {
            modalEl.remove();
            resolve(false);
        });
        
        modal.show();
    });
}

function getCategoryName(category) {
    const map = {
        'large': '大教室',
        'medium': '中教室',
        'small': '小教室',
        'ladder': '阶梯教室',
        'lab': '实验室',
        'meeting': '会议室'
    };
    return map[category] || category;
}

function getStatusBadge(status) {
    const map = {
        'available': '<span class="badge badge-status badge-available">可用</span>',
        'maintenance': '<span class="badge badge-status badge-maintenance">维护中</span>',
        'disabled': '<span class="badge badge-status badge-disabled">停用</span>'
    };
    return map[status] || status;
}

function getWeekdayName(weekday) {
    const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return days[weekday] || weekday;
}

function getCourseTypeName(type) {
    const map = {
        'required': '必修',
        'elective': '选修',
        'public': '公选'
    };
    return map[type] || type;
}

// ========== 权限控制 ==========
function checkPermission(action) {
    if (!currentUser) return false;
    
    // 管理员有所有权限
    if (currentUser.role === 'admin') return true;
    
    // 教师权限
    if (currentUser.role === 'teacher') {
        const teacherAllowed = ['view', 'viewSchedule', 'viewTimetable', 'viewStatistics'];
        return teacherAllowed.includes(action);
    }
    
    // 学生权限（只能查看）
    if (currentUser.role === 'student') {
        const studentAllowed = ['viewTimetable', 'viewAvailable'];
        return studentAllowed.includes(action);
    }
    
    return false;
}

function updateUIByRole() {
    if (!currentUser) return;
    
    const role = currentUser.role;
    
    // 隐藏学生不能访问的菜单
    if (role === 'student') {
        document.querySelectorAll('.nav-item[data-page="classrooms"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.nav-item[data-page="courses"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.nav-item[data-page="schedules"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.nav-item[data-page="equipment"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.nav-item[data-page="classes"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.nav-item[data-page="statistics"]').forEach(el => el.style.display = 'none');
    }
    
    // 隐藏教师部分功能的操作按钮
    if (role === 'teacher') {
        // 教师可以查看但不能编辑教室
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
}

// ========== 登录相关 ==========
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // 登录按钮加载状态
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>登录中...';
    submitBtn.disabled = true;
    
    try {
        const result = await api('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        currentUser = result.user;
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // 登录成功动画
        submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>登录成功!';
        submitBtn.classList.remove('btn-primary');
        submitBtn.classList.add('btn-success');
        
        // 延迟切换页面以显示成功状态
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 登录页面淡出
        const loginPage = document.getElementById('loginPage');
        loginPage.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        loginPage.style.opacity = '0';
        loginPage.style.transform = 'scale(0.95)';
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        loginPage.style.display = 'none';
        
        // 主界面淡入
        const mainContainer = document.getElementById('mainContainer');
        mainContainer.style.opacity = '0';
        mainContainer.style.transform = 'translateY(20px)';
        mainContainer.style.display = 'block';
        
        setTimeout(() => {
            mainContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            mainContainer.style.opacity = '1';
            mainContainer.style.transform = 'translateY(0)';
        }, 50);
        
        // 更新用户名显示（顶部和侧边栏）
        const userName = currentUser.real_name || currentUser.username;
        document.getElementById('currentUser').textContent = userName;
        const sidebarUserName = document.getElementById('sidebarUserName');
        if (sidebarUserName) sidebarUserName.textContent = userName;
        
        let roleText = '用户';
        if (currentUser.role === 'admin') roleText = '管理员';
        else if (currentUser.role === 'teacher') roleText = '教师';
        else if (currentUser.role === 'student') roleText = '学生';
        document.getElementById('userRole').textContent = roleText;
        
        const avatar = userName[0].toUpperCase();
        document.getElementById('userAvatar').textContent = avatar;
        
        // 更新下拉菜单中的用户信息
        const dropdownAvatar = document.getElementById('dropdownAvatar');
        const dropdownUserName = document.getElementById('dropdownUserName');
        const dropdownUserRole = document.getElementById('dropdownUserRole');
        if (dropdownAvatar) dropdownAvatar.textContent = avatar;
        if (dropdownUserName) dropdownUserName.textContent = userName;
        if (dropdownUserRole) dropdownUserRole.textContent = roleText;
        
        // 设置角色class用于权限控制
        document.body.classList.remove('role-admin', 'role-teacher', 'role-student');
        document.body.classList.add('role-' + currentUser.role);
        
        // 根据角色更新UI
        updateUIByRole();
        
        // 显示欢迎提示
        showAlert(`欢迎回来，${currentUser.real_name || currentUser.username}！`, 'success');
        
        initDashboard();
        
        // 恢复按钮状态以便下次使用
        submitBtn.innerHTML = originalBtnContent;
        submitBtn.classList.remove('btn-success');
        submitBtn.classList.add('btn-primary');
        submitBtn.disabled = false;
        
    } catch (error) {
        // 登录失败抖动效果
        const loginCard = document.querySelector('.login-card');
        loginCard.style.animation = 'shake 0.5s ease';
        setTimeout(() => loginCard.style.animation = '', 500);
        
        submitBtn.innerHTML = originalBtnContent;
        submitBtn.disabled = false;
        showAlert(error.message, 'danger');
    }
});

function logout() {
    // 退出确认动画
    const mainContainer = document.getElementById('mainContainer');
    mainContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    mainContainer.style.opacity = '0';
    mainContainer.style.transform = 'scale(0.98)';
    
    setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        document.body.classList.remove('role-admin', 'role-teacher', 'role-student');
        mainContainer.style.display = 'none';
        
        // 登录页面淡入
        const loginPage = document.getElementById('loginPage');
        loginPage.style.opacity = '0';
        loginPage.style.transform = 'scale(1.05)';
        loginPage.style.display = 'flex';
        
        setTimeout(() => {
            loginPage.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            loginPage.style.opacity = '1';
            loginPage.style.transform = 'scale(1)';
        }, 50);
    }, 300);
}

// ========== 全局加载动画 ==========
function showGlobalLoading(message = '加载中...') {
    const loading = document.getElementById('globalLoading');
    const loadingText = document.getElementById('loadingText');
    if (loading) {
        loadingText.textContent = message;
        loading.classList.add('show');
    }
}

function hideGlobalLoading() {
    const loading = document.getElementById('globalLoading');
    if (loading) {
        loading.classList.remove('show');
    }
}

// ========== 页面切换动画 ==========
function switchPageWithAnimation(targetPageId) {
    const allPages = document.querySelectorAll('.page-content');
    const targetPage = document.getElementById('page-' + targetPageId);
    
    // 先隐藏所有页面
    allPages.forEach(p => {
        if (p.classList.contains('active')) {
            p.style.opacity = '0';
            p.style.transform = 'translateY(20px)';
        }
    });
    
    // 延迟后切换
    setTimeout(() => {
        allPages.forEach(p => p.classList.remove('active'));
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.style.opacity = '1';
            targetPage.style.transform = 'translateY(0)';
        }
    }, 150);
}

// ========== 按钮点击动效 ==========
function addRippleEffect(button) {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(255,255,255,0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: rippleEffect 0.6s linear;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
        `;
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
}

// 为所有按钮添加点击动效
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn').forEach(addRippleEffect);
});

// 动态创建的按钮也添加效果
const originalAppendChild = Element.prototype.appendChild;
Element.prototype.appendChild = function(child) {
    const result = originalAppendChild.call(this, child);
    if (child.classList && child.classList.contains('btn')) {
        addRippleEffect(child);
    }
    return result;
};

// ========== 导航相关 ==========
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        
        // 更新导航高亮
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // 带动画切换页面
        switchPageWithAnimation(page);
        
        // 更新标题（带动画）
        const titles = {
            'dashboard': '仪表盘',
            'classrooms': '教室管理',
            'courses': '课程管理',
            'schedules': '排课管理',
            'timetable': '课表查询',
            'available': '空闲教室查询',
            'equipment': '设备管理',
            'classes': '班级管理',
            'bookings': '教室预约',
            'enrollment': '学生选课',
            'notices': '通知公告',
            'statistics': '统计分析',
            'users': '用户管理'
        };
        
        // 页面标题切换动画
        const pageTitle = document.getElementById('pageTitle');
        pageTitle.classList.add('changing');
        setTimeout(() => {
            pageTitle.textContent = titles[page] || page;
        }, 200);
        setTimeout(() => {
            pageTitle.classList.remove('changing');
        }, 400);
        
        // 延迟加载页面数据（等待动画完成）
        setTimeout(() => {
            switch (page) {
                case 'dashboard': initDashboard(); break;
                case 'classrooms': loadClassrooms(); break;
                case 'courses': loadCourses(); break;
                case 'schedules': loadSchedules(); break;
                case 'timetable': initTimetable(); break;
                case 'available': initAvailable(); break;
                case 'equipment': loadEquipments(); break;
                case 'classes': loadClasses(); break;
                case 'bookings': loadBookings(); break;
                case 'enrollment': loadEnrollment(); break;
                case 'notices': loadNotices(); break;
                case 'statistics': loadStatistics(); break;
                case 'users': loadUsers(); break;
            }
        }, 200);
    });
});

// ========== 数字滚动动画 ==========
function animateNumber(element, targetNumber, duration = 1000) {
    const startNumber = 0;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用easeOutExpo缓动函数
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const currentNumber = Math.floor(startNumber + (targetNumber - startNumber) * easeProgress);
        
        element.textContent = currentNumber;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = targetNumber;
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// 表格行动画
function animateTableRows(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
        }, index * 50);
    });
}

// ========== 仪表盘 ==========
async function initDashboard() {
    console.log('initDashboard 开始执行');
    
    // 分别加载数据，避免一个失败影响全部
    let classrooms = [], courses = [], teachers = [], utilization = [];
    
    try {
        classrooms = await api('/classrooms');
        console.log('教室数据:', classrooms.length);
    } catch (e) { console.error('加载教室失败:', e); }
    
    try {
        courses = await api('/courses');
        console.log('课程数据:', courses.length);
    } catch (e) { console.error('加载课程失败:', e); }
    
    try {
        teachers = await api('/teachers');
        console.log('教师数据:', teachers.length);
    } catch (e) { console.error('加载教师失败:', e); }
    
    try {
        utilization = await api('/statistics/utilization');
        console.log('利用率数据:', utilization.length);
    } catch (e) { console.error('加载利用率失败:', e); }
    
    // 更新统计数字（带动画）
    const statClassrooms = document.getElementById('statClassrooms');
    const statCourses = document.getElementById('statCourses');
    const statTeachers = document.getElementById('statTeachers');
    const statUtilization = document.getElementById('statUtilization');
    
    // 使用数字滚动动画
    animateNumber(statClassrooms, classrooms.length || 0, 800);
    animateNumber(statCourses, courses.length || 0, 800);
    animateNumber(statTeachers, teachers.length || 0, 800);
    
    // 计算平均利用率
    if (utilization && utilization.length > 0) {
        const avgUtil = utilization.reduce((sum, u) => sum + parseFloat(u.utilization_rate || 0), 0) / utilization.length;
        // 利用率特殊处理
        let currentUtil = 0;
        const targetUtil = parseFloat(avgUtil.toFixed(1));
        const utilInterval = setInterval(() => {
            currentUtil += targetUtil / 30;
            if (currentUtil >= targetUtil) {
                currentUtil = targetUtil;
                clearInterval(utilInterval);
            }
            statUtilization.textContent = currentUtil.toFixed(1) + '%';
        }, 30);
    } else {
        statUtilization.textContent = '0%';
    }
    
    // 今日课程
    try {
        const today = new Date().getDay() || 7;
        console.log('今天是周', today);
        const schedules = await api('/schedules?weekday=' + today);
        
        let scheduleHtml = '';
        if (schedules.length === 0) {
            scheduleHtml = '<p class="text-muted text-center py-4"><i class="bi bi-calendar-x me-2"></i>今日暂无课程安排</p>';
        } else {
            scheduleHtml = '<table class="table" id="todayScheduleTable"><thead><tr><th>时间</th><th>课程</th><th>教师</th><th>教室</th></tr></thead><tbody>';
            schedules.forEach(s => {
                scheduleHtml += `<tr>
                    <td><span class="badge bg-primary">第${s.start_section}-${s.end_section}节</span></td>
                    <td><strong>${s.course_name}</strong></td>
                    <td><i class="bi bi-person me-1"></i>${s.teacher_name}</td>
                    <td><i class="bi bi-door-open me-1"></i>${s.classroom_name}</td>
                </tr>`;
            });
            scheduleHtml += '</tbody></table>';
        }
        document.getElementById('todaySchedule').innerHTML = scheduleHtml;
        
        // 表格行动画
        if (schedules.length > 0) {
            setTimeout(() => animateTableRows('todayScheduleTable'), 100);
        }
    } catch (error) {
        console.error('加载今日课程失败:', error);
        document.getElementById('todaySchedule').innerHTML = '<p class="text-danger"><i class="bi bi-exclamation-triangle me-2"></i>加载失败</p>';
    }
    
    // 教室类型分布图
    try {
        const categoryCount = {};
        classrooms.forEach(c => {
            const cat = getCategoryName(c.category);
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
        
        const ctx = document.getElementById('categoryChart').getContext('2d');
        if (categoryChart) categoryChart.destroy();
        const textColor = getChartTextColor();
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryCount),
                datasets: [{
                    data: Object.values(categoryCount),
                    backgroundColor: ['#4a90d9', '#28a745', '#fd7e14', '#6f42c1', '#dc3545', '#20c997']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor }
                    }
                }
            }
        });
    } catch (error) {
        console.error('绘制图表失败:', error);
    }
    
    console.log('initDashboard 执行完毕');
}

// ========== 教室管理 ==========
async function loadClassrooms() {
    showLoading('加载教室数据...');
    try {
        const building = document.getElementById('filterBuilding')?.value || '';
        const category = document.getElementById('filterCategory')?.value || '';
        const minSeats = document.getElementById('filterMinSeats')?.value || '';
        
        let url = '/classrooms?';
        if (building) url += `building=${building}&`;
        if (category) url += `category=${category}&`;
        if (minSeats) url += `minSeats=${minSeats}&`;
        
        const allClassrooms = await api(url);
        
        // 更新分页状态
        paginationState.classrooms.total = allClassrooms.length;
        const classrooms = paginateData(allClassrooms, 'classrooms');
        
        let html = '';
        if (classrooms.length === 0) {
            html = '<tr><td colspan="7" class="text-center py-5"><div class="empty-state"><i class="bi bi-door-open"></i><p>暂无教室数据</p></div></td></tr>';
        } else {
            classrooms.forEach((c, index) => {
                html += `<tr class="table-row-animate" style="animation-delay: ${index * 0.05}s">
                    <td><span class="fw-medium">${c.classroom_code}</span></td>
                    <td>${c.name}</td>
                    <td>${c.building || '<span class="text-muted">-</span>'}</td>
                    <td>${getCategoryName(c.category)}</td>
                    <td><span class="badge bg-secondary">${c.seats}座</span></td>
                    <td>${getStatusBadge(c.status)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-action-view" data-tooltip="查看详情" onclick="viewClassroomDetail(${c.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn-action btn-action-edit" data-tooltip="编辑" onclick="editClassroom(${c.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn-action btn-action-delete" data-tooltip="删除" onclick="deleteClassroom(${c.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            });
        }
        
        document.getElementById('classroomTable').innerHTML = html;
        
        // 渲染分页
        renderPagination('classroomPagination', 'classrooms', allClassrooms.length, loadClassrooms);
    } catch (error) {
        console.error('加载教室失败:', error);
        document.getElementById('classroomTable').innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4"><i class="bi bi-exclamation-triangle me-2"></i>' + error.message + '</td></tr>';
        showAlert(error.message, 'danger');
    } finally {
        hideLoading();
    }
}

// 查看教室详情
async function viewClassroomDetail(id) {
    try {
        const classroom = await api('/classrooms/' + id);
        const modalHtml = `
            <div class="modal fade" id="classroomDetailModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="bi bi-door-open me-2"></i>${classroom.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-6">
                                    <label class="text-muted small">教室编号</label>
                                    <div class="fw-bold">${classroom.classroom_code}</div>
                                </div>
                                <div class="col-6">
                                    <label class="text-muted small">所属楼栋</label>
                                    <div class="fw-bold">${classroom.building || '-'}</div>
                                </div>
                                <div class="col-6">
                                    <label class="text-muted small">楼层</label>
                                    <div class="fw-bold">${classroom.floor || '-'}楼</div>
                                </div>
                                <div class="col-6">
                                    <label class="text-muted small">类型</label>
                                    <div class="fw-bold">${getCategoryName(classroom.category)}</div>
                                </div>
                                <div class="col-6">
                                    <label class="text-muted small">座位数</label>
                                    <div class="fw-bold">${classroom.seats}座</div>
                                </div>
                                <div class="col-6">
                                    <label class="text-muted small">状态</label>
                                    <div>${getStatusBadge(classroom.status)}</div>
                                </div>
                                <div class="col-12">
                                    <label class="text-muted small">位置描述</label>
                                    <div class="fw-bold">${classroom.location || '-'}</div>
                                </div>
                                <div class="col-12">
                                    <label class="text-muted small">备注</label>
                                    <div>${classroom.remark || '无'}</div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-primary" onclick="editClassroom(${id}); bootstrap.Modal.getInstance(document.getElementById('classroomDetailModal')).hide();">
                                <i class="bi bi-pencil me-1"></i>编辑
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 移除旧模态框
        const oldModal = document.getElementById('classroomDetailModal');
        if (oldModal) oldModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        new bootstrap.Modal(document.getElementById('classroomDetailModal')).show();
        
        document.getElementById('classroomDetailModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    } catch (error) {
        showAlert('获取教室详情失败: ' + error.message, 'danger');
    }
}

function showAddClassroomModal() {
    document.getElementById('classroomModalTitle').textContent = '新增教室';
    document.getElementById('classroomForm').reset();
    document.getElementById('classroomId').value = '';
    document.getElementById('classroomCode').disabled = false;
    new bootstrap.Modal(document.getElementById('classroomModal')).show();
}

async function editClassroom(id) {
    try {
        const classroom = await api('/classrooms/' + id);
        
        document.getElementById('classroomModalTitle').textContent = '编辑教室';
        document.getElementById('classroomId').value = id;
        document.getElementById('classroomCode').value = classroom.classroom_code;
        document.getElementById('classroomCode').disabled = true;
        document.getElementById('classroomName').value = classroom.name;
        document.getElementById('classroomBuilding').value = classroom.building || '';
        document.getElementById('classroomFloor').value = classroom.floor || '';
        document.getElementById('classroomCategory').value = classroom.category;
        document.getElementById('classroomSeats').value = classroom.seats;
        document.getElementById('classroomOrientation').value = classroom.orientation || '';
        document.getElementById('classroomStatus').value = classroom.status;
        document.getElementById('classroomLocation').value = classroom.location || '';
        document.getElementById('classroomRemark').value = classroom.remark || '';
        
        new bootstrap.Modal(document.getElementById('classroomModal')).show();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function saveClassroom() {
    // 表单验证
    const validation = validateForm('classroomForm', {
        'classroomCode': [{ required: true, message: '请输入教室编号' }],
        'classroomName': [{ required: true, message: '请输入教室名称' }],
        'classroomBuilding': [{ required: true, message: '请选择所属楼栋' }],
        'classroomSeats': [
            { required: true, message: '请输入座位数' },
            { min: 1, message: '座位数必须大于0' },
            { max: 1000, message: '座位数不能超过1000' }
        ]
    });
    
    if (!validation.valid) {
        return;
    }
    
    const id = document.getElementById('classroomId').value;
    const data = {
        classroom_code: document.getElementById('classroomCode').value,
        name: document.getElementById('classroomName').value,
        building: document.getElementById('classroomBuilding').value,
        floor: document.getElementById('classroomFloor').value,
        category: document.getElementById('classroomCategory').value,
        seats: document.getElementById('classroomSeats').value,
        orientation: document.getElementById('classroomOrientation').value,
        status: document.getElementById('classroomStatus').value,
        location: document.getElementById('classroomLocation').value,
        remark: document.getElementById('classroomRemark').value
    };
    
    try {
        if (id) {
            await apiWithLoading('/classrooms/' + id, {
                method: 'PUT',
                body: JSON.stringify(data)
            }, '保存中...');
            showAlert('更新成功');
        } else {
            await apiWithLoading('/classrooms', {
                method: 'POST',
                body: JSON.stringify(data)
            }, '保存中...');
            showAlert('创建成功');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('classroomModal')).hide();
        loadClassrooms();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function deleteClassroom(id) {
    const confirmed = await confirmAction('确定要删除这个教室吗？删除后将无法恢复。', '删除教室');
    if (!confirmed) return;
    
    try {
        await apiWithLoading('/classrooms/' + id, { method: 'DELETE' }, '删除中...');
        showAlert('删除成功');
        loadClassrooms();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ========== 课程管理 ==========
async function loadCourses() {
    showLoading('加载课程数据...');
    try {
        const semester = document.getElementById('filterSemester').value;
        const courses = await api('/courses?semester=' + semester);
        
        // 更新分页状态
        paginationState.courses.total = courses.length;
        const paginatedData = paginateData(courses, 'courses');
        
        let html = '';
        if (paginatedData.length === 0) {
            html = '<tr><td colspan="8" class="text-center py-5"><div class="empty-state"><i class="bi bi-book"></i><p>暂无课程数据</p></div></td></tr>';
        } else {
            paginatedData.forEach((c, index) => {
                html += `<tr class="table-row-animate" style="animation-delay: ${index * 0.05}s">
                    <td><span class="fw-medium">${c.course_code}</span></td>
                    <td>${c.name}</td>
                    <td>${c.teacher_name || '<span class="text-muted">-</span>'}</td>
                    <td><span class="badge bg-primary">${c.credits || 0}</span></td>
                    <td>${c.hours || '-'}</td>
                    <td>${getCourseTypeName(c.course_type)}</td>
                    <td>${c.capacity || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-action-edit" data-tooltip="编辑" onclick="editCourse(${c.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn-action btn-action-delete" data-tooltip="删除" onclick="deleteCourse(${c.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            });
        }
        
        document.getElementById('courseTable').innerHTML = html;
        renderPagination('coursePagination', 'courses', courses.length, loadCourses);
    } catch (error) {
        document.getElementById('courseTable').innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4"><i class="bi bi-exclamation-triangle me-2"></i>${error.message}</td></tr>`;
        showAlert(error.message, 'danger');
    } finally {
        hideLoading();
    }
}

let editingCourseId = null;

async function showAddCourseModal() {
    editingCourseId = null;
    document.getElementById('courseModalTitle').textContent = '新增课程';
    
    // 加载教师列表
    try {
        const teachers = await api('/teachers');
        let options = '<option value="">请选择教师</option>';
        teachers.forEach(t => {
            options += `<option value="${t.id}">${t.teacher_code} - ${t.name}</option>`;
        });
        document.getElementById('courseTeacher').innerHTML = options;
    } catch (error) {
        console.error('加载教师列表失败:', error);
    }
    
    document.getElementById('courseForm').reset();
    new bootstrap.Modal(document.getElementById('courseModal')).show();
}

async function editCourse(id) {
    editingCourseId = id;
    document.getElementById('courseModalTitle').textContent = '编辑课程';
    
    try {
        // 加载课程信息和教师列表
        const [course, teachers] = await Promise.all([
            api('/courses/' + id),
            api('/teachers')
        ]);
        
        let options = '<option value="">请选择教师</option>';
        teachers.forEach(t => {
            options += `<option value="${t.id}">${t.teacher_code} - ${t.name}</option>`;
        });
        document.getElementById('courseTeacher').innerHTML = options;
        
        document.getElementById('courseCode').value = course.course_code || '';
        document.getElementById('courseName').value = course.name || '';
        document.getElementById('courseTeacher').value = course.teacher_id || '';
        document.getElementById('courseCredits').value = course.credits || 0;
        document.getElementById('courseHours').value = course.hours || 0;
        document.getElementById('courseType').value = course.course_type || 'required';
        document.getElementById('courseCapacity').value = course.capacity || 30;
        document.getElementById('courseDescription').value = course.description || '';
        
        new bootstrap.Modal(document.getElementById('courseModal')).show();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function saveCourse() {
    const data = {
        course_code: document.getElementById('courseCode').value.trim(),
        name: document.getElementById('courseName').value.trim(),
        teacher_id: document.getElementById('courseTeacher').value || null,
        credits: parseInt(document.getElementById('courseCredits').value) || 0,
        hours: parseInt(document.getElementById('courseHours').value) || 0,
        course_type: document.getElementById('courseType').value,
        capacity: parseInt(document.getElementById('courseCapacity').value) || 30,
        description: document.getElementById('courseDescription').value.trim()
    };
    
    if (!data.course_code || !data.name) {
        showAlert('请填写课程编号和名称', 'warning');
        return;
    }
    
    try {
        if (editingCourseId) {
            await apiWithLoading('/courses/' + editingCourseId, {
                method: 'PUT',
                body: JSON.stringify(data)
            }, '保存中...');
            showAlert('课程更新成功');
        } else {
            await apiWithLoading('/courses', {
                method: 'POST',
                body: JSON.stringify(data)
            }, '保存中...');
            showAlert('课程添加成功');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('courseModal')).hide();
        loadCourses();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function deleteCourse(id) {
    const confirmed = await confirmAction('确定要删除这门课程吗？相关的排课记录也会被删除。', '删除课程', 'danger');
    if (!confirmed) return;
    
    try {
        await apiWithLoading('/courses/' + id, { method: 'DELETE' }, '删除中...');
        showAlert('删除成功');
        loadCourses();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ========== 排课管理 ==========
async function loadSchedules() {
    showLoading('加载排课数据...');
    try {
        const weekday = document.getElementById('filterWeekday').value;
        let url = '/schedules?';
        if (weekday) url += `weekday=${weekday}&`;
        
        const schedules = await api(url);
        
        // 更新分页状态
        paginationState.schedules.total = schedules.length;
        const paginatedData = paginateData(schedules, 'schedules');
        
        let html = '';
        if (paginatedData.length === 0) {
            html = '<tr><td colspan="7" class="text-center py-5"><div class="empty-state"><i class="bi bi-calendar-week"></i><p>暂无排课数据</p></div></td></tr>';
        } else {
            paginatedData.forEach((s, index) => {
                html += `<tr class="table-row-animate" style="animation-delay: ${index * 0.05}s">
                    <td><span class="fw-medium">${s.course_name}</span></td>
                    <td>${s.teacher_name}</td>
                    <td><span class="badge bg-info">${s.classroom_name}</span></td>
                    <td>${s.class_name || '<span class="text-muted">-</span>'}</td>
                    <td><i class="bi bi-clock me-1"></i>${getWeekdayName(s.weekday)} 第${s.start_section}-${s.end_section}节</td>
                    <td><span class="badge bg-secondary">第${s.start_week}-${s.end_week}周</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-action-delete" data-tooltip="删除" onclick="deleteSchedule(${s.schedule_id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            });
        }
        
        document.getElementById('scheduleTable').innerHTML = html;
        renderPagination('schedulePagination', 'schedules', schedules.length, loadSchedules);
    } catch (error) {
        document.getElementById('scheduleTable').innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4"><i class="bi bi-exclamation-triangle me-2"></i>${error.message}</td></tr>`;
        showAlert(error.message, 'danger');
    } finally {
        hideLoading();
    }
}

async function showAddScheduleModal() {
    // 加载下拉选项
    const [courses, classrooms, teachers, classes] = await Promise.all([
        api('/courses'),
        api('/classrooms'),
        api('/teachers'),
        api('/classes')
    ]);
    
    let courseOptions = '<option value="">请选择</option>';
    courses.forEach(c => {
        courseOptions += `<option value="${c.id}" data-teacher="${c.teacher_id}">${c.course_code} - ${c.name}</option>`;
    });
    document.getElementById('scheduleCourse').innerHTML = courseOptions;
    
    let classroomOptions = '<option value="">请选择</option>';
    classrooms.forEach(c => {
        classroomOptions += `<option value="${c.id}">${c.classroom_code} - ${c.name} (${c.seats}座)</option>`;
    });
    document.getElementById('scheduleClassroom').innerHTML = classroomOptions;
    
    let teacherOptions = '<option value="">请选择</option>';
    teachers.forEach(t => {
        teacherOptions += `<option value="${t.id}">${t.teacher_code} - ${t.name}</option>`;
    });
    document.getElementById('scheduleTeacher').innerHTML = teacherOptions;
    
    let classOptions = '<option value="">请选择</option>';
    classes.forEach(c => {
        classOptions += `<option value="${c.id}">${c.class_name}</option>`;
    });
    document.getElementById('scheduleClass').innerHTML = classOptions;
    
    // 节次选项
    let sectionOptions = '';
    for (let i = 1; i <= 12; i++) {
        sectionOptions += `<option value="${i}">第${i}节</option>`;
    }
    document.getElementById('scheduleStartSection').innerHTML = sectionOptions;
    document.getElementById('scheduleEndSection').innerHTML = sectionOptions;
    document.getElementById('scheduleEndSection').value = '2';
    
    // 当选择课程时自动选择教师
    document.getElementById('scheduleCourse').addEventListener('change', function() {
        const option = this.options[this.selectedIndex];
        const teacherId = option.dataset.teacher;
        if (teacherId) {
            document.getElementById('scheduleTeacher').value = teacherId;
        }
    });
    
    document.getElementById('scheduleForm').reset();
    new bootstrap.Modal(document.getElementById('scheduleModal')).show();
}

async function saveSchedule() {
    const data = {
        course_id: document.getElementById('scheduleCourse').value,
        classroom_id: document.getElementById('scheduleClassroom').value,
        teacher_id: document.getElementById('scheduleTeacher').value,
        class_id: document.getElementById('scheduleClass').value,
        semester: '2024-2025-1',
        weekday: document.getElementById('scheduleWeekday').value,
        start_section: document.getElementById('scheduleStartSection').value,
        end_section: document.getElementById('scheduleEndSection').value,
        start_week: document.getElementById('scheduleStartWeek').value,
        end_week: document.getElementById('scheduleEndWeek').value,
        week_type: document.getElementById('scheduleWeekType').value
    };
    
    if (!data.course_id || !data.classroom_id || !data.teacher_id) {
        showAlert('请填写完整信息', 'warning');
        return;
    }
    
    try {
        await api('/schedules', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showAlert('排课成功');
        bootstrap.Modal.getInstance(document.getElementById('scheduleModal')).hide();
        loadSchedules();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function deleteSchedule(id) {
    const confirmed = await confirmAction('确定要删除这条排课记录吗？', '删除排课');
    if (!confirmed) return;
    
    try {
        await apiWithLoading('/schedules/' + id, { method: 'DELETE' }, '删除中...');
        showAlert('删除成功');
        loadSchedules();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ========== 排课建议 ==========
async function showScheduleSuggestion() {
    // 创建模态框
    const modalHtml = `
    <div class="modal fade" id="suggestionModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="bi bi-lightbulb"></i> 智能排课建议</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <label class="form-label">选择课程</label>
                            <select class="form-select" id="suggestionCourse">
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">需要座位数</label>
                            <input type="number" class="form-control" id="suggestionSeats" value="40">
                        </div>
                        <div class="col-md-3 d-flex align-items-end">
                            <button class="btn btn-primary w-100" onclick="getSuggestions()">
                                <i class="bi bi-search"></i> 获取建议
                            </button>
                        </div>
                    </div>
                    <div id="suggestionResults">
                        <p class="text-muted text-center">请选择课程并点击获取建议</p>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    
    // 移除旧的模态框
    const oldModal = document.getElementById('suggestionModal');
    if (oldModal) oldModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 加载课程列表
    const courses = await api('/courses');
    let options = '<option value="">请选择课程</option>';
    courses.forEach(c => {
        options += `<option value="${c.id}" data-capacity="${c.capacity || 30}">${c.course_code} - ${c.name}</option>`;
    });
    document.getElementById('suggestionCourse').innerHTML = options;
    
    // 当选择课程时自动设置座位数
    document.getElementById('suggestionCourse').addEventListener('change', function() {
        const option = this.options[this.selectedIndex];
        const capacity = option.dataset.capacity;
        if (capacity) {
            document.getElementById('suggestionSeats').value = capacity;
        }
    });
    
    new bootstrap.Modal(document.getElementById('suggestionModal')).show();
}

async function getSuggestions() {
    const courseId = document.getElementById('suggestionCourse').value;
    const seats = document.getElementById('suggestionSeats').value;
    
    if (!courseId) {
        showAlert('请选择课程', 'warning');
        return;
    }
    
    document.getElementById('suggestionResults').innerHTML = '<p class="text-center"><i class="bi bi-hourglass-split"></i> 正在分析...</p>';
    
    try {
        const suggestions = await api(`/schedule-suggestion?course_id=${courseId}&seats=${seats}`);
        
        if (!suggestions || suggestions.length === 0) {
            document.getElementById('suggestionResults').innerHTML = '<p class="text-muted text-center">没有找到合适的排课建议</p>';
            return;
        }
        
        let html = '<h6 class="mb-3">推荐的排课方案：</h6>';
        html += '<div class="list-group">';
        
        suggestions.forEach((s, index) => {
            const weekdayName = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'][s.weekday] || s.weekday;
            html += `
            <div class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${s.classroom_name} (${s.seats}座)</h6>
                        <p class="mb-1">${weekdayName} 第${s.start_section}-${s.end_section}节</p>
                        <small class="text-muted">${s.building || ''} | 利用率: ${(s.utilization || 0).toFixed(1)}%</small>
                    </div>
                    <button class="btn btn-sm btn-success" onclick="applySuggestion(${courseId}, ${s.classroom_id}, ${s.weekday}, ${s.start_section}, ${s.end_section})">
                        <i class="bi bi-check"></i> 应用
                    </button>
                </div>
            </div>`;
        });
        
        html += '</div>';
        document.getElementById('suggestionResults').innerHTML = html;
        
    } catch (error) {
        document.getElementById('suggestionResults').innerHTML = `<p class="text-danger text-center">${error.message}</p>`;
    }
}

async function applySuggestion(courseId, classroomId, weekday, startSection, endSection) {
    // 获取课程信息以获取教师ID
    const course = await api('/courses/' + courseId).catch(() => null);
    
    if (!course) {
        showAlert('获取课程信息失败', 'danger');
        return;
    }
    
    const data = {
        course_id: courseId,
        classroom_id: classroomId,
        teacher_id: course.teacher_id,
        semester: '2024-2025-1',
        weekday: weekday,
        start_section: startSection,
        end_section: endSection,
        start_week: 1,
        end_week: 16,
        week_type: 'all'
    };
    
    try {
        await api('/schedules', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showAlert('排课成功！');
        bootstrap.Modal.getInstance(document.getElementById('suggestionModal')).hide();
        loadSchedules();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ========== 课表查询 ==========
async function initTimetable() {
    const teachers = await api('/teachers');
    let options = '';
    teachers.forEach(t => {
        options += `<option value="${t.id}">${t.name}</option>`;
    });
    document.getElementById('timetableTarget').innerHTML = options;
}

async function onTimetableTypeChange() {
    const type = document.getElementById('timetableType').value;
    let options = '';
    
    if (type === 'teacher') {
        const teachers = await api('/teachers');
        teachers.forEach(t => {
            options += `<option value="${t.id}">${t.name}</option>`;
        });
    } else {
        const classrooms = await api('/classrooms');
        classrooms.forEach(c => {
            options += `<option value="${c.id}">${c.classroom_code} - ${c.name}</option>`;
        });
    }
    
    document.getElementById('timetableTarget').innerHTML = options;
}

async function loadTimetable() {
    const type = document.getElementById('timetableType').value;
    const targetId = document.getElementById('timetableTarget').value;
    
    let schedules;
    if (type === 'teacher') {
        schedules = await api('/teachers/' + targetId + '/timetable');
    } else {
        schedules = await api('/schedules?classroom_id=' + targetId);
    }
    
    // 构建课表
    const timetable = {};
    for (let d = 1; d <= 7; d++) {
        timetable[d] = {};
    }
    
    schedules.forEach(s => {
        const key = `${s.start_section}-${s.end_section}`;
        if (!timetable[s.weekday][key]) {
            timetable[s.weekday][key] = [];
        }
        timetable[s.weekday][key].push(s);
    });
    
    // 生成HTML
    let html = '<table class="timetable"><thead><tr><th>节次</th>';
    for (let d = 1; d <= 7; d++) {
        html += `<th>${getWeekdayName(d)}</th>`;
    }
    html += '</tr></thead><tbody>';
    
    // 按节次生成
    for (let section = 1; section <= 12; section += 2) {
        html += `<tr><td class="time-cell">第${section}-${section+1}节</td>`;
        for (let d = 1; d <= 7; d++) {
            const key = `${section}-${section+1}`;
            const courses = timetable[d][key] || [];
            if (courses.length > 0) {
                const c = courses[0];
                html += `<td><div class="course-cell">
                    <div class="course-name">${c.course_name}</div>
                    <div class="course-info">${type === 'teacher' ? c.classroom_name : c.teacher_name}</div>
                    <div class="course-info">第${c.start_week}-${c.end_week}周</div>
                </div></td>`;
            } else {
                html += '<td></td>';
            }
        }
        html += '</tr>';
    }
    
    html += '</tbody></table>';
    document.getElementById('timetableView').innerHTML = html;
}

// ========== 空闲教室查询 ==========
async function initAvailable() {
    let sectionOptions = '';
    for (let i = 1; i <= 12; i++) {
        sectionOptions += `<option value="${i}">第${i}节</option>`;
    }
    document.getElementById('availableStartSection').innerHTML = sectionOptions;
    document.getElementById('availableEndSection').innerHTML = sectionOptions;
    document.getElementById('availableEndSection').value = '2';
}

async function loadAvailableClassrooms() {
    const weekday = document.getElementById('availableWeekday').value;
    const startSection = document.getElementById('availableStartSection').value;
    const endSection = document.getElementById('availableEndSection').value;
    const week = document.getElementById('availableWeek').value;
    const minSeats = document.getElementById('availableMinSeats').value;
    
    try {
        const classrooms = await api(`/available-classrooms?weekday=${weekday}&start_section=${startSection}&end_section=${endSection}&week=${week}&min_seats=${minSeats}`);
        
        let html = '';
        classrooms.forEach(c => {
            html += `<tr>
                <td>${c.classroom_code}</td>
                <td>${c.name}</td>
                <td>${c.building || '-'}</td>
                <td>${getCategoryName(c.category)}</td>
                <td>${c.seats}</td>
                <td>${c.equipments || '-'}</td>
            </tr>`;
        });
        
        document.getElementById('availableTable').innerHTML = html || '<tr><td colspan="6" class="text-center text-muted">暂无空闲教室</td></tr>';
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ========== 统计分析 ==========
let statisticsCharts = {};

async function loadStatistics() {
    showLoading('加载统计数据...');
    try {
        const [utilization, schedules, courses, classrooms] = await Promise.all([
            api('/statistics/utilization'),
            api('/schedules'),
            api('/courses'),
            api('/classrooms')
        ]);
        
        // 教室利用率表格
        let html = '';
        utilization.forEach(u => {
            const rate = parseFloat(u.utilization_rate) || 0;
            const barColor = rate > 70 ? '#28a745' : rate > 40 ? '#fd7e14' : '#dc3545';
            // 百分比文字放在进度条外面，避免窄进度条看不清
            html += `<tr>
                <td>${u.classroom_code}</td>
                <td>${u.classroom_name}</td>
                <td>${getCategoryName(u.category)}</td>
                <td>${u.used_slots || 0}</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="progress flex-grow-1" style="height: 18px; min-width: 80px;">
                            <div class="progress-bar" style="width: ${Math.max(rate, 3)}%; background-color: ${barColor};"></div>
                        </div>
                        <span class="fw-bold" style="min-width: 45px; color: ${barColor}; font-size: 14px;">${rate.toFixed(1)}%</span>
                    </div>
                </td>
            </tr>`;
        });
        document.getElementById('utilizationTable').innerHTML = html || '<tr><td colspan="5" class="text-center text-muted">暂无数据</td></tr>';
        
        // 教室状态饼图
        renderClassroomStatusChart(classrooms);
        
        // 周课程分布图
        renderWeeklyScheduleChart(schedules);
        
        // 热门课程排行
        renderPopularCourses(schedules, courses);
        
        // 教师工作量
        renderTeacherWorkload(schedules);
        
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        hideLoading();
    }
}

function renderClassroomStatusChart(classrooms) {
    const statusCount = { available: 0, occupied: 0, maintenance: 0 };
    classrooms.forEach(c => {
        statusCount[c.status] = (statusCount[c.status] || 0) + 1;
    });
    
    const ctx = document.getElementById('classroomStatusChart');
    if (statisticsCharts.status) statisticsCharts.status.destroy();
    
    const textColor = getChartTextColor();
    statisticsCharts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['空闲', '使用中', '维护中'],
            datasets: [{
                data: [statusCount.available, statusCount.occupied, statusCount.maintenance],
                backgroundColor: ['#28a745', '#007bff', '#ffc107']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: { color: textColor }
                }
            }
        }
    });
}

function renderWeeklyScheduleChart(schedules) {
    const weekdays = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0, 0];
    
    schedules.forEach(s => {
        if (s.weekday >= 1 && s.weekday <= 7) {
            dayCounts[s.weekday]++;
        }
    });
    
    const ctx = document.getElementById('weeklyScheduleChart');
    if (statisticsCharts.weekly) statisticsCharts.weekly.destroy();
    
    const textColor = getChartTextColor();
    statisticsCharts.weekly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weekdays.slice(1),
            datasets: [{
                label: '课程数',
                data: dayCounts.slice(1),
                backgroundColor: '#4e73df'
            }]
        },
        options: {
            responsive: true,
            plugins: { 
                legend: { 
                    display: false,
                    labels: { color: textColor }
                } 
            },
            scales: { 
                y: { 
                    beginAtZero: true, 
                    ticks: { stepSize: 1, color: textColor }
                },
                x: {
                    ticks: { color: textColor }
                }
            }
        }
    });
}

function renderPopularCourses(schedules, courses) {
    // 统计每门课程的排课次数
    const courseCount = {};
    schedules.forEach(s => {
        const key = s.course_id;
        courseCount[key] = (courseCount[key] || 0) + 1;
    });
    
    // 排序并取前5
    const sorted = Object.entries(courseCount)
        .map(([id, count]) => {
            const course = courses.find(c => c.id == id);
            return { name: course?.name || '未知', count, teacher: course?.teacher_name || '' };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    
    let html = '';
    sorted.forEach((c, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
        html += `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div>
                <span class="me-2">${medal}</span>
                <strong>${c.name}</strong>
                <small class="text-muted ms-2">${c.teacher}</small>
            </div>
            <span class="badge bg-primary">${c.count}次排课</span>
        </div>`;
    });
    
    document.getElementById('popularCoursesList').innerHTML = html || '<p class="text-muted">暂无数据</p>';
}

function renderTeacherWorkload(schedules) {
    // 统计教师授课时数
    const teacherHours = {};
    schedules.forEach(s => {
        const teacher = s.teacher_name || '未知';
        const hours = (s.end_section - s.start_section + 1) * (s.end_week - s.start_week + 1);
        teacherHours[teacher] = (teacherHours[teacher] || 0) + hours;
    });
    
    // 排序取前6
    const sorted = Object.entries(teacherHours)
        .map(([name, hours]) => ({ name, hours }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 6);
    
    const maxHours = sorted[0]?.hours || 1;
    
    let html = '';
    sorted.forEach(t => {
        const percent = (t.hours / maxHours * 100).toFixed(0);
        html += `
        <div class="mb-2">
            <div class="d-flex justify-content-between mb-1">
                <span>${t.name}</span>
                <small class="text-muted">${t.hours}课时</small>
            </div>
            <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-info" style="width: ${percent}%;"></div>
            </div>
        </div>`;
    });
    
    document.getElementById('teacherWorkloadList').innerHTML = html || '<p class="text-muted">暂无数据</p>';
}

// ========== 设备管理 ==========
function getEquipmentTypeName(type) {
    const map = {
        'blackboard': '黑板',
        'desk': '桌椅',
        'multimedia': '多媒体',
        'ac': '空调',
        'projector': '投影仪',
        'computer': '电脑',
        'other': '其他'
    };
    return map[type] || type;
}

function getEquipmentStatusBadge(status) {
    const map = {
        'normal': '<span class="badge bg-success">正常</span>',
        'fault': '<span class="badge bg-danger">故障</span>',
        'maintenance': '<span class="badge bg-warning">维修中</span>'
    };
    return map[status] || status;
}

async function loadEquipments() {
    showLoading('加载设备数据...');
    try {
        // 加载教室下拉框
        const classrooms = await api('/classrooms');
        let classroomOptions = '<option value="">全部教室</option>';
        classrooms.forEach(c => {
            classroomOptions += `<option value="${c.id}">${c.classroom_code} - ${c.name}</option>`;
        });
        document.getElementById('filterEquipClassroom').innerHTML = classroomOptions;
        
        // 构建查询参数
        const classroomId = document.getElementById('filterEquipClassroom').value;
        const equipType = document.getElementById('filterEquipType').value;
        const equipStatus = document.getElementById('filterEquipStatus').value;
        
        let url = '/equipments?';
        if (classroomId) url += `classroom_id=${classroomId}&`;
        if (equipType) url += `equipment_type=${equipType}&`;
        if (equipStatus) url += `status=${equipStatus}&`;
        
        const equipments = await api(url);
        
        // 更新分页状态
        paginationState.equipments.total = equipments.length;
        const paginatedData = paginateData(equipments, 'equipments');
        
        let html = '';
        if (paginatedData.length === 0) {
            html = '<tr><td colspan="8" class="text-center py-5"><div class="empty-state"><i class="bi bi-display"></i><p>暂无设备数据</p></div></td></tr>';
        } else {
            paginatedData.forEach((e, index) => {
                html += `<tr class="table-row-animate" style="animation-delay: ${index * 0.05}s">
                    <td><span class="fw-medium">${e.equipment_code}</span></td>
                    <td>${e.name}</td>
                    <td>${getEquipmentTypeName(e.equipment_type)}</td>
                    <td>${e.classroom_name || '<span class="text-muted">-</span>'}</td>
                    <td>${e.brand || '-'} ${e.model || ''}</td>
                    <td><span class="badge bg-secondary">${e.quantity || 1}</span></td>
                    <td>${getEquipmentStatusBadge(e.status)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-action-edit" data-tooltip="编辑" onclick="editEquipment(${e.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn-action btn-action-delete" data-tooltip="删除" onclick="deleteEquipment(${e.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            });
        }
        
        document.getElementById('equipmentTable').innerHTML = html;
        renderPagination('equipmentPagination', 'equipments', equipments.length, loadEquipments);
    } catch (error) {
        document.getElementById('equipmentTable').innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4"><i class="bi bi-exclamation-triangle me-2"></i>${error.message}</td></tr>`;
        showAlert(error.message, 'danger');
    } finally {
        hideLoading();
    }
}

async function showAddEquipmentModal() {
    // 加载教室下拉框
    const classrooms = await api('/classrooms');
    let options = '<option value="">请选择</option>';
    classrooms.forEach(c => {
        options += `<option value="${c.id}">${c.classroom_code} - ${c.name}</option>`;
    });
    document.getElementById('equipmentClassroom').innerHTML = options;
    
    document.getElementById('equipmentModalTitle').textContent = '新增设备';
    document.getElementById('equipmentForm').reset();
    document.getElementById('equipmentId').value = '';
    document.getElementById('equipmentCode').disabled = false;
    new bootstrap.Modal(document.getElementById('equipmentModal')).show();
}

async function editEquipment(id) {
    try {
        const equipment = await api('/equipments/' + id);
        
        // 加载教室下拉框
        const classrooms = await api('/classrooms');
        let options = '<option value="">请选择</option>';
        classrooms.forEach(c => {
            options += `<option value="${c.id}">${c.classroom_code} - ${c.name}</option>`;
        });
        document.getElementById('equipmentClassroom').innerHTML = options;
        
        document.getElementById('equipmentModalTitle').textContent = '编辑设备';
        document.getElementById('equipmentId').value = id;
        document.getElementById('equipmentCode').value = equipment.equipment_code;
        document.getElementById('equipmentCode').disabled = true;
        document.getElementById('equipmentName').value = equipment.name;
        document.getElementById('equipmentType').value = equipment.equipment_type;
        document.getElementById('equipmentClassroom').value = equipment.classroom_id || '';
        document.getElementById('equipmentBrand').value = equipment.brand || '';
        document.getElementById('equipmentModel').value = equipment.model || '';
        document.getElementById('equipmentQuantity').value = equipment.quantity || 1;
        document.getElementById('equipmentStatus').value = equipment.status;
        document.getElementById('equipmentPurchaseDate').value = equipment.purchase_date || '';
        document.getElementById('equipmentRemark').value = equipment.remark || '';
        
        new bootstrap.Modal(document.getElementById('equipmentModal')).show();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function saveEquipment() {
    const id = document.getElementById('equipmentId').value;
    const data = {
        equipment_code: document.getElementById('equipmentCode').value,
        name: document.getElementById('equipmentName').value,
        equipment_type: document.getElementById('equipmentType').value,
        classroom_id: document.getElementById('equipmentClassroom').value || null,
        brand: document.getElementById('equipmentBrand').value,
        model: document.getElementById('equipmentModel').value,
        quantity: document.getElementById('equipmentQuantity').value,
        status: document.getElementById('equipmentStatus').value,
        purchase_date: document.getElementById('equipmentPurchaseDate').value || null,
        remark: document.getElementById('equipmentRemark').value
    };
    
    try {
        if (id) {
            await api('/equipments/' + id, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            showAlert('更新成功');
        } else {
            await api('/equipments', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showAlert('创建成功');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('equipmentModal')).hide();
        loadEquipments();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function deleteEquipment(id) {
    const confirmed = await confirmAction('确定要删除这个设备吗？', '删除设备');
    if (!confirmed) return;
    
    try {
        await apiWithLoading('/equipments/' + id, { method: 'DELETE' }, '删除中...');
        showAlert('删除成功');
        loadEquipments();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ========== 班级管理 ==========
async function loadClasses() {
    showLoading('加载班级数据...');
    try {
        const nameFilter = document.getElementById('filterClassName')?.value || '';
        const gradeFilter = document.getElementById('filterGrade')?.value || '';
        const deptFilter = document.getElementById('filterDepartment')?.value || '';
        
        let url = '/classes?';
        if (nameFilter) url += `name=${nameFilter}&`;
        if (gradeFilter) url += `grade=${gradeFilter}&`;
        if (deptFilter) url += `department=${deptFilter}&`;
        
        const classes = await api(url);
        
        // 更新分页状态
        paginationState.classes.total = classes.length;
        const paginatedData = paginateData(classes, 'classes');
        
        let html = '';
        if (paginatedData.length === 0) {
            html = '<tr><td colspan="7" class="text-center py-5"><div class="empty-state"><i class="bi bi-people"></i><p>暂无班级数据</p></div></td></tr>';
        } else {
            paginatedData.forEach((c, index) => {
                html += `<tr class="table-row-animate" style="animation-delay: ${index * 0.05}s">
                    <td><span class="fw-medium">${c.class_code}</span></td>
                    <td>${c.class_name}</td>
                    <td><span class="badge bg-info">${c.grade || '-'}级</span></td>
                    <td>${c.major || '<span class="text-muted">-</span>'}</td>
                    <td>${c.department || '<span class="text-muted">-</span>'}</td>
                    <td><span class="badge bg-secondary">${c.student_count || 0}人</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-action-edit" data-tooltip="编辑" onclick="editClass(${c.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn-action btn-action-delete" data-tooltip="删除" onclick="deleteClass(${c.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            });
        }
        
        document.getElementById('classTable').innerHTML = html;
        renderPagination('classPagination', 'classes', classes.length, loadClasses);
    } catch (error) {
        document.getElementById('classTable').innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4"><i class="bi bi-exclamation-triangle me-2"></i>${error.message}</td></tr>`;
        showAlert(error.message, 'danger');
    } finally {
        hideLoading();
    }
}

function showAddClassModal() {
    document.getElementById('classModalTitle').textContent = '新增班级';
    document.getElementById('classForm').reset();
    document.getElementById('classId').value = '';
    document.getElementById('classCode').disabled = false;
    new bootstrap.Modal(document.getElementById('classModal')).show();
}

async function editClass(id) {
    try {
        const classInfo = await api('/classes/' + id);
        
        document.getElementById('classModalTitle').textContent = '编辑班级';
        document.getElementById('classId').value = id;
        document.getElementById('classCode').value = classInfo.class_code;
        document.getElementById('classCode').disabled = true;
        document.getElementById('className').value = classInfo.class_name;
        document.getElementById('classGrade').value = classInfo.grade || '';
        document.getElementById('classMajor').value = classInfo.major || '';
        document.getElementById('classDepartment').value = classInfo.department || '';
        document.getElementById('classStudentCount').value = classInfo.student_count || 30;
        document.getElementById('classRemark').value = classInfo.remark || '';
        
        new bootstrap.Modal(document.getElementById('classModal')).show();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function saveClass() {
    const id = document.getElementById('classId').value;
    const data = {
        class_code: document.getElementById('classCode').value,
        class_name: document.getElementById('className').value,
        grade: document.getElementById('classGrade').value,
        major: document.getElementById('classMajor').value,
        department: document.getElementById('classDepartment').value,
        student_count: document.getElementById('classStudentCount').value,
        remark: document.getElementById('classRemark').value
    };
    
    try {
        if (id) {
            await api('/classes/' + id, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            showAlert('更新成功');
        } else {
            await api('/classes', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showAlert('创建成功');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('classModal')).hide();
        loadClasses();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function deleteClass(id) {
    const confirmed = await confirmAction('确定要删除这个班级吗？', '删除班级');
    if (!confirmed) return;
    
    try {
        await apiWithLoading('/classes/' + id, { method: 'DELETE' }, '删除中...');
        showAlert('删除成功');
        loadClasses();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ========== 打印功能 ==========
function printTimetable() {
    const content = document.getElementById('timetableView').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>课表打印</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #333; padding: 8px; text-align: center; }
                th { background: #f0f0f0; }
                .course-cell { background: #e3f2fd; padding: 5px; border-radius: 4px; }
                .course-name { font-weight: bold; }
                .course-info { font-size: 12px; color: #666; }
                @media print {
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <h2 style="text-align: center;">课程表</h2>
            ${content}
            <script>window.print(); window.close();</script>
        </body>
        </html>
    `);
}

function printClassrooms() {
    const content = document.getElementById('classroomTable').closest('table').outerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>教室列表打印</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                th { background: #f0f0f0; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <h2 style="text-align: center;">教室列表</h2>
            ${content}
            <script>window.print(); window.close();</script>
        </body>
        </html>
    `);
}

function printStatistics() {
    const content = document.getElementById('utilizationTable').closest('table').outerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>教室利用率统计打印</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                th { background: #f0f0f0; }
                .progress { background: #e9ecef; height: 20px; }
                .progress-bar { background: #28a745; height: 100%; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <h2 style="text-align: center;">教室利用率统计报表</h2>
            <p>生成日期: ${new Date().toLocaleDateString()}</p>
            ${content}
            <script>window.print(); window.close();</script>
        </body>
        </html>
    `);
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    // 初始化主题
    initTheme();
    
    // 快捷搜索快键绑定 (Ctrl+K)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openQuickSearch();
        }
    });
    
    // 点击overlay关闭搜索
    const overlay = document.getElementById('quickSearchOverlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeQuickSearch();
            }
        });
    }
    
    // 检查是否已登录
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        
        const userName = currentUser.real_name || currentUser.username;
        document.getElementById('currentUser').textContent = userName;
        const sidebarUserName = document.getElementById('sidebarUserName');
        if (sidebarUserName) sidebarUserName.textContent = userName;
        
        let roleText = '用户';
        if (currentUser.role === 'admin') roleText = '管理员';
        else if (currentUser.role === 'teacher') roleText = '教师';
        else if (currentUser.role === 'student') roleText = '学生';
        document.getElementById('userRole').textContent = roleText;
        
        const avatar = userName[0].toUpperCase();
        document.getElementById('userAvatar').textContent = avatar;
        
        // 更新下拉菜单中的用户信息
        const dropdownAvatar = document.getElementById('dropdownAvatar');
        const dropdownUserName = document.getElementById('dropdownUserName');
        const dropdownUserRole = document.getElementById('dropdownUserRole');
        if (dropdownAvatar) dropdownAvatar.textContent = avatar;
        if (dropdownUserName) dropdownUserName.textContent = userName;
        if (dropdownUserRole) dropdownUserRole.textContent = roleText;
        
        // 设置角色class
        document.body.classList.add('role-' + currentUser.role);
        
        // 根据角色更新UI
        updateUIByRole();
        
        initDashboard();
    }
});

// ========== 教室预约 ==========
async function loadBookings() {
    showLoading('加载预约数据...');
    try {
        const status = document.getElementById('filterBookingStatus').value;
        let url = '/bookings?';
        if (status) url += `status=${status}&`;
        
        const bookings = await api(url);
        
        // 更新分页状态
        paginationState.bookings.total = bookings.length;
        const paginatedData = paginateData(bookings, 'bookings');
        
        let html = '';
        if (paginatedData.length === 0) {
            html = '<tr><td colspan="7" class="text-center py-5"><div class="empty-state"><i class="bi bi-calendar-check"></i><p>暂无预约数据</p></div></td></tr>';
        } else {
            paginatedData.forEach((b, index) => {
                const statusBadge = getBookingStatusBadge(b.status);
                html += `<tr class="table-row-animate" style="animation-delay: ${index * 0.05}s">
                    <td><span class="fw-medium">${b.classroom_name}</span></td>
                    <td>${b.applicant_name}</td>
                    <td><i class="bi bi-calendar3 me-1"></i>${b.booking_date}</td>
                    <td><i class="bi bi-clock me-1"></i>第${b.start_section}-${b.end_section}节</td>
                    <td>${b.purpose || '<span class="text-muted">-</span>'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="action-buttons">
                            ${b.status === 'pending' && currentUser.role === 'admin' ? `
                                <button class="btn-action btn-action-approve" data-tooltip="通过" onclick="approveBooking(${b.id}, true)">
                                    <i class="bi bi-check-lg"></i>
                                </button>
                                <button class="btn-action btn-action-reject" data-tooltip="拒绝" onclick="approveBooking(${b.id}, false)">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            ` : '<span class="text-muted">-</span>'}
                        </div>
                    </td>
                </tr>`;
            });
        }
        
        document.getElementById('bookingTable').innerHTML = html;
        renderPagination('bookingPagination', 'bookings', bookings.length, loadBookings);
    } catch (error) {
        document.getElementById('bookingTable').innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4"><i class="bi bi-exclamation-triangle me-2"></i>${error.message}</td></tr>`;
        showAlert(error.message, 'danger');
    } finally {
        hideLoading();
    }
}

function getBookingStatusBadge(status) {
    const map = {
        'pending': '<span class="badge bg-warning">待审批</span>',
        'approved': '<span class="badge bg-success">已通过</span>',
        'rejected': '<span class="badge bg-danger">已拒绝</span>',
        'cancelled': '<span class="badge bg-secondary">已取消</span>'
    };
    return map[status] || status;
}

async function showAddBookingModal() {
    // 加载教室列表
    const classrooms = await api('/classrooms?status=available');
    let options = '<option value="">请选择教室</option>';
    classrooms.forEach(c => {
        options += `<option value="${c.id}">${c.classroom_code} - ${c.name} (${c.seats}座)</option>`;
    });
    document.getElementById('bookingClassroom').innerHTML = options;
    
    // 设置默认日期为明天
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('bookingDate').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('bookingDate').min = tomorrow.toISOString().split('T')[0];
    
    document.getElementById('bookingForm').reset();
    new bootstrap.Modal(document.getElementById('bookingModal')).show();
}

async function saveBooking() {
    const data = {
        classroom_id: document.getElementById('bookingClassroom').value,
        applicant_id: String(currentUser.id),
        booking_date: document.getElementById('bookingDate').value,
        start_section: document.getElementById('bookingStartSection').value,
        end_section: document.getElementById('bookingEndSection').value,
        purpose: document.getElementById('bookingPurpose').value
    };
    
    if (!data.classroom_id || !data.booking_date) {
        showAlert('请选择教室和日期', 'warning');
        return;
    }
    
    try {
        await apiWithLoading('/bookings', {
            method: 'POST',
            body: JSON.stringify(data)
        }, '提交中...');
        showAlert('预约提交成功，等待审批');
        bootstrap.Modal.getInstance(document.getElementById('bookingModal')).hide();
        loadBookings();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function approveBooking(id, approved) {
    const action = approved ? '通过' : '拒绝';
    const confirmed = await confirmAction(`确定要${action}这个预约吗？`, '审批确认');
    if (!confirmed) return;
    
    try {
        await apiWithLoading(`/bookings/${id}/approve`, {
            method: 'PUT',
            body: JSON.stringify({
                approved: String(approved),
                approver_id: String(currentUser.id)
            })
        }, '处理中...');
        showAlert(`已${action}`);
        loadBookings();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ========== 通知公告 ==========
async function loadNotices() {
    showLoading('加载通知...');
    try {
        const notices = await api('/notices');
        
        let html = '';
        if (notices.length === 0) {
            html = '<p class="text-muted text-center">暂无通知</p>';
        } else {
            notices.forEach(n => {
                const typeIcon = {
                    'system': 'bi-gear',
                    'academic': 'bi-mortarboard',
                    'activity': 'bi-calendar-event'
                }[n.notice_type] || 'bi-info-circle';
                
                const typeBadge = {
                    'system': '<span class="badge bg-info">系统</span>',
                    'academic': '<span class="badge bg-primary">教务</span>',
                    'activity': '<span class="badge bg-success">活动</span>'
                }[n.notice_type] || '';
                
                html += `
                <div class="card mb-3 ${n.is_top == '1' ? 'border-warning' : ''}" style="cursor:pointer;" onclick="viewNotice(${n.id})">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                ${n.is_top == '1' ? '<span class="badge bg-warning text-dark me-2"><i class="bi bi-pin-angle"></i> 置顶</span>' : ''}
                                ${typeBadge}
                                <h5 class="card-title d-inline ms-2">${n.title}</h5>
                            </div>
                            ${currentUser.role === 'admin' ? `
                                <div>
                                    <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation();editNotice(${n.id})">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation();deleteNotice(${n.id})">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                        <p class="card-text text-muted mt-2">${n.content.substring(0, 100)}${n.content.length > 100 ? '...' : ''}</p>
                        <small class="text-muted">
                            <i class="bi bi-person"></i> ${n.author_name || '系统'} · 
                            <i class="bi bi-clock"></i> ${n.publish_time} · 
                            <i class="bi bi-eye"></i> ${n.view_count || 0}
                        </small>
                    </div>
                </div>`;
            });
        }
        
        document.getElementById('noticeList').innerHTML = html;
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        hideLoading();
    }
}

async function viewNotice(id) {
    try {
        const notice = await api('/notices/' + id);
        
        document.getElementById('noticeDetailTitle').textContent = notice.title;
        document.getElementById('noticeDetailAuthor').textContent = notice.author_name || '系统';
        document.getElementById('noticeDetailTime').textContent = notice.publish_time;
        document.getElementById('noticeDetailViews').textContent = notice.view_count;
        document.getElementById('noticeDetailContent').textContent = notice.content;
        
        new bootstrap.Modal(document.getElementById('noticeDetailModal')).show();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function showAddNoticeModal() {
    document.getElementById('noticeModalTitle').textContent = '发布通知';
    document.getElementById('noticeForm').reset();
    document.getElementById('noticeId').value = '';
    new bootstrap.Modal(document.getElementById('noticeModal')).show();
}

async function editNotice(id) {
    try {
        const notice = await api('/notices/' + id);
        
        document.getElementById('noticeModalTitle').textContent = '编辑通知';
        document.getElementById('noticeId').value = id;
        document.getElementById('noticeTitle').value = notice.title;
        document.getElementById('noticeContent').value = notice.content;
        document.getElementById('noticeType').value = notice.notice_type;
        document.getElementById('noticeIsTop').checked = notice.is_top == '1';
        
        new bootstrap.Modal(document.getElementById('noticeModal')).show();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function saveNotice() {
    const id = document.getElementById('noticeId').value;
    const data = {
        title: document.getElementById('noticeTitle').value,
        content: document.getElementById('noticeContent').value,
        notice_type: document.getElementById('noticeType').value,
        is_top: String(document.getElementById('noticeIsTop').checked),
        author_id: String(currentUser.id)
    };
    
    if (!data.title || !data.content) {
        showAlert('请填写标题和内容', 'warning');
        return;
    }
    
    try {
        if (id) {
            await apiWithLoading('/notices/' + id, {
                method: 'PUT',
                body: JSON.stringify(data)
            }, '保存中...');
            showAlert('更新成功');
        } else {
            await apiWithLoading('/notices', {
                method: 'POST',
                body: JSON.stringify(data)
            }, '发布中...');
            showAlert('发布成功');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('noticeModal')).hide();
        loadNotices();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function deleteNotice(id) {
    const confirmed = await confirmAction('确定要删除这条通知吗？', '删除通知');
    if (!confirmed) return;
    
    try {
        await apiWithLoading('/notices/' + id, { method: 'DELETE' }, '删除中...');
        showAlert('删除成功');
        loadNotices();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ========== 学生选课 ==========
let allAvailableCourses = [];

async function loadEnrollment() {
    showLoading('加载选课数据...');
    try {
        // 获取可选课程和已选课程
        const [courses, enrollments] = await Promise.all([
            api('/courses'),
            api('/enrollments?student_id=' + currentUser.id)
        ]);
        
        allAvailableCourses = courses;
        const enrolledIds = new Set(enrollments.map(e => e.course_id));
        
        // 渲染可选课程
        renderAvailableCourses(courses.filter(c => !enrolledIds.has(c.id)));
        
        // 渲染已选课程
        renderEnrolledCourses(enrollments);
        
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        hideLoading();
    }
}

function renderAvailableCourses(courses) {
    const searchTerm = (document.getElementById('searchCourse')?.value || '').toLowerCase();
    const courseType = document.getElementById('filterCourseType')?.value || '';
    
    let filtered = courses.filter(c => {
        const matchSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm) || 
                           (c.course_code && c.course_code.toLowerCase().includes(searchTerm));
        const matchType = !courseType || c.course_type === courseType;
        return matchSearch && matchType;
    });
    
    let html = '';
    if (filtered.length === 0) {
        html = '<p class="text-muted text-center py-4">暂无可选课程</p>';
    } else {
        filtered.forEach(c => {
            const typeBadge = {
                'required': '<span class="badge bg-danger">必修</span>',
                'elective': '<span class="badge bg-primary">选修</span>',
                'public': '<span class="badge bg-info">公选</span>'
            }[c.course_type] || '';
            
            html += `
            <div class="card mb-2">
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${c.name} ${typeBadge}</h6>
                            <small class="text-muted">
                                ${c.course_code || ''} · ${c.teacher_name || '未指定'} · ${c.credit || 0}学分 · ${c.hours || 0}学时
                            </small>
                        </div>
                        <button class="btn btn-sm btn-success" onclick="enrollCourse(${c.id})">
                            <i class="bi bi-plus"></i> 选课
                        </button>
                    </div>
                </div>
            </div>`;
        });
    }
    
    document.getElementById('availableCoursesList').innerHTML = html;
}

function renderEnrolledCourses(enrollments) {
    let html = '';
    let totalCredits = 0;
    
    if (enrollments.length === 0) {
        html = '<p class="text-muted text-center py-4">暂未选课</p>';
    } else {
        enrollments.forEach(e => {
            totalCredits += parseFloat(e.credit || 0);
            html += `
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                    <strong>${e.course_name}</strong>
                    <br><small class="text-muted">${e.teacher_name || ''} · ${e.credit || 0}学分</small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="dropCourse(${e.id}, ${e.course_id})">
                    <i class="bi bi-x"></i>
                </button>
            </div>`;
        });
    }
    
    document.getElementById('enrolledCoursesList').innerHTML = html;
    document.getElementById('totalCredits').textContent = totalCredits.toFixed(1);
}

function filterAvailableCourses() {
    // 获取当前已选课程ID
    const enrolledCards = document.querySelectorAll('#enrolledCoursesList .d-flex');
    const enrolledIds = new Set();
    enrolledCards.forEach(card => {
        const btn = card.querySelector('button[onclick*="dropCourse"]');
        if (btn) {
            const match = btn.getAttribute('onclick').match(/dropCourse\(\d+,\s*(\d+)\)/);
            if (match) enrolledIds.add(parseInt(match[1]));
        }
    });
    
    renderAvailableCourses(allAvailableCourses.filter(c => !enrolledIds.has(c.id)));
}

async function enrollCourse(courseId) {
    try {
        await apiWithLoading('/enrollments', {
            method: 'POST',
            body: JSON.stringify({
                student_id: String(currentUser.id),
                course_id: String(courseId)
            })
        }, '选课中...');
        
        showAlert('选课成功');
        loadEnrollment();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function dropCourse(enrollmentId, courseId) {
    const confirmed = await confirmAction('确定要退选这门课程吗？', '退课确认');
    if (!confirmed) return;
    
    try {
        await apiWithLoading('/enrollments/' + enrollmentId, {
            method: 'DELETE'
        }, '退课中...');
        
        showAlert('退课成功');
        loadEnrollment();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ========== 数据导出 ==========
function exportToCSV(data, filename, headers) {
    if (!data || data.length === 0) {
        showAlert('没有数据可导出', 'warning');
        return;
    }
    
    const keys = headers ? Object.keys(headers) : Object.keys(data[0]);
    const headerRow = headers ? Object.values(headers) : keys;
    
    let csv = '\uFEFF' + headerRow.join(',') + '\n'; // BOM for Excel UTF-8
    
    data.forEach(row => {
        const values = keys.map(key => {
            let val = row[key] ?? '';
            val = String(val).replace(/"/g, '""');
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                val = '"' + val + '"';
            }
            return val;
        });
        csv += values.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    
    showAlert('导出成功');
}

async function exportClassrooms() {
    const classrooms = await apiWithLoading('/classrooms', {}, '获取数据...');
    exportToCSV(classrooms, '教室列表', {
        classroom_code: '教室编号',
        name: '教室名称',
        building: '教学楼',
        floor: '楼层',
        category: '类型',
        seats: '座位数',
        status: '状态'
    });
}

async function exportCourses() {
    const courses = await apiWithLoading('/courses', {}, '获取数据...');
    exportToCSV(courses, '课程列表', {
        course_code: '课程编号',
        name: '课程名称',
        teacher_name: '任课教师',
        credit: '学分',
        hours: '学时',
        course_type: '课程类型'
    });
}

async function exportSchedules() {
    const schedules = await apiWithLoading('/schedules', {}, '获取数据...');
    exportToCSV(schedules, '课表数据', {
        course_name: '课程',
        teacher_name: '教师',
        classroom_name: '教室',
        class_name: '班级',
        weekday: '星期',
        start_section: '开始节次',
        end_section: '结束节次',
        start_week: '开始周',
        end_week: '结束周'
    });
}

// ========== 用户管理 ==========
async function loadUsers() {
    showLoading('加载用户数据...');
    try {
        const search = document.getElementById('searchUser')?.value || '';
        const role = document.getElementById('filterUserRole')?.value || '';
        
        let url = '/users?';
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (role) url += `role=${role}&`;
        
        const users = await api(url);
        
        // 更新分页状态
        paginationState.users.total = users.length;
        const paginatedData = paginateData(users, 'users');
        
        let html = '';
        if (paginatedData.length === 0) {
            html = '<tr><td colspan="7" class="text-center py-5"><div class="empty-state"><i class="bi bi-person-gear"></i><p>暂无用户数据</p></div></td></tr>';
        } else {
            paginatedData.forEach((u, index) => {
                const roleBadge = {
                    'admin': '<span class="badge bg-danger">管理员</span>',
                    'teacher': '<span class="badge bg-primary">教师</span>',
                    'student': '<span class="badge bg-success">学生</span>'
                }[u.role] || u.role;
                
                const statusBadge = u.status === 'active' ? 
                    '<span class="badge bg-success">正常</span>' : 
                    '<span class="badge bg-secondary">禁用</span>';
                
                html += `<tr class="table-row-animate" style="animation-delay: ${index * 0.05}s">
                    <td><span class="fw-medium">${u.username}</span></td>
                    <td>${u.real_name || '<span class="text-muted">-</span>'}</td>
                    <td>${roleBadge}</td>
                    <td>${u.email || '<span class="text-muted">-</span>'}</td>
                    <td>${statusBadge}</td>
                    <td>${u.created_at ? u.created_at.substring(0, 10) : '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-action-edit" data-tooltip="编辑" onclick="editUser(${u.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn-action btn-action-reset" data-tooltip="重置密码" onclick="resetUserPassword(${u.id})">
                                <i class="bi bi-key"></i>
                            </button>
                            ${u.username !== 'admin' ? `
                                <button class="btn-action btn-action-delete" data-tooltip="删除" onclick="deleteUser(${u.id})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>`;
            });
        }
        
        document.getElementById('userTable').innerHTML = html;
        renderPagination('userPagination', 'users', users.length, loadUsers);
    } catch (error) {
        document.getElementById('userTable').innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4"><i class="bi bi-exclamation-triangle me-2"></i>${error.message}</td></tr>`;
        showAlert(error.message, 'danger');
    } finally {
        hideLoading();
    }
}

function showAddUserModal() {
    document.getElementById('userModalTitle').textContent = '新增用户';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userUsername').disabled = false;
    new bootstrap.Modal(document.getElementById('userModal')).show();
}

async function editUser(id) {
    try {
        const users = await api('/users');
        const user = users.find(u => u.id == id);
        if (!user) {
            showAlert('用户不存在', 'warning');
            return;
        }
        
        document.getElementById('userModalTitle').textContent = '编辑用户';
        document.getElementById('userId').value = id;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userUsername').disabled = true;
        document.getElementById('userRealName').value = user.real_name || '';
        document.getElementById('userRole').value = user.role;
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userPhone').value = user.phone || '';
        document.getElementById('userPassword').value = '';
        
        new bootstrap.Modal(document.getElementById('userModal')).show();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function saveUser() {
    const id = document.getElementById('userId').value;
    const data = {
        username: document.getElementById('userUsername').value,
        real_name: document.getElementById('userRealName').value,
        role: document.getElementById('userRole').value,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value,
        password: document.getElementById('userPassword').value
    };
    
    if (!data.username || !data.real_name) {
        showAlert('请填写用户名和姓名', 'warning');
        return;
    }
    
    try {
        if (id) {
            await apiWithLoading('/users/' + id, {
                method: 'PUT',
                body: JSON.stringify(data)
            }, '保存中...');
            showAlert('更新成功');
        } else {
            await apiWithLoading('/users', {
                method: 'POST',
                body: JSON.stringify(data)
            }, '创建中...');
            showAlert('创建成功');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
        loadUsers();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function deleteUser(id) {
    const confirmed = await confirmAction('确定要删除这个用户吗？', '删除用户');
    if (!confirmed) return;
    
    try {
        await apiWithLoading('/users/' + id, { method: 'DELETE' }, '删除中...');
        showAlert('删除成功');
        loadUsers();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function resetUserPassword(id) {
    const confirmed = await confirmAction('确定要重置该用户的密码为123456吗？', '重置密码');
    if (!confirmed) return;
    
    try {
        await apiWithLoading('/users/' + id + '/reset-password', { method: 'PUT' }, '重置中...');
        showAlert('密码已重置为123456');
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function showImportUsersModal() {
    document.getElementById('importUsersData').value = '';
    new bootstrap.Modal(document.getElementById('importUsersModal')).show();
}

async function importUsers() {
    const usersData = document.getElementById('importUsersData').value.trim();
    
    if (!usersData) {
        showAlert('请输入用户数据', 'warning');
        return;
    }
    
    try {
        const result = await apiWithLoading('/users/batch', {
            method: 'POST',
            body: JSON.stringify({ users: usersData })
        }, '导入中...');
        
        showAlert(`导入完成: 成功 ${result.success} 个, 失败 ${result.failed} 个`);
        bootstrap.Modal.getInstance(document.getElementById('importUsersModal')).hide();
        loadUsers();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ========== 主题切换功能 ==========
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    updateThemeIcon(savedTheme);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    updateThemeIcon(newTheme);
    
    // 重新渲染图表以更新颜色
    refreshChartsForTheme();
}

function refreshChartsForTheme() {
    // 重新渲染当前页面的图表
    const currentPage = document.querySelector('.nav-item.active')?.dataset.page;
    if (currentPage === 'dashboard') {
        // 仪表盘图表需要重新加载
        initDashboard();
    } else if (currentPage === 'statistics') {
        loadStatistics();
    }
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        if (theme === 'dark') {
            icon.className = 'bi bi-moon-fill';
        } else {
            icon.className = 'bi bi-sun-fill';
        }
    }
}

// ========== 快捷搜索功能 ==========
let quickSearchSelectedIndex = -1;
const quickSearchModules = [
    { name: 'dashboard', label: '仪表盘', icon: 'bi-speedometer2' },
    { name: 'classrooms', label: '教室管理', icon: 'bi-building' },
    { name: 'courses', label: '课程管理', icon: 'bi-book' },
    { name: 'schedules', label: '排课管理', icon: 'bi-calendar3' },
    { name: 'equipments', label: '设备管理', icon: 'bi-tv' },
    { name: 'bookings', label: '预约管理', icon: 'bi-bookmark' }
];

function openQuickSearch() {
    const overlay = document.getElementById('quickSearchOverlay');
    if (overlay) {
        overlay.classList.add('active');
        document.getElementById('quickSearchInput').focus();
        quickSearchSelectedIndex = -1;
        renderQuickSearchResults('');
    }
}

function closeQuickSearch() {
    const overlay = document.getElementById('quickSearchOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.getElementById('quickSearchInput').value = '';
    }
}

function performQuickSearch(value) {
    renderQuickSearchResults(value);
    quickSearchSelectedIndex = 0;
    const items = document.querySelectorAll('.search-item');
    if (items.length > 0) {
        items[0].classList.add('selected');
    }
}

function renderQuickSearchResults(searchValue) {
    const resultsContainer = document.getElementById('quickSearchResults');
    const query = searchValue.toLowerCase().trim();
    
    let filteredModules = quickSearchModules;
    if (query) {
        filteredModules = quickSearchModules.filter(m => 
            m.label.toLowerCase().includes(query) || 
            m.name.toLowerCase().includes(query)
        );
    }
    
    if (filteredModules.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center text-muted" style="padding: 40px 20px;">
                <i class="bi bi-search" style="font-size: 32px; margin-bottom: 12px; display: block;"></i>
                <p>未找到匹配的项目</p>
            </div>
        `;
        return;
    }
    
    const items = filteredModules.map((m, idx) => `
        <div class="search-item" data-index="${idx}" onclick="quickNavigate('${m.name}')">
            <i class="bi ${m.icon}"></i>
            <span>${m.label}</span>
        </div>
    `).join('');
    
    resultsContainer.innerHTML = `
        <div class="search-section">
            <div class="search-section-title">搜索结果</div>
            ${items}
        </div>
    `;
}

function handleSearchKeydown(e) {
    const items = document.querySelectorAll('.search-item');
    
    if (e.key === 'Escape') {
        e.preventDefault();
        closeQuickSearch();
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (quickSearchSelectedIndex < items.length - 1) {
            quickSearchSelectedIndex++;
            updateSearchSelection(items);
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (quickSearchSelectedIndex > 0) {
            quickSearchSelectedIndex--;
            updateSearchSelection(items);
        }
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (quickSearchSelectedIndex >= 0 && quickSearchSelectedIndex < items.length) {
            items[quickSearchSelectedIndex].click();
        }
    }
}

function updateSearchSelection(items) {
    items.forEach((item, idx) => {
        if (idx === quickSearchSelectedIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('selected');
        }
    });
}

function quickNavigate(moduleName) {
    closeQuickSearch();
    
    const moduleMap = {
        dashboard: () => switchPage('dashboard'),
        classrooms: () => switchPage('classrooms'),
        courses: () => switchPage('courses'),
        schedules: () => switchPage('schedules'),
        equipments: () => switchPage('equipments'),
        bookings: () => switchPage('bookings')
    };
    
    if (moduleMap[moduleName]) {
        moduleMap[moduleName]();
    }
}
