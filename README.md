# 楠西教會詩班平台

公開網站： https://hwh0410.github.io/NanxiChurchChoir/

## 資料與權限架構

- GitHub Pages：React + Vite 網站，團員不用登入就能查詢。
- Render：提供 Google Sheets 資料 API 與 LINE Bot。
- Google Sheets：排程、曲目、資源、歷年影片。
- Google Identity Services：管理員登入，取代舊版 Supabase Auth。
- 私人 Google Sheet：管理員授權名單，後端每次寫入前都會驗證。

**請勿在 GitHub 儲存 OAuth client secret、Service Account 私鑰或使用者密碼。**

## 前端設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)，在你控制的 Google Cloud 專案設定 OAuth 同意畫面。
2. 建立 OAuth client ID，應用程式類型選擇「網頁應用程式」。
3. 「已授權的 JavaScript 來源」加入 `https://hwh0410.github.io`，本機測試可以再加入 `http://localhost:5173`。這裡不含 Repository 路徑。
4. 記下 **Client ID**（不是 client secret）。在本機新增 `.env.local`：
   ```env
   VITE_GOOGLE_CLIENT_ID=你的網頁OAuth_Client_ID
   VITE_API_BASE_URL=https://nanxichurchlinebot.onrender.com
   ```
5. 執行 `npm ci && npm run dev`。部署到 GitHub Pages 前，建置環境也必須有 `VITE_GOOGLE_CLIENT_ID`，否則 Google 按鈕會顯示設定錯誤。

## 後端與管理員名單

請依照 LINE Bot 專案中的 [GOOGLE_AUTH_SETUP.md](https://github.com/hwh0410/NanxiChurchLineBot/blob/feature/google-signin-admin-sheet/GOOGLE_AUTH_SETUP.md) 建立私人管理員名單並設定 Render。

完成前請勿合併兩個 PR 或刪除舊 Supabase 專案。兩個 Repository 都應先部署並驗證相同 Google Client ID，再切換正式服務。
