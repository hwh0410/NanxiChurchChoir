# 詩班時程與練習系統 MVP

這是一個可直接執行的 MVP 版本，功能包含：

- 本週曲目顯示
- 日曆排程
- 曲目練習資料庫
- YouTube 影片縮圖顯示
- 樂譜/PDF連結
- 管理者登入
- 新增曲目、練習資源、排程

## 執行方式

```bash
npm install
npm run dev
```

打開終端機顯示的網址，例如：

```text
http://localhost:5173
```

## 管理者登入

測試密碼：

```text
choir123
```

## 注意事項

目前 MVP 採用瀏覽器 localStorage 儲存資料，因此資料只會存在該台電腦/該瀏覽器。
若要給多位團員共同查看並由管理者集中更新，下一版建議改接 Supabase。

## 建議下一版

- 接 Supabase Database
- 管理者帳號改用 Supabase Auth
- 樂譜 PDF 改用 Supabase Storage
- 部署到 GitHub Pages 或 Vercel
