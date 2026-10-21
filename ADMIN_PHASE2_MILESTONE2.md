# 第二期工程 Milestone 2｜資料版本安全

本分支的管理後台已接上新版版本化 API，但 GitHub Pages 獨立預覽維持唯讀，且目前 Render 正式後端還未部署 v2。**請勿在正式試算表上進行破壞性測試。**

## 前端修改

- 讀取優先：`GET /api/data/v2`（回傳 `version`），使用 `cache: no-store`。如舊後端回傳 404，僅為預覽讀取退回 `GET /api/data`，絕不允許無版本儲存。
- 儲存一律：`POST /api/data/v2`，JSON 格式 `{ version, data }`，並保持使用原 Google ID token。
- 同一瀏覽器以模組層儲存鎖防止任何兩個 `saveData()` 同時送出（包含清空資料功能）。
- 409 `DATA_CONFLICT`：從雲端重新取得最新資料和版本，保留未送出的編輯表單內容，提示使用者檢查後再送出。
- 428 `VERSION_REQUIRED`：不進行寫入，提示缺少新版後端／版本資訊。
- 原有公開頁面及獨立互動預覽照常使用真實公開資料，但**預覽按鈕不會呼叫 POST**。

## 依賴後端

[後端 PR #2](https://github.com/hwh0410/NanxiChurchLineBot/pull/2) 必須先完成 staging 驗證與部署後，前端才適合正式上線。

**相容順序：** 先後端（舊前端短期仍用舊 POST），再前端，確認所有管理員已載入新版，最後在 Render 設 `REQUIRE_VERSIONED_WRITES=true` 拒絕舊無版本請求。

## 測試狀況

- 本分支前端 CI 編譯驗證通過。
- 後端有單元與模擬整合測試，包含一位管理員成功、另一位舊版本被拒，以及原子寫入失敗不變更資料。
- 尚未建立具有獨立 Sheet／Render 的真正整合測試環境，所以**尚不可宣告正式多人編輯安全**。
- 單一 Render 程序以 queue 限制競爭；多 Render 實例或外部直接編輯 Google Sheets 仍存在競爭視窗。

## 獨立預覽

https://hwh0410.github.io/NanxiChurchChoir/preview/admin-phase2-v1/

切換至「管理」，可試填、複製、排序與預覽建立結果；任何輸入不會寫進正式 Google Sheets。

