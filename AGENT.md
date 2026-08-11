# AGENT BRIEF — 社會科學院資料庫（COSS Database）

給執行本專案的 agent session。你可能沒有任何對話 context，本檔自足。
人類版計畫在同目錄 `PLAN.md`；完成一項就去更新 PLAN.md「落地順序」的 checkbox。

## 硬性約束（違反即失敗）

1. **不放金鑰**：Drive API key、GitHub PAT、Google 服務帳號金鑰，一律不寫進
   任何檔案、不出現在你執行的指令裡。需要設 secret → 產出指令請 Morgan 用
   `! <cmd>` 自跑（`gh secret set DRIVE_API_KEY`、
   `npx wrangler secret put GITHUB_DISPATCH_TOKEN`）。
2. **不做對外驗證**：部署後不 curl 線上站、不 poll。本地 build、讀檔驗收可以。
3. **改到 `ntu-coss-web` 就要走 staging-first**：
   `./update.sh staging` ＋ `npx wrangler deploy --env staging` → Morgan 驗收
   → `./update.sh` ＋ `npx wrangler deploy` → **並且 commit+push source repo
   `ntu-coss/ntu-coss-web`**（雙 repo 專案，只推 deploy repo 不算完成）。
4. 建立新 GitHub repo、開 Pages、改 repo 設定前先問 Morgan。
5. 不動 `~/Documents/Projects/ECON DB/` 底下任何東西（db-test 只讀不改）。

## 環境事實

| 項目 | 值 |
|---|---|
| 本專案本機路徑 | `~/Documents/Projects/ntu-coss/coss-db/` |
| 樣板（只讀） | `~/Documents/Projects/ECON DB/db-test/` |
| 官網原始碼 | `~/Documents/Projects/ntu-coss/ntu-coss-web/` |
| Worker 程式 | `ntu-coss-web/worker/src/`（index.js 路由、public.js 公開 API、admin.js 後台 dispatch、sheets.js 表格存取） |
| 後台 SPA | `ntu-coss-web/public/admin-app.html`（原生 JS，非 React） |
| Worker 正式 | `https://ntu-coss-api.ntusssa2.workers.dev` |
| 新站網址 | `https://ntu-coss.github.io/database/`，basePath `/database` |
| 經濟系 Drive 根 | `1AFwD9mjlh4pyYg7T9ggkU6HH0AmORuSy`（已公開） |

樣板關鍵檔（動手前先讀）：
`db-test/scripts/genIndex.mjs`（Drive 遞迴走訪 → folders/curriculums）、
`db-test/.github/workflows/deploy.yml`（cron ＋ Pages 部署）、
`db-test/components/navbar.js`、`db-test/lib/folder.js`、`db-test/lib/curriculum.js`、
`db-test/pages/folder/[cid]/[fid].js`。

## 已定案的設計決定（不要再重新討論）

- 本 repo 是 `ntu-econ/db-test` 的 **fork**，兩邊約 950 行雷同。2026-08-12 決議
  **接受漂移、不做共用套件／monorepo**（細節與量化見 PLAN.md）。改到共用部分時
  不必同步回 db-test，也不要主動提議合併。

- Drive 讀取＝**公開資料夾 ＋ Drive API key**（repo secret `DRIVE_API_KEY`），
  不走服務帳號。
- 公告＝**前台即時 fetch Worker**；系所設定＝**build 時讀取**，改動後由後台
  「立即重建」按鈕觸發 `repository_dispatch`。
- 索引檔命名 `<dept>__<code>`（如 `econ__01.json`），沿用現有
  `/folder/[cid]/[fid]` 路由，不新增路由層級。
- 後台權限 key ＝ `db`。
- GitHub PAT 存 **Worker secret** `GITHUB_DISPATCH_TOKEN`，不存 Google Sheet。
- 系所 code：`econ` 經濟學系、`ps` 政治學系、`soc` 社會學系、`sw` 社會工作學系。
  資料夾 ID 與上傳表單連結**只在後台填**，不寫死在程式碼。
- **系所清單沒有本地 fallback**：後台連不上或清單為空時 `genIndex` 直接失敗，
  讓線上站維持上一版。不要為了「讓 build 過」再加預設清單回來。
- 選系所在**課程頁的 pills**，navbar 不放系所選單；上傳鈕跟著目前看的系，
  也在課程頁。
- 品牌：`<title>`/footer 用「台大社科院資料庫 | NTU COSS Database」，
  navbar brand 用「臺大社科資料庫」。
- 「檔案上傳」鈕改成 **per-dept**：`DBDepts.uploadUrl` 有值才顯示，指向該系表單；
  初期全空＝鈕隱藏。
- GA4 **另開一組**（不可沿用經濟資料庫的 `G-9DND5R7733`）；ID 未到位前用
  env `NEXT_PUBLIC_GA_ID`，沒設就不掛 GA。

