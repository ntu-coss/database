#!/usr/bin/env node
// scripts/genIndex.mjs
//
// Regenerates folders/<dept>__<code>.json and curriculums/<dept>__<code>.md
// from each department's public Google Drive folder tree, keeping the exact
// per-course output format the economics database has always produced.
//
// The department list (name + Drive folder id) comes from the SA website
// backend (Worker /api/db/config) and nowhere else; the resolved list is
// written to depts.resolved.json for the Next.js build to read.
//
// Usage: DRIVE_API_KEY=xxxx node scripts/genIndex.mjs
//
// Security note: never log the API key or any full request URL (which would
// contain the key as a query param). Only folder/file names and counts are
// logged.

import fs from 'fs';
import path from 'path';
import { courseIdentity } from '../lib/courseIdentity.mjs';
import { filterCoursesByPolicy, normalizeCoursePolicy } from './courseVisibility.mjs';

// trim：secret 常在複製貼上時帶到換行或空白，Google 會回 400 API key not valid
const API_KEY = (process.env.DRIVE_API_KEY || '').trim();
if (!API_KEY) {
    console.error('Error: DRIVE_API_KEY environment variable is not set. Aborting.');
    process.exit(1);
}
// Google API key 是 AIza 開頭的 39 字元。形狀不對就先講清楚，免得只看到
// Drive 回的「API key not valid」還要猜是貼錯字串還是權限問題。
// 只印長度與是否符合格式，不印金鑰本身。
if (!/^AIza[\w-]{35}$/.test(API_KEY)) {
    console.warn(
        `Warning: DRIVE_API_KEY 的長度是 ${API_KEY.length}（預期 39）且格式不像 Google API key。` +
        ' 常見原因：複製到憑證頁面的「金鑰 ID」而不是金鑰本身。'
    );
}

const API_BASE = process.env.API_BASE || 'https://ntu-coss-api.ntusssa2.workers.dev';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const MAX_CONCURRENCY = 5;

const ROOT_DIR = process.cwd();
const FOLDERS_DIR = path.join(ROOT_DIR, 'folders');
const CURRICULUMS_DIR = path.join(ROOT_DIR, 'curriculums');
const DEPTS_RESOLVED = path.join(ROOT_DIR, 'depts.resolved.json');

// ---- tiny concurrency limiter -------------------------------------------

let active = 0;
const waiters = [];

function acquire() {
    return new Promise((resolve) => {
        const tryAcquire = () => {
            if (active < MAX_CONCURRENCY) {
                active += 1;
                resolve();
            } else {
                waiters.push(tryAcquire);
            }
        };
        tryAcquire();
    });
}

function release() {
    active -= 1;
    const next = waiters.shift();
    if (next) next();
}

// ---- Drive API -----------------------------------------------------------

function byName(a, b) {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
}

async function listChildren(folderId) {
    await acquire();
    try {
        const files = [];
        let pageToken;
        do {
            const params = new URLSearchParams({
                q: `'${folderId}' in parents and trashed=false`,
                fields: 'nextPageToken,files(id,name,mimeType,modifiedTime)',
                pageSize: '1000',
                key: API_KEY,
            });
            if (pageToken) params.set('pageToken', pageToken);

            let res;
            try {
                res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
            } catch (err) {
                // Never include the URL (it contains the API key) in the error.
                throw new Error(`Drive API request failed (network error): ${err.message}`);
            }

            if (!res.ok) {
                let message = res.statusText;
                try {
                    const body = await res.json();
                    message = (body && body.error && body.error.message) || message;
                } catch (_) {
                    // ignore body parse failures, fall back to statusText
                }
                throw new Error(`Drive API request failed (status ${res.status}): ${message}`);
            }

            const data = await res.json();
            files.push(...(data.files || []));
            pageToken = data.nextPageToken;
        } while (pageToken);
        return files;
    } finally {
        release();
    }
}

// ---- tree walk -------------------------------------------------------------

