# 社會科學院資料庫（COSS Database）— 計畫書

給 Morgan 看的版本。Agent 執行用的工作單在同目錄 `AGENT.md`。
最後更新：2026-08-12。

## 一句話

把經濟資料庫（`db-test` 那套）擴成「一站多系」：同樣的介面與每日 Actions
自動抓 Drive，navbar 可切換系所；公告與各系 Drive 連結改由社科院學生會官網後台管理。

## 網址與 repo

| 項目 | 位置 |
|---|---|
| 新 repo | `ntu-coss/database`（public，單一 repo，Pages 走 GitHub Actions） |
| 線上網址 | `https://ntu-coss.github.io/database/`（basePath `/database`） |
| 本機 | `~/Documents/Projects/ntu-coss/coss-db/`（就是這個資料夾，直接 git init） |
| 後端 | 沿用現有 Worker `ntu-coss-api`，新增 `/api/db/*` |
| 後台 | 沿用 `ntu-coss-web/public/admin-app.html`，新增「社科院資料庫」分頁 |

**不會動到**：`ntu-econ` 的三個 repo、`db-test`、社科院學生會官網現有功能。
資料庫站與官網同一個 host（`ntu-coss.github.io`），所以 **CORS 不用改**。

## 三個已拍板的決定

1. **Drive 讀取＝公開資料夾＋API key**（照搬 econ db）。
   → 各系資料夾必須設「知道連結的人皆可檢視」，否則 Actions 讀不到。這是唯一
   需要跟各系交涉的前置條件。API key 存 repo secret `DRIVE_API_KEY`
   （key 限制只能用 Drive API、只讀得到公開檔，外洩最壞情況＝燒配額）。
2. **全部即時更新**：公告由前台開站時直接打 Worker API（存檔即生效）；
   系所／資料夾設定改動後，後台按「立即重建」鈕觸發 GitHub Actions
   `repository_dispatch`，約 2–3 分鐘後生效。每天 03:00 的 cron 照常保底。
   → 需要一組 GitHub PAT，**存成 Worker secret，不進 Google Sheet**
   （Sheet 裡的設定會回傳給前端，只有名稱含 secret/token/key 的才會被擋，
   不值得冒險）。
3. **先出工作單再實作**（本文件＋AGENT.md）。

## 架構

```
各系公開 Drive 資料夾
      │  (Drive API v3 + API key)
      ▼
GitHub Actions（每日 03:00 cron / push / 後台按鈕 repository_dispatch）
  scripts/genIndex.mjs
      │   ①先向 Worker /api/db/config 要系所清單與資料夾 ID
      │   ②逐系遞迴走訪，產出 folders/<系>__<課程碼>.json
      │                        curriculums/<系>__<課程碼>.md
      ▼
  next build → out/ → GitHub Pages

前台開站 ──(client fetch)──> Worker /api/db/announcements ──> Google Sheet DBPosts
```

**索引檔命名**：`<dept>__<code>`（例：`econ__01.json`）。這樣現有的
`/folder/[cid]/[fid]` 動態路由完全不用改結構，只是 cid 變長。

## 各系所（2026-08-12 定案）

| code | 系所 | Drive 資料夾 / 上傳表單 |
|---|---|---|
| econ | 經濟學系 | 後台填（開發期先用現有經濟資料庫根資料夾 `1AFwD9mjlh4pyYg7T9ggkU6HH0AmORuSy`） |
| ps | 政治學系 | 後台填 |
| soc | 社會學系 | 後台填 |
| sw | 社會工作學系 | 後台填 |

Drive 資料夾 ID 與各系上傳表單連結**一律在後台填**，程式碼不寫死（開發期的
`depts.json` 只是後端還沒好之前的 fallback）。要加系所（如國發所）在後台加一列即可。

## 品牌（定案）

- `<title>` / footer：**台大社科院資料庫 | NTU COSS Database**
- navbar brand 文字：**臺大社科資料庫**（較短，避免手機擠版）
- GA4：**另開一組**，不與經濟資料庫共用（待 Morgan 給 measurement ID）

## 後台新分頁「社科院資料庫」

- **系所清單**：系名 / code / Drive 資料夾 ID（可貼整串網址，自動取 ID）/
  **上傳表單連結** / 排序 / 啟用開關。存檔後可按「立即重建」。
  → 上傳表單各系一份，前台按「檔案上傳」時依目前選的系分流；**未填連結的系
  就不顯示上傳鈕**（初期全部留空＝上傳鈕隱藏）。
- **公告**：標題 / Markdown 內容 / 發布時間 / 置頂 / 上下架。存檔即時生效。
- 權限 key 為 `db`，可只授權學術部的人，不影響場地/院櫃等既有權限。

## 落地順序（進度勾選以本表為準）

- [x] **P0** repo 骨架：複製 db-test → basePath `/database`、改站名、系所清單先寫死在 `depts.json`
- [x] **P1** genIndex 多系所化 ＋ navbar 系所切換 ＋ 搜尋索引帶系所
      （已本地 build 驗證；**genIndex 尚未對真實 Drive 跑過**，等 Morgan 用
      `DRIVE_API_KEY=… npm run index` 實測）
- [x] **P2** Worker：`DBDepts`/`DBPosts` 兩張表、`/api/db/config`、`/api/db/announcements`、後台 actions（已上測試區）
- [x] **P3** 後台 UI 分頁（系所清單 ＋ 公告 CRUD）（已上測試區）
- [x] **P4** 「立即重建」按鈕（程式碼完成；正式站要先 `wrangler secret put GITHUB_DISPATCH_TOKEN`，
      測試區 `GITHUB_DISPATCH_REPO` 留空＝按鈕不會真的觸發）
- [x] **P5** 前台公告改成即時 fetch，移除手寫 `posts/*.md`（前台已完成，等 P2 後端上線才看得到內容）
- [ ] **P6** 上線：Pages 設定、README、SEO（title/description/sitemap）、
      官網 navbar 加「資料庫」連結（改 `ntu-coss-web`，走 staging-first ＋ 雙 repo push）

P0–P1 做完就能看到成品（系所清單先寫死）；P2 之後才需要動到官網後端。

## 未決事項

1. 各系是否願意把 Drive 資料夾設為公開（唯一對外前置條件，需逐系交涉）。
2. 新 GA4 measurement ID（Morgan 到 GA 後台開一組 `G-…` 給我填）。
3. 各系上傳表單的實際連結（後台填，可日後補）。

## 已知的坑（來自 econ db 與官網的血淚）

- `curriculums/*.md` 的 `updated` 值一定要加引號，否則 YAML 會解析成 Date 物件，
  `getStaticProps` 無法序列化而 build 失敗。
- genIndex 絕不可 log 完整 request URL（URL 內含 API key）。
- `folders/`、`curriculums/` 是建置產物，要 gitignore，不進 repo。
- Worker 那邊：`worker/src/admin.js` 有奇怪位元組，grep 要用 `grep -a`。
- 官網是 source repo + deploy repo 雙 repo，改 `ntu-coss-web` 後兩邊都要 push。
  本專案是單一 repo，沒有這個問題。