---

## 工作單（照順序；每張獨立可驗收）

### P0 repo 骨架
GOAL: 在 `~/Documents/Projects/ntu-coss/coss-db/` 建出可 build 的站，介面與
db-test 一致但改為社科院品牌。
SPEC:
- 複製 db-test 的 `components/ lib/ pages/ public/ styles/ scripts/ package.json
  next.config.js .github/`（**不要**複製 `node_modules/ out/ folders/
  curriculums/ posts/`）。
- `next.config.js` 的 basePath 預設改 `/database`；workflow 已用
  `BASE_PATH=/${GITHUB_REPOSITORY#*/}` 自動帶入，維持不變。
- `.gitignore` 至少含 `node_modules/ out/ .next/ folders/ curriculums/
  public/search-index.json`。
- 站名／`<title>`／navbar brand 改成「台大社科院資料庫 / NTU COSS Database」
  （最終文字待 Morgan 確認，先用這組）。navbar 的「系學會首頁」連到
  `https://ntu-coss.github.io/`。
- 新增 `depts.json`（暫時寫死，P2 之後由 API 覆蓋）：
  `[{"code":"econ","name":"經濟學系","folderId":"1AFwD9mjlh4pyYg7T9ggkU6HH0AmORuSy","order":1,"enabled":true}]`
ACCEPT: `npm i && npm run build` 通過並產生 `out/`；`git init` 完成但**先不要
建遠端 repo**；PLAN.md 的 P0 打勾。

### P1 多系所索引 ＋ navbar 切換
GOAL: genIndex 能一次抓多個系所，前台可切系。
SPEC:
- `scripts/genIndex.mjs`：
  - 系所清單來源：先試 `GET $API_BASE/api/db/config`（env `API_BASE`，預設
    `https://ntu-coss-api.ntusssa2.workers.dev`）；失敗或回傳空則 fallback 讀
    本地 `depts.json`，並在 log 說明用了哪一個。
  - 對每個 `enabled` 的系，以其 `folderId` 為根重跑現有 walk 邏輯，輸出
    `folders/<code>__<課程碼>.json`、`curriculums/<code>__<課程碼>.md`；
    frontmatter 加 `dept: <code>`、`deptName: <系名>`，其餘欄位（title/fcnt/
    url/fid/updated）格式**逐字不變**。
  - `updated` 保留引號（YAML 會把裸日期解析成 Date → getStaticProps 序列化失敗）。
  - 維持「絕不 log 完整 URL」的規則。
- `scripts/genSearchIndex.mjs`：搜尋結果的 route 前面帶上系名。
- `pages/curriculum.js` → 依系分組；navbar 加系所 dropdown（Bootstrap
  `dropdown`，選項由建置期產生的 `depts.json`/curriculum frontmatter 推導）。
  選擇的系存 localStorage，下次進站沿用。
- `lib/folder.js`、`/folder/[cid]/[fid]` 邏輯不需改（cid 已含系前綴），但麵包屑
  要顯示「系所 › 課程 › 資料夾」。
ACCEPT: 以 `DRIVE_API_KEY=… node scripts/genIndex.mjs`（Morgan 自跑）產出至少
兩個系的索引後 `npm run build` 通過；navbar 切系會換掉課程清單；搜尋結果 route
看得出系所。

### P2 Worker 後端
GOAL: 官網 Worker 提供資料庫站需要的公開 API 與後台操作。
SPEC（改 `ntu-coss-web/worker/src/`）：
- 新 sheet 兩張，用 `sheets.ensureSheet()` 建：
  - `DBDepts`: `id,code,name,folderId,uploadUrl,order,enabled`
  - `DBPosts`: `id,title,content,pinned,published,publishFrom,publishUntil,createdAt,author`
- `public.js` 新增 `getDbConfig(sheets)`、`getDbAnnouncements(sheets)`；
  公告的上下架/置頂邏輯直接沿用現有公告那套（`publishWindowOk`、
  `String(x)==='true'` 的布林正規化）。
- `index.js` 新增 GET 路由 `/api/db/config`、`/api/db/announcements`。
- `admin.js` 新增 handlers：`listDbDepts, saveDbDept, deleteDbDept,
  listDbPosts, saveDbPost, deleteDbPost, triggerDbRebuild`，全部在
  `ACTION_PAGE` 對到 `'db'`。`saveDbDept` 要用既有的 `driveFileId()` 把貼進來的
  Drive 網址轉成純 ID。
- 注意 Google Sheets 會把 'true'/'false' 轉成布林：寫入用 RAW、讀取用
  FORMATTED_VALUE、比較前正規化成字串（既有 helper 已處理，照抄用法）。