// Recursively walks a folder, populating `db` (keyed by folder id) with the
// same structure genFolder.py produces, and returns this folder's recursive
// (whole-subtree) file count together with the max Drive `modifiedTime`
// (RFC3339 UTC string) seen among all descendant files and folders.
async function walk(folderId, route, db) {
    const children = await listChildren(folderId);
    const folderChildren = children.filter((f) => f.mimeType === FOLDER_MIME);
    const fileChildren = children.filter((f) => f.mimeType !== FOLDER_MIME);

    const fileEntries = fileChildren
        .map((f) => ({ url: f.id, name: f.name }))
        .sort(byName);

    let fileCount = fileChildren.length;

    // RFC3339 UTC timestamps of the same width compare correctly as strings.
    let maxModifiedTime = null;
    const bump = (t) => {
        if (t && (!maxModifiedTime || t > maxModifiedTime)) maxModifiedTime = t;
    };
    fileChildren.forEach((f) => bump(f.modifiedTime));

    const folderEntries = await Promise.all(
        folderChildren.map(async (fc) => {
            const childRoute = `${route}/${fc.name}`;
            const childResult = await walk(fc.id, childRoute, db);
            return {
                url: fc.id,
                name: fc.name,
                file_count: childResult.fileCount,
                _ownModifiedTime: fc.modifiedTime,
                _maxModifiedTime: childResult.maxModifiedTime,
            };
        })
    );
    folderEntries.forEach((e) => {
        bump(e._ownModifiedTime);
        bump(e._maxModifiedTime);
    });
    folderEntries.sort(byName);
    fileCount += folderEntries.reduce((sum, e) => sum + e.file_count, 0);

    // Strip the internal-only modifiedTime fields before writing to db so
    // the folders/*.json output format stays unchanged.
    const cleanFolderEntries = folderEntries.map(({ url, name, file_count }) => ({
        url,
        name,
        file_count,
    }));

    db[folderId] = {
        route,
        folder: cleanFolderEntries,
        file: fileEntries,
        dir_count: folderChildren.length,
        file_count: fileCount,
    };

    return { fileCount, maxModifiedTime };
}

