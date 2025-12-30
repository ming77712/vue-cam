---
name: camera-table-element-plus
overview: 在現有 Vue 專案中加入使用 Element Plus 的攝影機設定表格頁面，透過 axios 從 API 取得資料並支援 RWD、排序、分頁與篩選。
todos:
  - id: setup-deps
    content: 安裝並設定 Element Plus 與 axios，並在 main.ts 中完成全域註冊與 axios 基本設定。
    status: pending
  - id: routing-page
    content: 在 router 中加入攝影機表格頁面路由並建立 CameraTableView.vue 頁面骨架。
    status: pending
    dependencies:
      - setup-deps
  - id: table-ui
    content: 在 CameraTableView.vue 中使用 Element Plus 建立表格欄位與基本 RWD 版面。
    status: pending
    dependencies:
      - routing-page
  - id: api-integration
    content: 建立 camera API 模組與型別，使用 axios 取得資料並在頁面載入時顯示。
    status: pending
    dependencies:
      - table-ui
  - id: sorting-paging-filtering
    content: 在前端實作表格的排序、分頁與篩選功能（名稱搜尋與是否推播過濾）。
    status: pending
    dependencies:
      - api-integration
---

# 使用 Element Plus 建立攝影機表格頁面（含 API 讀取與 RWD）

## 目標

- 在現有 Vue 專案中新增一個頁面，顯示「攝影機名稱、是否推播、轉向時間、預置點」四個主要欄位的表格。
- 使用 Element Plus 的 `el-table` 等元件，並透過 axios 向後端 API 取得 JSON 資料來 render。
- 表格需支援：RWD、欄位排序、分頁、簡單篩選（名稱搜尋、是否推播過濾）。

## 實作大綱

### 1. 專案依賴與基礎設定

- **確認 Vue 版本與專案架構**
- 檢查 `package.json` 以確認目前是 Vue 3 + Vite + TypeScript 的基本架構。
- **安裝並設定 Element Plus 與 axios**
- 在 `package.json` 中加入 `element-plus` 與 `axios` 依賴（若尚未安裝）。
- 在 `src/main.ts` 匯入 Element Plus 及其樣式，使用 `app.use(ElementPlus)` 全域註冊。
- 建立一個簡單的 axios 封裝（例如 `src/api/http.ts`），設定 baseURL（暫時用假 URL 或從環境變數讀取），方便之後統一呼叫 API。

### 2. 路由與頁面結構

- **新增攝影機設定頁路由**
- 在 `src/router/index.ts` 中新增一條路由，例如 `/cameras` 對應 `CameraTableView`。
- **建立頁面元件**
- 新增 `src/views/CameraTableView.vue`（或在 `App.vue` 中先做簡單版本，依你喜好）。
- 頁面大致包含：標題列、篩選區塊（搜尋框＋是否推播下拉）、表格區域、分頁器。

### 3. 表格 UI（Element Plus）

- **使用 `el-table` 建立欄位**
- 欄位：
    - `攝影機名稱`（可排序）
    - `是否推播`（顯示為開關或標籤，可排序 / 過濾）
    - `轉向時間`（例如秒數或時間字串，可排序）
    - `預置點`（文字或標籤）
- 依照暫定資料結構（例如 `id`, `name`, `pushEnabled`, `panTime`, `preset`）先行設計欄位對應。
- **加入排序與分頁**
- 使用 `el-table` 的排序屬性（`sortable`）與事件處理排序邏輯（前端排序為主）。
- 使用 `el-pagination` 控制當前頁碼與每頁筆數，搭配前端 slice 分頁邏輯。
- **加入篩選功能**
- 在表格上方加入一個輸入框（`el-input`）用來依名稱關鍵字搜尋。
- 加入是否推播的下拉選單或 Switch 過濾（例如 `全部 / 只顯示推播 / 只顯示不推播`）。
- 使用 computed property 根據搜尋關鍵字與推播狀態過濾資料，再送進表格與分頁邏輯。

### 4. API 介接與資料流

- **設計暫定 API 與資料結構**
- 定義前端的型別（例如 `CameraItem` 介面，欄位：`id`, `name`, `pushEnabled`, `panTime`, `preset`）。
- 在 `src/api/camera.ts` 中建立 `fetchCameras()` 函式，回傳 `Promise<CameraItem[]>`，先以 axios 向一個暫定 URL 要資料；若後端尚未完成，可先用 mock data 模擬。
- **在頁面中讀取資料**
- 在 `CameraTableView.vue` 的 `onMounted` 生命週期中呼叫 `fetchCameras()`，將結果存入 `cameras` 狀態。
- 加入載入中與錯誤狀態（例如顯示 loading spinner、錯誤訊息 `el-alert`）。

### 5. RWD 設計

- **版面與表格 RWD**
- 使用 flex 或簡單的 `el-row` / `el-col` 讓搜尋與過濾區在窄螢幕時能換行顯示。
- 調整表格容器寬度與 overflow，使在手機上可橫向捲動（如必要）。
- 對於較小螢幕，適度縮短欄位標題文字（例如以 tooltip 顯示完整說明）。

### 6. 基本程式碼結構示意（不直接修改檔案）

- **`main.ts`**：匯入 Element Plus 與全域樣式。
- **`router/index.ts`**：新增 `/cameras` 路由，指向 `CameraTableView`。
- **`api/http.ts`**：建立共用 axios instance。
- **`api/camera.ts`**：定義 `CameraItem` 型別與 `fetchCameras` 函式。
- **`views/CameraTableView.vue`**：
- template：搜尋區＋是否推播篩選＋表格＋分頁。
- script：狀態管理（原始資料、過濾條件、排序與分頁）、呼叫 API 的邏輯。
- style：簡單 RWD 佈局。

## 之後可擴充的方向（非本次必做）

- 加入每列的「編輯 / 儲存」按鈕，直接在表格中修改推播與預置點設定並回寫 API。
- 將查詢條件與分頁參數同步到 URL query，方便分享或重新整理保留狀態。