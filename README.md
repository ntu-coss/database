# 台大社科院資料庫 | NTU COSS Database

整合臺大社會科學院各系考古題與課程資源的靜態網站。
線上位置：`https://ntu-coss.github.io/database/`

## 運作方式

```
各系公開 Drive 資料夾
      │  Drive API v3（API key，唯讀公開檔）
      ▼
GitHub Actions（每日 03:00 台北時間 / push / 後台「立即重建」）
  scripts/genIndex.mjs
      ├─ 向社科院學生會官網後台索取系所清單（Worker /api/db/config）
      ├─ 逐系遞迴走訪 Drive，產出 folders/<系>__<課程碼>.json
      │                          curriculums/<系>__<課程碼>.md
      └─ 寫出 depts.resolved.json
  npm run build（prebuild 產生 public/depts.json 與 public/search-index.json）
      ▼
  out/ → GitHub Pages
```

公告不走建置流程：前台開站時直接向 Worker `/api/db/announcements` 取得，
在後台存檔後即時生效。

## 開發

```bash
npm install
npm run dev            # 沒有索引資料也能跑，課程清單會是空的
DRIVE_API_KEY=… npm run index   # 抓 Drive 產生索引（金鑰請用環境變數，勿寫進檔案）
npm run build
```

`folders/`、`curriculums/`、`depts.resolved.json`、`public/depts.json`、
`public/search-index.json` 都是建置產物，已 gitignore。

`depts.json` 是後台無法連線時的系所清單 fallback；正式的系所名稱、Drive 資料夾
與上傳表單連結一律在社科院學生會官網後台的「社科院資料庫」分頁維護。

## 環境變數

| 名稱 | 用途 |
|---|---|
| `DRIVE_API_KEY` | Drive API 金鑰（repo secret，僅唯讀公開檔） |
| `BASE_PATH` | Pages 子路徑，CI 以 repo 名自動帶入（預設 `/database`） |
| `API_BASE` | 後端 Worker 位址（預設正式站；repo variable 可覆寫成 staging） |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID，未設定即不掛追蹤 |

## 相關專案

- 社科院學生會官網（後台在此）：`ntu-coss/ntu-coss.github.io`、原始碼 `ntu-coss/ntu-coss-web`
- 台大經濟資料庫（本站前身）：`ntu-econ/database`

實作計畫與工作單見 `PLAN.md` / `AGENT.md`。
