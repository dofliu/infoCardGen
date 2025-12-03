
# Gemini Infographic Generator - Project Roadmap & AI Integration

## 專案概述 (Project Overview)
本專案利用 Google Gemini 模型的強大理解與生成能力，將非結構化的文本或文件（PDF, Word, Excel, CSV）轉換為結構化的視覺資訊圖表 (Infographic)、海報或專業簡報。

## 目前 AI 功能 (Current AI Capabilities)

### 1. 多模態內容分析 (Multimodal Content Analysis)
*   **模型**: `gemini-2.5-flash`
*   **輸入**:
    *   **純文字**: 使用者直接輸入。
    *   **文件**: 
        *   **PDF**: 支援 Native Gemini File API (轉為 base64 inlineData 傳送)。
        *   **Word (.docx)**: 前端解析文字後傳送。
        *   **Excel/CSV**: 前端解析表格數據後傳送。
        *   **PPT**: 目前建議轉為 PDF 後上傳以獲得最佳效果。
*   **輸出**: 嚴格定義的 JSON Schema，包含標題、摘要、統計數據、圖表數據 (Charts) 以及適合的佈局結構 (Grid/Timeline/Process/Comparison)。

### 2. 視覺風格與圖像生成 (Visual Style & Image Generation)
*   **模型**: 
    *   `gemini-2.5-flash-image`: 快速生成插圖 (免費/標準)。
    *   `gemini-3-pro-image-preview`: 高畫質全圖生成、複雜圖解繪製 (需付費 Key)。
*   **插圖生成**:
    *   針對資訊圖表中的關鍵區塊，AI 會自動撰寫英文 Prompt。
    *   **圖解生成 (`diagram_image`)**: 在簡報模式中，針對複雜的流程圖、表格、系統架構圖，AI 會自動選擇此版型並生成詳細 Prompt，直接繪製成圖。
*   **無限風格實驗室 (Infinite Style Lab)**:
    *   使用者可輸入任意風格描述（如「賽博龐克」），AI 自動轉換為對應的圖像生成 Prompt 與配色。
*   **全圖生成 (Banana Pro)**:
    *   直接將內容轉換為單張高解析度 (2K) 的海報圖片，適合社群分享。
    *   **版面控制**: 支援直式 (3:4)、橫式 (16:9) 與方形 (1:1) 輸出。
    *   **指令修正 (Refine)**: 支援基於對話指令的圖片重繪（如「把標題改紅色」、「背景換成星空」）。

### 3. 智慧排版引擎 (Intelligent Layout Engine)
*   AI 根據內容語意決定最佳排版：
    *   **Timeline**: 偵測到年份、歷史、演變過程。
    *   **Process**: 偵測到步驟、SOP、階段性任務。
    *   **Grid**: 一般性的特點列舉。
    *   **Comparison**: 偵測到「優缺點」、「前後對比」、「產品比較」。
*   **響應式佈局控制**:
    *   支援橫式簡報、方形社群貼文等不同比例的 CSS 網格調整。

### 4. 資料視覺化 (Data Visualization)
*   **SVG Charts**: 輕量級 SVG 圖表組件。
    *   **Bar Chart**: 適合數值比較。
    *   **Pie Chart**: 適合比例分佈。

---

## 既有功能優化 (Existing Feature Optimizations) - [完成]

### Phase 3 品牌增強：Logo 支援 (Brand Logo Support) - [完成]
*   **功能**: 在個人品牌設定中，允許上傳學校或企業的 Logo (PNG/JPG)。
*   **應用**:
    *   **Info View**: 在頁尾簽名旁顯示 Logo。
    *   **PDF/PPT**: 自動將 Logo 嵌入到匯出的文件中（封面及內頁）。

### Phase 2 圖表增強：數據編輯器 (Chart Data Editor) - [完成]
*   **功能**: 點擊圖表時跳出微型試算表，允許手動修正 AI 生成的錯誤數據，包含數值、標籤與顏色的編輯。

### Phase 12 簡報增強：投影片排序器 (Slide Sorter) - [完成]
*   **功能**: 在簡報預覽中提供網格視圖 (Grid View)，支援直覺的拖放排序 (Drag & Drop) 來調整投影片順序。

### Phase 6 歷史紀錄增強：視覺化縮圖 (Visual History)
*   **規劃中**: 儲存專案時生成縮圖，讓歷史紀錄更直覺。

---

## 待開發項目與規劃 (Roadmap & Future Development)

### 第一階段：增強文件處理能力 (Phase 1: Enhanced Document Processing) - [完成]
- [x] **Native PPT 解析**: 研究是否透過後端或更強的前端庫直接解析 PPT 結構，而非僅依賴文字提取。
- [x] **多檔案分析**: 允許一次上傳多個文件，讓 AI 進行綜合歸納。
- [x] **長文件處理**: 針對超過 Token 限制的超長文件，實作「分段摘要後整合 (Map-Reduce)」的策略。

### 第二階段：更豐富的視覺組件 (Phase 2: Richer Visual Components) - [完成]
- [x] **互動式圖表**: 實作輕量級 SVG Bar/Pie Chart，不依賴重型 Chart library。
- [x] **更多排版模式**:
    -   **Comparison (對照表)**: 左右兩欄對比 (Before/After, 優點/缺點)。
- [x] **字體與配色自訂**: 開放使用者手動微調 Primary Color。
- [x] **數據編輯器**: 手動修正圖表數據。

