# Gemini Infographic Generator - Project Roadmap & AI Integration

## 專案概述 (Project Overview)
本專案利用 Google Gemini 模型的強大理解與生成能力，將非結構化的文本或文件（PDF, Word, Excel, CSV）轉換為結構化的視覺資訊圖表 (Infographic)。

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
*   **模型**: `gemini-2.5-flash-image` (插圖), `gemini-3-pro-image-preview` (全圖)
*   **插圖生成**:
    *   針對資訊圖表中的關鍵區塊，AI 會自動撰寫英文 Prompt。
    *   根據選定的風格 (Professional, Comic, Digital, Watercolor, Minimalist) 自動調整繪圖指令。
*   **全圖生成 (Banana Pro)**:
    *   直接將內容轉換為單張高解析度 (2K) 的海報圖片，適合社群分享。

### 3. 智慧排版引擎 (Intelligent Layout Engine)
*   AI 根據內容語意決定最佳排版：
    *   **Timeline**: 偵測到年份、歷史、演變過程。
    *   **Process**: 偵測到步驟、SOP、階段性任務。
    *   **Grid**: 一般性的特點列舉。
    *   **Comparison (New)**: 偵測到「優缺點」、「前後對比」、「產品比較」。

### 4. 資料視覺化 (Data Visualization) (New)
*   **SVG Charts**: 輕量級 SVG 圖表組件。
    *   **Bar Chart**: 適合數值比較。
    *   **Pie Chart**: 適合比例分佈。

---

## 待開發項目與規劃 (Roadmap & Future Development)

### 第一階段：增強文件處理能力 (Phase 1: Enhanced Document Processing) - [完成]
- [x] **Native PPT 解析**: 研究是否透過後端或更強的前端庫直接解析 PPT 結構，而非僅依賴文字提取。
- [x] **多檔案分析**: 允許一次上傳多個文件，讓 AI 進行綜合歸納。
- [x] **長文件處理**: 針對超過 Token 限制的超長文件，實作「分段摘要後整合 (Map-Reduce)」的策略。

### 第二階段：更豐富的視覺組件 (Phase 2: Richer Visual Components) - [進行中]
- [x] **互動式圖表**: 實作輕量級 SVG Bar/Pie Chart，不依賴重型 Chart library。
- [x] **更多排版模式**:
    -   **Comparison (對照表)**: 左右兩欄對比 (Before/After, 優點/缺點)。
- [ ] **Pyramid (金字塔)**: 層級結構展示。
- [ ] **Mind Map (心智圖)**: 輻射狀結構。
- [x] **字體與配色自訂**: 開放使用者手動微調 Primary Color。

### 第三階段：社群與協作 (Phase 3: Community & Collaboration)
- [ ] **歷史紀錄**: 將生成的 JSON 存入 LocalStorage 或資料庫，讓使用者可以找回過去的作品。
- [ ] **分享功能**: 產生可分享的連結，讓他人檢視或基於該架構進行 Remix。

---

## AI Prompt Engineering 策略筆記

### 1. JSON 穩定性
為了確保前端渲染不崩潰，我們使用了 `responseSchema` 嚴格限制輸出格式。
*   **技巧**: 在 Prompt 中明確要求 "Output valid JSON" 並定義每個欄位的 enum (如 `iconType`)。

### 2. 繁體中文在地化
*   **挑戰**: Gemini 偶爾會輸出簡體中文。
*   **解法**: 在 System Instruction 與 User Prompt 中雙重強調「Traditional Chinese (Taiwan)」，並在 `refineInfographicSection` 中再次提醒。

### 3. 圖片生成的一致性
*   **挑戰**: 產生的插圖風格可能不統一。
*   **解法**: 建立 Style Dictionary (樣式字典)，將 "Comic", "Watercolor" 等關鍵字轉換為長串的具體藝術風格描述詞 (e.g., "halftone patterns, bold outlines")，強制附加在每個 Image Prompt 後方。