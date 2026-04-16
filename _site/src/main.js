import { STORAGE_KEY } from './config.js';
import * as utils from './utils.js';
import * as ui from './ui-controller.js';
import * as fb from './firebase-service.js';
import { setupEventListeners } from './events.js';

// 전역 상태
let state = {
    isOnline: false,
    cars: [],
    currentGroup: null,
    userNickname: '',
    notificationEnabled: false,
    currentCarId: null,
    lastDataUpdate: 0
};

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Firebase 초기화
    fb.initFirebase({
        onConnectionChange: (status) => {
            state.isOnline = (status === 'online');
            ui.updateConnectionStatus(status);
            if (state.isOnline && state.currentGroup) {
                loadGroupData();
            }
        }
    });

    // 2. 기존 세션 확인
    checkExistingSession();

    // 3. 알림 스케줄링
    scheduleNotifications();

    // 4. 이벤트 리스너 등록
    setupEventListeners({
        onSwitchTab: ui.switchTab,
        onJoinGroup: joinGroup,
        onCreateGroup: createGroup,
        onCopyCode: copyShareCode,
        onShowAddCar: ui.showAddCarModal,
        onHideAddCar: ui.hideAddCarModal,
        onAddCar: addCar,
        onHideUpdateModal: ui.hideUpdateModal,
        onUpdateLocation: updateLocation,
        onToggleNotification: toggleNotification,
        onRefresh: forceRefresh,
        onClearCache: clearCache,
        onLogout: logout,
        onCarAction: handleCarAction
    });

    // 5. 포커스 시 데이터 새로고침
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && state.currentGroup && state.isOnline) {
            loadGroupData();
        }
    });
}

// 세션 확인
function checkExistingSession() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        const parsed = JSON.parse(data);
        if (parsed.currentGroup && parsed.userNickname) {
            state.currentGroup = parsed.currentGroup;
            state.userNickname = parsed.userNickname;
            state.notificationEnabled = parsed.notificationEnabled || false;
            
            document.getElementById('notificationToggle')?.classList.toggle('active', state.notificationEnabled);
            ui.showAppSection(state.currentGroup.code);

            if (state.isOnline) {
                loadGroupData();
            } else {
                state.cars = parsed.cars || [];
                ui.renderCarList(state.cars);
            }
            return;
        }
    }
    ui.showLoginSection();
}

// 그룹 데이터 로드
function loadGroupData() {
    if (!state.isOnline || !state.currentGroup) return;

    const now = Date.now();
    if (now - state.lastDataUpdate < 1000) return;
    state.lastDataUpdate = now;

    fb.listenToGroupCars(state.currentGroup.code, (cars) => {
        state.cars = cars;
        ui.renderCarList(state.cars);
        saveLocalData();
    });
}

