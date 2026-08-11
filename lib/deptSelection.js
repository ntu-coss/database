const STORAGE_KEY = 'coss_db_dept';

// 目前選取哪個系：網址 ?dept= → 上次選擇 → 清單第一個。
// 只在瀏覽器端呼叫（伺服器端渲染時一律用清單第一個，才不會 hydration mismatch）。
export function resolveDept(codes) {
    if (typeof window === 'undefined' || codes.length === 0) return codes[0] || null;
    const fromQuery = new URLSearchParams(window.location.search).get('dept');
    let stored = null;
    try { stored = window.localStorage.getItem(STORAGE_KEY); } catch (e) { /* 無痕模式 */ }
    return [fromQuery, stored].find((c) => c && codes.includes(c)) || codes[0];
}

export function rememberDept(code) {
    try { window.localStorage.setItem(STORAGE_KEY, code); } catch (e) { /* 無痕模式 */ }
}
