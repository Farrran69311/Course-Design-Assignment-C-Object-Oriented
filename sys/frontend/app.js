// 教室资源管理系统前端JS

const API_BASE = '/api';
let currentUser = null;
let categoryChart = null;

// ========== 工具函数 ==========
async function api(endpoint, options = {}) {
    const url = API_BASE + endpoint;
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options
    };
    
    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || '请求失败');
        }
        if (response.status === 204) return null;
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
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

// ========== 登录相关 ==========
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const result = await api('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        currentUser = result.user;
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        
        document.getElementById('currentUser').textContent = currentUser.real_name || currentUser.username;
        document.getElementById('userRole').textContent = currentUser.role === 'admin' ? '管理员' : '用户';
        document.getElementById('userAvatar').textContent = (currentUser.real_name || currentUser.username)[0].toUpperCase();
        
        initDashboard();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    document.getElementById('mainContainer').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
}

// ========== 导航相关 ==========
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        
        // 更新导航高亮
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // 切换页面
        document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
        document.getElementById('page-' + page).classList.add('active');
        
        // 更新标题
        const titles = {
            'dashboard': '仪表盘',
            'classrooms': '教室管理',
            'courses': '课程管理',
            'schedules': '排课管理',
            'timetable': '课表查询',
            'available': '空闲教室查询',
            'statistics': '统计分析'
        };
        document.getElementById('pageTitle').textContent = titles[page] || page;
        
        // 加载页面数据
        switch (page) {
            case 'dashboard': initDashboard(); break;
            case 'classrooms': loadClassrooms(); break;
            case 'courses': loadCourses(); break;
            case 'schedules': loadSchedules(); break;
            case 'timetable': initTimetable(); break;
            case 'available': initAvailable(); break;
            case 'statistics': loadStatistics(); break;
        }
    });
});