- `admin.js` 檔案含奇怪位元組，grep 一律加 `-a`。
ACCEPT: `wrangler deploy --env staging` 成功；staging 後台可呼叫新 action；
`/api/db/config` 回傳 depts 陣列。**先不要部署正式**。

### P3 後台 UI
GOAL: `admin-app.html` 新增「社科院資料庫」分頁。
SPEC:
- 側欄按鈕 ＋ tab pane `#t-db`；卡片列表加一張（`page: 'db'`，自選 icon/色）。
- `PAGE_LABELS` 加 `db: '社科院資料庫'`；`PERM_PAGES` 陣列加 `'db'`。
- 分頁內容兩區：
  1. 系所清單表格（新增/編輯/刪除列，欄位同 `DBDepts`），旁邊一顆
     「立即重建網站」按鈕（P4 才接上）。
  2. 公告 CRUD，欄位同 `DBPosts`，內容是 Markdown textarea；UI 直接參考現有
     「公告」分頁的做法，不要另創風格。
- 沿用既有 `call(action, ...args)` → `POST /api/admin` 的呼叫方式。
ACCEPT: staging 後台能新增一個系所並在 `/api/db/config` 看到；能新增一則公告
並在 `/api/db/announcements` 看到；非 owner 且未勾 `db` 權限的帳號看不到該分頁
且直接呼叫 action 會 403。

### P4 「立即重建」按鈕
GOAL: 後台按一下就觸發 GitHub Actions 重建資料庫站。
SPEC:
- workflow 加 `on: repository_dispatch: types: [rebuild]`。
- Worker `triggerDbRebuild`：`POST
  https://api.github.com/repos/$GITHUB_DISPATCH_REPO/dispatches`，headers 帶
  `Authorization: Bearer ${env.GITHUB_DISPATCH_TOKEN}`、
  `Accept: application/vnd.github+json`、`User-Agent`；body
  `{"event_type":"rebuild"}`。缺 secret 時回傳友善錯誤，不要噴 500。
- `wrangler.toml` 加 var `GITHUB_DISPATCH_REPO = "ntu-coss/database"`
  （正式與 staging 都設；staging 可指向同一 repo 或留空以停用）。
- 交給 Morgan 自跑的指令（PAT 需 `repo` 或 fine-grained 的 Contents:write）：
  `cd ~/Documents/Projects/ntu-coss/ntu-coss-web/worker && npx wrangler secret put GITHUB_DISPATCH_TOKEN`
ACCEPT: 程式碼與設定就緒、staging 部署成功；實際觸發由 Morgan 自行按一次確認
（agent 不做對外驗證）。

### P5 公告改即時
GOAL: 前台公告不再靠 `posts/*.md`。
SPEC: `pages/index.js` 改成 client-side `fetch($API_BASE/api/db/announcements)`，
載入中/失敗都要有文字狀態（沿用 db-test 搜尋索引的 fetch 錯誤處理風格）；
Markdown 用已裝的 `remark` + `remark-html` 或改用 `react-markdown`（擇一，別兩套
都裝）。移除手寫 `posts/` 與 `lib/post.js` 的首頁用途。
注意：資料庫站與 Worker 不同 origin（`ntu-coss.github.io` vs
`*.workers.dev`），Worker 的 `ALLOWED_ORIGINS` 必須含
`https://ntu-coss.github.io`（官網已在清單內，確認即可，勿刪既有值）。
ACCEPT: 本地 `npm run dev` 開首頁能顯示 staging Worker 回的公告；build 不因
缺少 posts/ 而失敗。

### P6 上線
SPEC: 建 GitHub repo `ntu-coss/database`（**先問 Morgan**）→ Settings → Pages
來源設 GitHub Actions → 加 repo secret `DRIVE_API_KEY`（Morgan 自跑
`gh secret set DRIVE_API_KEY`）→ push main → 確認 workflow 綠燈。
補 README、`<title>`/description/OG、sitemap。官網 navbar 是否加「資料庫」
連結由 Morgan 決定（PLAN.md 未決事項 4）。
ACCEPT: Actions 全綠；PLAN.md 全部打勾；把本專案現況寫進 memory
（新檔 `project-ntu-coss-db.md`，並在 `MEMORY.md` 加一行指標，
與 `[[project-ntu-coss-sa]]`、`[[project-econ-db-test]]` 互相連結）。

---

## 給 Morgan 的待辦（agent 不能代做）

1. 各系提供 Drive 資料夾並設為「知道連結的人皆可檢視」→ 把 ID 給 agent 或直接
   在後台填。
2. `gh secret set DRIVE_API_KEY -R ntu-coss/database`（可沿用 db-test 那把）。
3. `npx wrangler secret put GITHUB_DISPATCH_TOKEN`（P4 用）。
4. 建 repo ＋ Pages 來源設 GitHub Actions。
5. 確認站名、系所 code、是否保留「檔案上傳」按鈕（PLAN.md 未決事項）。
