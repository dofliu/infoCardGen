
# Instant Infographic Generator (AI 智能資訊圖表產生器)

一個基於 Google Gemini API 的現代化網頁應用程式，能夠將枯燥的文字或文件瞬間轉換為精美、結構化的資訊圖表 (Infographic)。

## ✨ 主要功能 (Key Features)

*   **多格式檔案支援**:
    *   支援上傳 **PDF, Word (.docx), Excel (.xlsx), CSV, TXT** 等文件。
    *   自動提取文件內容並進行 AI 分析。
*   **智慧排版 (Smart Layouts)**:
    *   AI 自動判斷內容適合的呈現方式：**時間軸 (Timeline)**、**流程圖 (Process)**、**網格排列 (Grid)** 或 **對照比較 (Comparison)**。
*   **多種視覺風格 (Visual Styles)**:
    *   一鍵切換風格：**專業 (Professional)**、**漫畫 (Comic)**、**數位 (Digital)**、**水彩 (Watercolor)**、**極簡 (Minimalist)**。
*   **AI 插圖生成**:
    *   內建 Gemini Image Generation，根據內文自動繪製配圖。
    *   提供 **AI 全圖繪製模式 (Banana Pro)**，直接生成單張高解析度海報。
*   **資料視覺化**:
    *   自動將數據轉換為 **長條圖 (Bar Charts)** 或 **圓餅圖 (Pie Charts)**。
*   **即時編輯與修正**:
    *   點擊任何文字區塊即可透過 AI 進行語意重寫（例如：「改得更有趣一點」、「精簡文字」）。
*   **匯出功能**:
    *   支援匯出為 **PDF** 文件 (圖片格式)。
    *   支援匯出為 **PowerPoint (PPTX)** 投影片 (可編輯格式)。
    *   全圖模式下支援下載 **PNG**。

## 🛠 技術堆疊 (Tech Stack)

*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **AI Provider**: Google Gemini API (`gemini-2.5-flash`, `gemini-2.5-flash-image`, `gemini-3-pro-image-preview`)
*   **File Processing**:
    *   `mammoth.js` (Word docx parsing)
    *   `xlsx` (Excel/CSV parsing)
    *   `pptxgenjs` (PowerPoint export)
    *   `html2canvas` & `jspdf` (PDF Export)
*   **Icons**: Lucide React

## 🚀 快速開始 (Getting Started)

1.  確認您擁有 Google AI Studio 的 API Key。
2.  開啟應用程式。
3.  在文字框輸入內容，或點擊上傳按鈕選擇文件。
4.  選擇您喜歡的視覺風格。
5.  點擊「產生資訊圖表」。

## 🔮 未來展望 (Future Roadmap)

我們致力於將此專案打造為專業的生產力平台，未來的開發重點包括：

### 1. 個人品牌套件 (Personal Branding Kit)
*   **固定頁尾與浮水印**: 可設定如「國立勤益科技大學 劉瑞弘老師團隊」的固定署名。
*   **品牌色票鎖定**: 企業或學校可鎖定專屬色系 (CIS)，確保產出一致性。

### 2. 無限風格實驗室 (Infinite Style Lab)
*   **開放式風格 Prompt**: 輸入「賽博龐克」或「宮崎駿風」，AI 自動生成對應的視覺風格。
*   **細緻畫風模擬**: 支援更多元的藝術流派與漫畫風格。

### 3. 進階排版控制 (Advanced Layout)
*   支援 **橫式 (PPT)**、**直式 (海報)** 與 **方形 (IG)** 等多種比例輸出。

## 📂 文件結構說明

*   `index.tsx`: 應用程式入口點。
*   `App.tsx`: 主要應用程式邏輯與狀態管理。
*   `services/geminiService.ts`: 與 Google Gemini API 溝通的核心服務層 (包含 Prompt Engineering)。
*   `components/InfographicView.tsx`: 負責將結構化數據渲染為視覺圖表的組件。
*   `components/Charts.tsx`: SVG 圖表渲染組件。
*   `utils/pptExporter.ts`: PowerPoint 生成邏輯。
*   `gemini.md`: 專案開發規劃與 AI 整合細節文檔。