### 第三階段：個人品牌與客製化 (Phase 3: Personal Branding & Customization) - [完成]
- [x] **品牌識別鎖定 (Brand Locking)**:
    -   **固定頁尾/浮水印**: 允許使用者設定固定的 Footer 文字（如：「國立勤益科技大學 劉瑞弘老師團隊」）與 Logo。
    -   **品牌色票 (Brand Colors)**: 強制鎖定 Primary/Secondary Colors，覆蓋 AI 的建議，確保視覺識別一致。
- [x] **個人化語氣 (Tone of Voice)**:
    -   設定預設 Prompt 後綴（如：「使用大學教授的口吻」、「活潑的社群小編語氣」）。
- [x] **設定記憶 (Config Persistence)**: 使用 `localStorage` 記錄使用者的品牌設定，無需每次重新輸入。
- [x] **Logo 支援**: 上傳並顯示品牌 Logo。

### 第四階段：無限風格與排版控制 (Phase 4: Infinite Styles & Layout Control) - [完成]
- [x] **無限風格實驗室 (AI Style Lab)**:
    -   **開放式 Prompt**: 允許使用者輸入風格關鍵字（如「賽博龐克」、「富春山居圖水墨風」），Gemini 動態生成 Image Prompt 與配色方案。
    -   **特定畫風模擬**: 支援 UI 預設細分風格（如：美式漫畫 vs 日式漫畫、像素藝術、低多邊形）。

### 第五階段：進階排版控制 (Phase 5: Advanced Layout Control) - [完成]
- [x] **多比例輸出**:
    -   **橫式 (16:9)**: 適合 PPT 簡報或電腦觀看。
    -   **方形 (1:1)**: 適合 Instagram 或社群媒體。
    -   **直式 (3:4)**: 適合行動裝置與海報 (預設)。

### 第六階段：社群與協作 (Phase 6: Community & Collaboration) - [完成]
- [x] **歷史紀錄 (History Time Machine)**: 將生成的結果自動存入 LocalStorage，提供側邊欄檢視與一鍵還原。
- [x] **專案匯出/匯入 (Project Export/Import)**: 產生 JSON 專案檔，支援跨裝置協作與備份。

### 第七階段：格式解放 (Phase 7: Format Liberation) - [完成]
- [x] **PowerPoint 原生匯出 (Native PPTX)**:
    -   使用 `pptxgenjs` 將 AI 生成的內容轉換為真正的可編輯投影片。
    -   支援標題、內文、統計數據頁面與原生圖表 (Chart) 轉換。
    -   自動套用品牌色與頁尾署名。

### 第八階段：內容魔術師 (Phase 8: Content Alchemist) - [完成]
- [x] **圖示自選器 (Icon Picker)**:
    -   允許使用者點擊圖示並從清單中更換為更精準的圖示。
- [x] **多語言一鍵翻新 (Global Translate)**:
    -   一鍵將所有內容翻譯為英文、日文、西班牙文等，但保留排版與圖片。
- [x] **長度伸縮 (Content Remix)**:
    -   AI 自動「精簡摘要」或「擴充詳述」現有內容。

### 第九階段：動態視效與影音化 (Phase 9: Motion & Video) - [完成]
- [x] **一鍵動畫化 (Animate It)**:
    -   使用 `framer-motion` 為各區塊加入進場動畫（淡入、滑動）。
    -   支援切換動畫開關。

### 第十階段：自由排版 (Phase 10: Layout Freedom) - [完成]
- [x] **拖放排序 (Drag & Drop)**:
    -   使用 `framer-motion` 的 `Reorder` 組件，允許使用者直覺地拖曳調整區塊順序。
    -   支援 Grid, Timeline, Process 等不同佈局的即時重排。

### 第十一階段：社群行銷套件 (Phase 11: Social Media Kit) - [完成]
- [x] **AI 貼文生成 (Caption Generator)**:
    -   根據圖表內容，自動生成 Instagram (多 Hashtag)、LinkedIn (專業)、Twitter (精簡) 的貼文文案。
    -   一鍵複製發布。

### 第十二階段：AI 簡報生成器 (Phase 12: Presentation Generator) - [完成]
- [x] **原生簡報模式 (Native Presentation Mode)**:
    -   由 Gemini 擔任簡報設計師，規劃 6-12 頁簡報結構。
    -   **圖解生成 (`diagram_image`)**: 針對複雜表格與流程圖，自動調用 AI 繪圖模型生成圖解。
    -   **單頁修正 (Refine Slide)**: 支援針對特定投影片進行 AI 內容修改或圖片重繪 (Re-generate Image Prompt)。
    -   自動生成**講者備忘錄 (Speaker Notes)**。
- [x] **瀏覽器預覽**: 提供類似 PowerPoint 的投影片瀏覽介面。
- [x] **原生 PPTX 匯出**: 將每一頁簡報精準轉換為 PowerPoint 投影片，包含圖解與備忘錄。
- [x] **投影片排序器**: 網格視圖與拖放排序。

### 未來規劃 (Future Roadmap)

#### Phase 13: 互動式微網站發布 (Interactive Microsite Export)
*   將目前的圖表打包成單一 HTML 檔，包含動畫與 RWD 效果，可直接上傳至教學平台 (LMS) 或個人網站。

#### Phase 14: 智慧語音導覽 (AI Voice Narration)
*   整合 TTS (Text-to-Speech)，自動朗讀 Speaker Notes，製作有聲簡報。

#### Phase 15: 深度數據洞察 (Deep Data Insights)
*   上傳 CSV/Excel 後，AI 自動撰寫數據洞察報告，並繪製更複雜的趨勢圖與相關性分析圖表。