// 데이터 저장
function saveLocalData() {
    const data = {
        currentGroup: state.currentGroup,
        userNickname: state.userNickname,
        notificationEnabled: state.notificationEnabled,
        cars: state.cars,
        lastSaved: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function saveOnlineData() {
    if (!state.isOnline || !state.currentGroup) {
        saveLocalData();
        return;
    }

    try {
        await fb.saveCarsToFirebase(state.currentGroup.code, state.cars);
        saveLocalData();
    } catch (error) {
        console.error('Firebase 저장 실패:', error);
        ui.showNotification('동기화 실패: ' + error.message, 'error');
        saveLocalData();
    }
}

// 액션 핸들러들
async function createGroup() {
    const password = document.getElementById('createPassword').value.trim();
    const nickname = document.getElementById('createNickname').value.trim();

    if (!password || !nickname) {
        ui.showNotification('비밀번호와 이름을 모두 입력해주세요', 'error');
        return;
    }

    const groupCode = utils.generateGroupCode();
    state.currentGroup = { code: groupCode, password: password };
    state.userNickname = nickname;

    if (state.isOnline) {
        try {
            await fb.createGroup(groupCode, password, nickname, utils.generateUserId());
            ui.showNotification('새 그룹이 생성되었습니다!');
        } catch (error) {
            ui.showNotification('그룹 생성 실패: ' + error.message, 'error');
            return;
        }
    }

    saveLocalData();
    ui.showAppSection(groupCode);
}

async function joinGroup() {
    const code = document.getElementById('joinCode').value.trim().toUpperCase();
    const password = document.getElementById('joinPassword').value.trim();
    const nickname = document.getElementById('joinNickname').value.trim();

    if (!code || !password || !nickname) {
        ui.showNotification('모든 필드를 입력해주세요', 'error');
        return;
    }

    if (state.isOnline) {
        try {
            await fb.joinGroup(code, password, nickname, utils.generateUserId());
            ui.showNotification(`${code} 그룹에 참여했습니다!`);
        } catch (error) {
            ui.showNotification('그룹 참여 실패: ' + error.message, 'error');
            return;
        }
    } else {
        ui.showNotification('오프라인 모드로 그룹 접속', 'error');
    }

    state.currentGroup = { code: code, password: password };
    state.userNickname = nickname;
    saveLocalData();
    ui.showAppSection(code);

    if (state.isOnline) {
        loadGroupData();
    }
}

async function copyShareCode() {
    const code = state.currentGroup?.code;
    if (!code) return;
    try {
        await navigator.clipboard.writeText(code);
        ui.showNotification('공유 코드가 클립보드에 복사되었습니다.');
    } catch (err) {
        ui.showNotification('복사에 실패했습니다.', 'error');
    }
}

function addCar() {
    const carName = document.getElementById('carName').value.trim();
    if (!carName) {
        ui.showNotification('차량 이름을 입력해주세요', 'error');
        return;
    }

    const newCar = {
        id: Date.now().toString(),
        name: carName,
        location: null,
        lastUpdated: null,
        updatedBy: null
    };

    state.cars.push(newCar);
    saveOnlineData();
    ui.hideAddCarModal();
    ui.showNotification('차량이 추가되었습니다!');
}

function handleCarAction(action, carId) {
    if (action === 'update') {
        state.currentCarId = carId;
        const car = state.cars.find(c => c.id === carId);
        if (car) ui.showUpdateModal(car.name, car.location);
    } else if (action === 'delete') {
        if (confirm('정말 이 차량을 삭제하시겠어요?')) {
            state.cars = state.cars.filter(c => c.id !== carId);
            saveOnlineData();
            ui.showNotification('차량이 삭제되었습니다');
        }
    }
}

function updateLocation() {
    if (!state.currentCarId) return;

    const floor = document.getElementById('floor').value;
    const section = document.getElementById('section').value.trim();

    if (!floor || !section) {
        ui.showNotification('층과 구역을 모두 입력해주세요', 'error');
        return;
    }

    const car = state.cars.find(c => c.id === state.currentCarId);
    if (car) {
        car.location = `${floor} - ${section}`;
        car.lastUpdated = new Date().toISOString();
        car.updatedBy = state.userNickname;

        saveOnlineData();
        ui.hideUpdateModal();
        ui.showNotification('주차 위치가 업데이트되었습니다!');
    }
}

function toggleNotification() {
    state.notificationEnabled = !state.notificationEnabled;
    document.getElementById('notificationToggle')?.classList.toggle('active', state.notificationEnabled);

    if (state.notificationEnabled) {
        if ('Notification' in window) {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    ui.showNotification('스마트 알림이 활성화되었습니다! 📱');
                    scheduleNotifications();
                } else {
                    state.notificationEnabled = false;
                    document.getElementById('notificationToggle')?.classList.remove('active');
                    ui.showNotification('알림 권한이 필요합니다', 'error');
                }
                saveLocalData();
            });
        } else {
            ui.showNotification('이 브라우저는 알림을 지원하지 않습니다', 'error');
            state.notificationEnabled = false;
            document.getElementById('notificationToggle')?.classList.remove('active');
        }
    } else {
        ui.showNotification('알림이 비활성화되었습니다');
    }
    saveLocalData();
}

function scheduleNotifications() {
    if (!state.notificationEnabled) return;

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(21, 0, 0, 0);

    if (now > scheduledTime) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime - now;

    setTimeout(() => {
        if (state.notificationEnabled && Notification.permission === 'granted') {
            new Notification('🚗 주차 위치 업데이트 알림', {
                body: '오늘 주차한 위치를 업데이트해주세요!',
                vibrate: [200, 100, 200],
                tag: 'parking-reminder'
            });
        }
        setTimeout(scheduleNotifications, 24 * 60 * 60 * 1000);
    }, timeUntilNotification);
}

function forceRefresh() {
    ui.showNotification('새로고침 중...');
    setTimeout(() => {
        window.location.reload(true);
    }, 500);
}

async function clearCache() {
    if (confirm('모든 캐시를 삭제하고 새로고침하시겠어요?')) {
        try {
            const userData = localStorage.getItem(STORAGE_KEY);
            localStorage.clear();
            if (userData) {
                localStorage.setItem(STORAGE_KEY, userData);
            }
            ui.showNotification('캐시가 삭제되었습니다. 새로고침합니다...');
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        } catch (error) {
            ui.showNotification('캐시 삭제 실패', 'error');
        }
    }
}

function logout() {
    if (confirm('정말 그룹에서 나가시겠어요?')) {
        state.currentGroup = null;
        state.userNickname = '';
        state.cars = [];
        localStorage.removeItem(STORAGE_KEY);
        ui.showLoginSection();
        ui.showNotification('그룹에서 나갔습니다');
    }
}
