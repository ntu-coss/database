import fs from 'fs';
import path from 'path';

// 系所清單的單一讀取入口（僅供 getStaticProps 等建置期程式碼使用）。
//
// 正式來源是社科院學生會官網後台（Worker /api/db/config），由
// scripts/genIndex.mjs 在建置時抓下來寫成 depts.resolved.json。
// 本機開發沒跑過 genIndex 時，退回 repo 內的 depts.json。
const RESOLVED = path.join(process.cwd(), 'depts.resolved.json');
const FALLBACK = path.join(process.cwd(), 'depts.json');

export function getDepts() {
    const file = fs.existsSync(RESOLVED) ? RESOLVED : FALLBACK;
    const list = JSON.parse(fs.readFileSync(file, 'utf8'));
    return list
        .filter((d) => d.enabled !== false && d.code)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
}

// 只回傳前台需要的欄位（folderId 是內部資訊，不必送到瀏覽器）。
export function getPublicDepts() {
    return getDepts().map((d) => ({
        code: d.code,
        name: d.name,
        uploadUrl: d.uploadUrl || '',
    }));
}
