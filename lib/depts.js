import fs from 'fs';
import path from 'path';

// 系所清單的唯一來源是學生會官網後台，由 scripts/genIndex.mjs 在建置時抓下來
// 寫成 depts.resolved.json（gitignored）。這裡只負責讀，不做任何預設清單——
// 沒跑過 genIndex 就是沒有系所，而不是顯示一份猜的。
const RESOLVED = path.join(process.cwd(), 'depts.resolved.json');

export function getDepts() {
    if (!fs.existsSync(RESOLVED)) return [];
    return JSON.parse(fs.readFileSync(RESOLVED, 'utf8'))
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
