import { getTimeAgo } from './utils.js';

/**
 * 차량 목록 렌더링
 */
export function renderCarList(cars) {
    const carList = document.getElementById('carList');
    if (!carList) return;
    
    carList.innerHTML = '';

    if (cars.length === 0) {
        carList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🚗</div>
                <div>아직 등록된 차량이 없어요</div>
                <div style="font-size: 0.9rem; margin-top: 5px;">새 차량 추가 버튼을 눌러주세요</div>
            </div>
        `;
        return;
    }

    cars.forEach(car => {
        const timeAgo = car.lastUpdated ? getTimeAgo(car.lastUpdated) : null;

        const carCard = document.createElement('div');
        carCard.className = 'car-card';
        carCard.innerHTML = `
            <div class="car-header">
                <div class="car-name">${car.name}</div>
                <div class="car-status">${car.location ? '위치 있음' : '위치 없음'}</div>
            </div>
            <div class="parking-info">
                ${car.location ?
                    `<div class="location-text">${car.location}</div>` +
                    (timeAgo ? `<div class="update-time">${timeAgo} 업데이트</div>` : '') +
                    (car.updatedBy ? `<div class="updated-by">by ${car.updatedBy}</div>` : '') :
                    '<div class="no-location">주차 위치가 등록되지 않았어요</div>'
                }
            </div>
            <div class="btn-group">
                <button class="btn btn-secondary btn-delete" data-id="${car.id}">
                    삭제
                </button>
                <button class="btn btn-primary btn-update" data-id="${car.id}">
                    위치 ${car.location ? '수정' : '등록'}
                </button>
            </div>
        `;
        carList.appendChild(carCard);
    });
}

/**
 * 알림 표시
 */
export function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/**
 * 연결 상태 업데이트
 */
export function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    if (!statusElement) return;

    if (status === 'online') {
        statusElement.innerHTML = '🟢 실시간 동기화 활성화';
        statusElement.className = 'connection-status status-connected';
    } else {
        statusElement.innerHTML = '🟡 로컬 모드 (동기화 불가)';
        statusElement.className = 'connection-status status-local';
    }
}

/**
 * 탭 전환 (참여하기 / 새로 만들기)
 */
export function switchTab(tab) {
    const joinTab = document.querySelector('.login-tab:first-child');
    const createTab = document.querySelector('.login-tab:last-child');
    const joinForm = document.getElementById('joinForm');
    const createForm = document.getElementById('createForm');

    if (tab === 'join') {
        joinTab.classList.add('active');
        createTab.classList.remove('active');
        joinForm.style.display = 'block';
        createForm.style.display = 'none';
    } else {
        joinTab.classList.remove('active');
        createTab.classList.add('active');
        joinForm.style.display = 'none';
        createForm.style.display = 'block';
    }
}

/**
 * 앱 섹션 표시
 */
export function showAppSection(groupCode) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('appSection').style.display = 'block';
    document.getElementById('displayShareCode').textContent = groupCode;
}

/**
 * 로그인 섹션 표시
 */
export function showLoginSection() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('appSection').style.display = 'none';
}

/**
 * 모달 제어 함수들
 */
export function showAddCarModal() {
    document.getElementById('addCarModal').style.display = 'block';
    document.getElementById('carName').focus();
}

export function hideAddCarModal() {
    document.getElementById('addCarModal').style.display = 'none';
    document.getElementById('carName').value = '';
}

export function showUpdateModal(carName, location) {
    document.getElementById('updateModalTitle').textContent = `${carName} 주차 위치`;
    document.getElementById('updateLocationModal').style.display = 'block';

    if (location) {
        const [floor, section] = location.split(' - ');
        document.getElementById('floor').value = floor || '';
        document.getElementById('section').value = section || '';
    }
}

export function hideUpdateModal() {
    document.getElementById('updateLocationModal').style.display = 'none';
    document.getElementById('floor').value = '';
    document.getElementById('section').value = '';
}