// Converts an RFC3339 UTC timestamp (as returned by the Drive API) into a
// YYYY-MM-DD date string in Asia/Taipei local time.
function toTaipeiDateString(isoString) {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

// ---- department list -------------------------------------------------------

function normalizeDepts(list) {
    return (Array.isArray(list) ? list : [])
        .map((d) => ({
            code: String(d.code || '').trim(),
            name: String(d.name || '').trim(),
            folderId: String(d.folderId || '').trim(),
            uploadUrl: String(d.uploadUrl || '').trim(),
            order: Number(d.order) || 0,
            // Google Sheets 會把 'true'/'false' 存成字串或布林，兩種都要吃。
            enabled: String(d.enabled) !== 'false',
            // 預設 all 維持既有行為；只有後台明確開啟 allowlist 才進行過濾。
            ...normalizeCoursePolicy(d),
            uploadCourseAllowlist: Array.isArray(d.uploadCourseAllowlist)
                ? d.uploadCourseAllowlist.map((id) => String(id).trim()).filter(Boolean)
                : [],
        }))
        .filter((d) => d.code && d.enabled)
        .sort((a, b) => a.order - b.order);
}

// 系所清單只有一個來源：學生會官網後台。刻意不做本地 fallback——後端暫時不通時
// 寧可讓建置失敗、保留上一次成功部署的網站，也不要用一份猜的清單把線上站蓋掉。
async function loadDepts() {
    let data;
    try {
        const res = await fetch(`${API_BASE}/api/db/config`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        data = await res.json();
    } catch (err) {
        throw new Error(
            `無法向後台取得系所清單（${API_BASE}/api/db/config）：${err.message}。` +
            ' 建置中止，線上站維持上一版。'
        );
    }
    const depts = normalizeDepts(data && data.depts);
    if (depts.length === 0) {
        throw new Error('後台的系所清單是空的：請先到後台「社科院資料庫」分頁新增系所並啟用。');
    }
    console.log(`Department list: ${depts.length} from backend (${API_BASE}).`);
    return depts;
}

function resetDir(dir, ext) {
    fs.mkdirSync(dir, { recursive: true });
    for (const name of fs.readdirSync(dir)) {
        if (name.endsWith(ext)) fs.unlinkSync(path.join(dir, name));
    }
}

// ---- main ------------------------------------------------------------------

// 走訪單一系所的 Drive 根資料夾，其下每個子資料夾＝一門課。
// 回傳該系檔案總數；索引檔名為 <系code>__<課程碼>，讓既有的 /folder/[cid]/[fid]
// 路由不必多一層就能區分系所。
async function indexDept(dept) {
    console.log(`\n[${dept.code}] ${dept.name}: fetching course list...`);
    const rootChildren = await listChildren(dept.folderId);
    const discoveredCourses = rootChildren.filter((f) => f.mimeType === FOLDER_MIME);
    const courseFolders = filterCoursesByPolicy(discoveredCourses, dept);
    const hiddenCount = discoveredCourses.length - courseFolders.length;
    console.log(
        `[${dept.code}] found ${discoveredCourses.length} course folders; ` +
        `${courseFolders.length} visible${hiddenCount ? `, ${hiddenCount} hidden by allowlist` : ''}.`
    );

    let deptFiles = 0;

    for (const course of courseFolders) {
        const { code, title } = courseIdentity(course);
        const id = `${dept.code}__${code}`;
        const uploadEnabled = dept.uploadCourseAllowlist.includes(course.id);

        const db = {};
        const { fileCount, maxModifiedTime } = await walk(course.id, course.name, db);
        const dirCount = Object.keys(db).length - 1; // exclude the course root itself

        fs.writeFileSync(
            path.join(FOLDERS_DIR, `${id}.json`),
            JSON.stringify(db, null, 4),
            'utf8'
        );

        // Fall back to the course folder's own modifiedTime (e.g. an empty
        // course folder with no descendants yet), then to today as a last resort.
        const updated = toTaipeiDateString(maxModifiedTime || course.modifiedTime || new Date().toISOString());

        const md = [
            '---',
            `title: ${title}`,
            `fcnt: ${fileCount}`,
            `url: ${id}`,
            `fid: ${course.id}`,
            `dept: ${dept.code}`,
            `deptName: ${dept.name}`,
            `uploadEnabled: ${uploadEnabled ? 'true' : 'false'}`,
            `updated: "${updated}"`, // 加引號:避免 YAML 解析成 Date 物件(getStaticProps 無法序列化)
            '---',
            `更新日期：${updated}`,
            '',
        ].join('\n');
        fs.writeFileSync(path.join(CURRICULUMS_DIR, `${id}.md`), md, 'utf8');

        deptFiles += fileCount;
        console.log(`[${dept.code}] ${course.name} is done, ${fileCount} files and ${dirCount} folders`);
    }

    return deptFiles;
}

async function main() {
    const depts = await loadDepts();
    // 尚未填 Drive 資料夾的系所仍會出現在 depts.resolved.json（前台看得到系名、
    // 顯示「尚未開放」），但不進行索引。
    const indexable = depts.filter((d) => d.folderId);
    const skipped = depts.filter((d) => !d.folderId);
    if (skipped.length) {
        console.log(`Skipping (no Drive folder set): ${skipped.map((d) => d.code).join(', ')}`);
    }

    fs.writeFileSync(DEPTS_RESOLVED, JSON.stringify(depts, null, 4), 'utf8');

    resetDir(FOLDERS_DIR, '.json');
    resetDir(CURRICULUMS_DIR, '.md');

    let totalFiles = 0;
    for (const dept of indexable) {
        totalFiles += await indexDept(dept);
    }

    console.log(`\nDatabase has ${totalFiles} files across ${indexable.length} departments`);
}

main().catch((err) => {
    console.error(`genIndex failed: ${err.message}`);
    process.exit(1);
});
