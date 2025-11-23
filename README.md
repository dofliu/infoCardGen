# Instant Infographic Generator (AI 智能資訊圖表產生器)

一個基於 Google Gemini API 的現代化網頁應用程式，能夠將枯燥的文字或文件瞬間轉換為精美、結構化的資訊圖表 (Infographic)。

## ✨ 主要功能 (Key Features)

*   **多格式檔案支援**:
    *   支援上傳 **PDF, Word (.docx), Excel (.xlsx), CSV, TXT** 等文件。
    *   自動提取文件內容並進行 AI 分析。
*   **智慧排版 (Smart Layouts)**:
    *   AI 自動判斷內容適合的呈現方式：**時間軸 (Timeline)**、**流程圖 (Process)** 或 **網格排列 (Grid)**。
*   **多種視覺風格 (Visual Styles)**:
    *   一鍵切換風格：**專業 (Professional)**、**漫畫 (Comic)**、**數位 (Digital)**、**水彩 (Watercolor)**、**極簡 (Minimalist)**。
*   **AI 插圖生成**:
    *   內建 Gemini Image Generation，根據內文自動繪製配圖。
    *   提供 **AI 全圖繪製模式 (Banana Pro)**，直接生成單張高解析度海報。
*   **即時編輯與修正**:
    *   點擊任何文字區塊即可透過 AI 進行語意重寫（例如：「改得更有趣一點」、「精簡文字」）。
*   **匯出功能**:
    *   支援匯出為 **PDF** 文件。
    *   全圖模式下支援下載 **PNG**。

## 🛠 技術堆疊 (Tech Stack)

*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **AI Provider**: Google Gemini API (`gemini-2.5-flash`, `gemini-2.5-flash-image`, `gemini-3-pro-image-preview`)
*   **File Processing**:
    *   `mammoth.js` (Word docx parsing)
    *   `xlsx` (Excel/CSV parsing)
    *   `html2canvas` & `jspdf` (PDF Export)
*   **Icons**: Lucide React

## 🚀 快速開始 (Getting Started)

1.  確認您擁有 Google AI Studio 的 API Key。
2.  開啟應用程式。
3.  在文字框輸入內容，或點擊上傳按鈕選擇文件。
4.  選擇您喜歡的視覺風格。
5.  點擊「產生資訊圖表」。

## 📂 文件結構說明

*   `index.tsx`: 應用程式入口點。
*   `App.tsx`: 主要應用程式邏輯與狀態管理。
*   `services/geminiService.ts`: 與 Google Gemini API 溝通的核心服務層 (包含 Prompt Engineering)。
*   `components/InfographicView.tsx`: 負責將結構化數據渲染為視覺圖表的組件。
*   `gemini.md`: 專案開發規劃與 AI 整合細節文檔。
