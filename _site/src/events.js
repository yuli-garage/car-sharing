/**
 * 모든 이벤트 리스너 등록
 */
export function setupEventListeners(handlers) {
    const {
        onSwitchTab,
        onJoinGroup,
        onCreateGroup,
        onCopyCode,
        onShowAddCar,
        onHideAddCar,
        onAddCar,
        onHideUpdateModal,
        onUpdateLocation,
        onToggleNotification,
        onRefresh,
        onClearCache,
        onLogout,
        onCarAction // 이벤트 위임용
    } = handlers;

    // 탭 전환
    document.querySelectorAll('.login-tab').forEach(tab => {
        tab.addEventListener('click', () => onSwitchTab(tab.dataset.tab));
    });

    // 그룹 참여/생성
    document.getElementById('joinBtn')?.addEventListener('click', onJoinGroup);
    document.getElementById('createBtn')?.addEventListener('click', onCreateGroup);

    // 공용 버튼들
    document.getElementById('copyCodeBtn')?.addEventListener('click', onCopyCode);
    document.getElementById('showAddCarBtn')?.addEventListener('click', onShowAddCar);
    document.getElementById('hideAddCarBtn')?.addEventListener('click', onHideAddCar);
    document.getElementById('addCarBtn')?.addEventListener('click', onAddCar);
    document.getElementById('hideUpdateModalBtn')?.addEventListener('click', onHideUpdateModal);
    document.getElementById('updateLocationBtn')?.addEventListener('click', onUpdateLocation);
    
    // 설정 및 로그아웃
    document.getElementById('notificationToggle')?.addEventListener('click', onToggleNotification);
    document.getElementById('refreshBtn')?.addEventListener('click', onRefresh);
    document.getElementById('clearCacheBtn')?.addEventListener('click', onClearCache);
    document.getElementById('logoutBtn')?.addEventListener('click', onLogout);

    // 차량 리스트 이벤트 위임 (수정/삭제 버튼)
    document.getElementById('carList')?.addEventListener('click', (e) => {
        const target = e.target;
        if (target.tagName !== 'BUTTON') return;

        const carId = target.dataset.id;
        if (!carId) return;

        if (target.classList.contains('btn-update')) {
            onCarAction('update', carId);
        } else if (target.classList.contains('btn-delete')) {
            onCarAction('delete', carId);
        }
    });

    // 전역 클릭 (모달 닫기)
    window.addEventListener('click', (event) => {
        if (event.target.id === 'addCarModal') onHideAddCar();
        if (event.target.id === 'updateLocationModal') onHideUpdateModal();
    });

    // 엔터키 입력
    document.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const addModal = document.getElementById('addCarModal');
            const updateModal = document.getElementById('updateLocationModal');

            if (addModal?.style.display === 'block') onAddCar();
            else if (updateModal?.style.display === 'block') onUpdateLocation();
        }
    });

    // 자동 대문자 변환
    document.getElementById('joinCode')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
}
