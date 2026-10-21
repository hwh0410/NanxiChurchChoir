# NanxiChurchChoir｜A 暖光聖詩 · 第一版改版

## 設計方向

基於「A 暖光聖詩」視覺風格，加入低對比紙張、自然窗光與水彩感 SVG 底圖：

- 色彩：米白、象牙米、鼠尾草綠、柔和金，保留原始教會 Logo。
- 首頁改為以實際資料組成的內容入口：近期聚會、最近安排曲目、自主練習、詩班影片。
- 頁面導覽加入 icon 和明確目前頁面狀態。
- 管理頁維持原有編輯流程，增加概況、快速搜尋與易讀的輸入區。
- 針對手機優化導覽、卡片堆疊、間距與觸控面積。
- `prefers-reduced-motion` 支援；裝飾性背景不遮擋可操作元件。

## 變更範圍

- `src/assets/paper-light.svg`：程式內建輕量 SVG 背景；無第三方圖片或遠端資源依賴。
- `src/theme-v1.css`：覆寫版型、變數與回應式視覺；保留舊樣式檔以利回退。
- `src/App.jsx`：首頁改採內容概覽並新增後台搜尋/概況；沿用原本 Google Identity Services 及 Render API。

## 本版不處理

- 不動 Render / Google Sheets / LINE Bot。
- 不修改資料表 schema、API 端點或存取權限。
- 不重新設計目前逐筆表單的新增、編輯和刪除流程。
- 不處理多人同步、整批儲存衝突或離線儲存；這些需要另開資料安全階段處理。

## 驗收清單

1. 桌面與手機首頁可閱讀，實際資料正常顯示，沒有因為無未來行程而顯示虛構內容。
2. 首頁「行程」「曲目」「影片」按鈕正確切換。
3. 管理登入/登出照常運作，未登入不顯示管理表單。
4. 排程、曲目、資源、影片頁籤搜尋能篩選，不改變底層資料；切換頁籤清除查詢。
5. 管理員在測試資料範圍內新增並編輯資料，儲存狀態和 Google Sheets 同步正常。
6. LINE Bot 不受影響（本 PR 不改後端）。
7. 本 PR 僅建立測試分支；不觸發正式 GitHub Pages 更新。

## 安全部署

目前 GitHub Pages 使用 `gh-pages` 分支。合併 PR 到 `main` 本身不會執行手動發布流程。請先審查畫面、確認管理流程，再執行 `Publish choir site to GitHub Pages` 手動發布。

## 線上唯讀預覽

- 預覽網址：https://hwh0410.github.io/NanxiChurchChoir/preview/a-style-v1/
- 自動發布流程：`.github/workflows/publish-a-style-preview.yml`。建置使用 `VITE_BASE_PATH=/NanxiChurchChoir/preview/a-style-v1/` 以及 `VITE_READ_ONLY_PREVIEW=true`。
- 預覽使用相同的公開 API 讀取資料，但沒有任何正式管理表單；`cloudDb.saveData` 另有唯讀保護。
- 版型預覽「管理」頁為展示用搜尋清單，**不是**新版 CRUD 管理頁完成品。
- GitHub Pages 正式根目錄 `/NanxiChurchChoir/` 不變；已備份發布分支至 `backup/gh-pages-before-a-preview-20261021`。
