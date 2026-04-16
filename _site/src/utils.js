/**
 * 시간 계산 유틸리티
 * @param {string|number} timestamp 
 * @returns {string} 상대 시간 문자열
 */
export function getTimeAgo(timestamp) {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - updateTime) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
}

/**
 * 그룹 코드 생성 (6자리 대문자)
 */
export function generateGroupCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

/**
 * 유저 ID 생성
 */
export function generateUserId() {
    return Math.random().toString(36).substr(2, 9);
}
