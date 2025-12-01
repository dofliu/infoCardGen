
# Instant Infographic Generator (AI 智能資訊圖表產生器)

一個基於 Google Gemini API 的現代化網頁應用程式，能夠將枯燥的文字或文件瞬間轉換為精美、結構化的資訊圖表 (Infographic)、海報或專業簡報。

---

## 📚 使用者手冊 (User Manual)

### 1. 快速開始 (Quick Start)

1.  **輸入內容**: 在首頁文字框中貼上您想要轉換的文字，或是點擊上方虛線區域上傳文件（支援 PDF, Word, Excel, PPT）。您也可以輸入網址，讓 AI 自動讀取網頁內容。
2.  **選擇模式 (Select Mode)**:
    *   **標準排版 (Standard Layout)**: 產生 HTML 結構的互動式圖表，可編輯文字、更換圖示，適合網頁瀏覽或匯出 PDF。
    *   **AI 全圖繪製 (AI Full Image)**: 使用 Gemini Image Generation 模型直接繪製一張完整的海報 (PNG)，視覺效果最強，但文字無法直接編輯。
    *   **AI 簡報生成 (AI Presentation)**: 自動規劃 6-12 頁的簡報結構，並可匯出為原生可編輯的 PowerPoint (.pptx) 檔案。
3.  **選擇風格 (Select Style)**: 點擊「專業」、「漫畫」、「數位」等按鈕切換風格。
4.  **產生**: 點擊底部的產生按鈕，等待約 10-30 秒即可看到結果。

### 2. 進階功能 (Advanced Features)

#### ✨ 無限風格實驗室 (Infinite Style Lab)
選擇 **"自訂 Custom"** 風格後，您可以輸入任何形容詞來創造獨一無二的視覺風格。
*   *範例*: "Cyberpunk Neon 賽博龐克", "Vintage 1950s Poster 復古海報", "Paper Cutout 剪紙藝術", "Studio Ghibli Anime 吉卜力動畫"。

#### 🖌️ 個人品牌設定 (Personal Branding)
點擊右上角的 **"設定 (Settings)"** 按鈕：
*   **固定頁尾**: 設定如「國立勤益科技大學 劉瑞弘老師團隊」的簽名檔，將自動出現在所有產出的底部。
*   **品牌色**: 鎖定學校或企業的標準色 (CIS)，覆蓋 AI 的預設配色。
*   **專屬語氣**: 指定 AI 使用「學術專業」、「親切幽默」或「條列式」的語氣撰寫文案。

#### 🪄 魔術棒工具 (Magic Tools) - 僅限標準排版
在產出結果頁面，點擊導覽列的 **"魔術棒"**：
*   **翻譯 (Translate)**: 一鍵將內容翻譯成英文、日文或西班牙文，保留排版。
*   **改寫 (Remix)**: 自動精簡內容 (Summarize) 或擴充細節 (Expand)。

#### 🖼️ AI 簡報模式 (Presentation Mode)
此模式專為製作 Slide Deck 設計：
*   **自動排版**: AI 會根據內容決定版型（封面、大圖、條列、數據）。
*   **複雜圖表**: 若內容包含複雜的表格或流程圖，AI 會自動生成圖解圖片 (`diagram_image`)。
*   **修改 (Refine)**: 在預覽模式下，點擊下方的 **"✨ AI 修改此頁"**，輸入指令（如：「把這張圖換成流程圖」、「增加一點說明」），AI 會重新生成該頁投影片。
*   **匯出 PPT**: 點擊右上角 **"PPT"** 按鈕，下載原生 .pptx 檔。

### 3. 匯出與分享 (Export & Share)

*   **PDF**: 將標準排版匯出為高解析度 PDF 文件。
*   **PPT**: 將標準排版或簡報模式匯出為可編輯的 PowerPoint 檔案。
*   **Social Kit**: 點擊 **"Social"** 按鈕，AI 會自動幫您撰寫適合 Instagram, LinkedIn, Facebook 的貼文文案。

### 4. 常見問題 (FAQ)

*   **Q: 上傳 PPT 檔案效果不好？**
    *   A: 建議先將 PPT 轉存為 PDF 後再上傳，AI 對 PDF 的讀取能力最強。
*   **Q: 全圖繪製的文字可以修改嗎？**
    *   A: 全圖模式產生的是點陣圖 (PNG)，無法直接編輯文字。請使用下方的 **"修正圖片 (Refine)"** 按鈕，輸入指令讓 AI 重畫一張。
*   **Q: 歷史紀錄會保存多久？**
    *   A: 紀錄儲存在您的瀏覽器中 (LocalStorage)，最多保留 10 筆。若清除瀏覽器快取將會消失，建議定期使用 **"匯出專案 (Export)"** 進行備份。

---

## 🛠 技術堆疊 (Tech Stack)

*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **AI Provider**: Google Gemini API (`gemini-2.5-flash`, `gemini-3-pro-image-preview`)
*   **Libraries**: `pptxgenjs` (PPT Export), `html2canvas`, `jspdf`, `framer-motion`

