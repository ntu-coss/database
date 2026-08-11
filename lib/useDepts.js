import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'coss_db_dept';

// 目前選取的系所（供 navbar 這種拿不到 getStaticProps 的元件使用）。
// 清單來自建置期產生的 public/depts.json；選取順序：網址 ?dept= → 上次選擇
// → 清單第一個。
export function useDepts() {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
    const [depts, setDepts] = useState([]);
    const [dept, setDeptState] = useState(null);

    useEffect(() => {
        let alive = true;
        fetch(`${basePath}/depts.json`)
            .then((res) => res.json())
            .then((list) => {
                if (!alive || !Array.isArray(list)) return;
                setDepts(list);
                setDeptState(resolveDept(list.map((d) => d.code)));
            })
            .catch((err) => console.error('Failed to load department list:', err));
        return () => { alive = false; };
    }, [basePath]);

    const setDept = useCallback((code) => {
        setDeptState(code);
        try { window.localStorage.setItem(STORAGE_KEY, code); } catch (e) { /* 無痕模式 */ }
    }, []);

    return { depts, dept, setDept };
}

// 從網址與 localStorage 推出該顯示哪個系；codes 為可接受的清單。
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