// ========== 仪表盘 ==========
async function initDashboard() {
    try {
        // 加载统计数据
        const [classrooms, courses, teachers, utilization] = await Promise.all([
            api('/classrooms'),
            api('/courses'),
            api('/teachers'),
            api('/statistics/utilization')
        ]);
        
        document.getElementById('statClassrooms').textContent = classrooms.length;
        document.getElementById('statCourses').textContent = courses.length;
        document.getElementById('statTeachers').textContent = teachers.length;
        
        // 计算平均利用率
        if (utilization.length > 0) {
            const avgUtil = utilization.reduce((sum, u) => sum + parseFloat(u.utilization_rate || 0), 0) / utilization.length;
            document.getElementById('statUtilization').textContent = avgUtil.toFixed(1) + '%';
        }
        
        // 今日课程
        const today = new Date().getDay() || 7;
        const schedules = await api('/schedules?weekday=' + today);
        
        let scheduleHtml = '';
        if (schedules.length === 0) {
            scheduleHtml = '<p class="text-muted text-center">今日暂无课程安排</p>';
        } else {
            scheduleHtml = '<table class="table"><thead><tr><th>时间</th><th>课程</th><th>教师</th><th>教室</th></tr></thead><tbody>';
            schedules.forEach(s => {
                scheduleHtml += `<tr>
                    <td>第${s.start_section}-${s.end_section}节</td>
                    <td>${s.course_name}</td>
                    <td>${s.teacher_name}</td>
                    <td>${s.classroom_name}</td>
                </tr>`;
            });
            scheduleHtml += '</tbody></table>';
        }
        document.getElementById('todaySchedule').innerHTML = scheduleHtml;
        
        // 教室类型分布图
        const categoryCount = {};
        classrooms.forEach(c => {
            const cat = getCategoryName(c.category);
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
        
        const ctx = document.getElementById('categoryChart').getContext('2d');
        if (categoryChart) categoryChart.destroy();
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
                        position: 'bottom'
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

// ========== 教室管理 ==========
async function loadClassrooms() {
    try {
        const building = document.getElementById('filterBuilding').value;
        const category = document.getElementById('filterCategory').value;
        const minSeats = document.getElementById('filterMinSeats').value;
        
        let url = '/classrooms?';
        if (building) url += `building=${building}&`;
        if (category) url += `category=${category}&`;
        if (minSeats) url += `minSeats=${minSeats}&`;
        
        const classrooms = await api(url);
        
        let html = '';
        classrooms.forEach(c => {
            html += `<tr>
                <td>${c.classroom_code}</td>
                <td>${c.name}</td>
                <td>${c.building || '-'}</td>
                <td>${getCategoryName(c.category)}</td>
                <td>${c.seats}</td>
                <td>${getStatusBadge(c.status)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="editClassroom(${c.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteClassroom(${c.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>`;
        });
        
        document.getElementById('classroomTable').innerHTML = html || '<tr><td colspan="7" class="text-center text-muted">暂无数据</td></tr>';
    } catch (error) {
        showAlert(error.message, 'danger');
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
            await api('/classrooms/' + id, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            showAlert('更新成功');
        } else {
            await api('/classrooms', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showAlert('创建成功');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('classroomModal')).hide();
        loadClassrooms();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function deleteClassroom(id) {
    if (!confirm('确定要删除这个教室吗？')) return;
    
    try {
        await api('/classrooms/' + id, { method: 'DELETE' });
        showAlert('删除成功');
        loadClassrooms();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ========== 课程管理 ==========
async function loadCourses() {
    try {
        const semester = document.getElementById('filterSemester').value;
        const courses = await api('/courses?semester=' + semester);
        
        let html = '';
        courses.forEach(c => {
            html += `<tr>
                <td>${c.course_code}</td>
                <td>${c.name}</td>
                <td>${c.teacher_name || '-'}</td>
                <td>${c.credits || '-'}</td>
                <td>${c.hours || '-'}</td>
                <td>${getCourseTypeName(c.course_type)}</td>
                <td>${c.capacity || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="editCourse(${c.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
            </tr>`;
        });
        
        document.getElementById('courseTable').innerHTML = html || '<tr><td colspan="8" class="text-center text-muted">暂无数据</td></tr>';
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ========== 排课管理 ==========
async function loadSchedules() {
    try {
        const weekday = document.getElementById('filterWeekday').value;
        let url = '/schedules?';
        if (weekday) url += `weekday=${weekday}&`;
        
        const schedules = await api(url);
        
        let html = '';
        schedules.forEach(s => {
            html += `<tr>
                <td>${s.course_name}</td>
                <td>${s.teacher_name}</td>
                <td>${s.classroom_name}</td>
                <td>${s.class_name || '-'}</td>
                <td>${getWeekdayName(s.weekday)} 第${s.start_section}-${s.end_section}节</td>
                <td>第${s.start_week}-${s.end_week}周</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteSchedule(${s.schedule_id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>`;
        });
        
        document.getElementById('scheduleTable').innerHTML = html || '<tr><td colspan="7" class="text-center text-muted">暂无数据</td></tr>';
    } catch (error) {
        showAlert(error.message, 'danger');
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
    if (!confirm('确定要删除这条排课记录吗？')) return;
    
    try {
        await api('/schedules/' + id, { method: 'DELETE' });
        showAlert('删除成功');
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
async function loadStatistics() {
    try {
        const utilization = await api('/statistics/utilization');
        
        let html = '';
        utilization.forEach(u => {
            const rate = parseFloat(u.utilization_rate) || 0;
            const barColor = rate > 70 ? '#28a745' : rate > 40 ? '#fd7e14' : '#dc3545';
            html += `<tr>
                <td>${u.classroom_code}</td>
                <td>${u.classroom_name}</td>
                <td>${getCategoryName(u.category)}</td>
                <td>${u.seats}</td>
                <td>${u.used_slots || 0}</td>
                <td>${rate.toFixed(1)}%</td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar" style="width: ${rate}%; background-color: ${barColor};">${rate.toFixed(0)}%</div>
                    </div>
                </td>
            </tr>`;
        });
        
        document.getElementById('utilizationTable').innerHTML = html || '<tr><td colspan="7" class="text-center text-muted">暂无数据</td></tr>';
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否已登录
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        document.getElementById('currentUser').textContent = currentUser.real_name || currentUser.username;
        document.getElementById('userRole').textContent = currentUser.role === 'admin' ? '管理员' : '用户';
        document.getElementById('userAvatar').textContent = (currentUser.real_name || currentUser.username)[0].toUpperCase();
        initDashboard();
    }
});
