# System Architecture

## 1. High-Level Overview

本專案採用 **Client-Side Rendering (CSR)** 架構，直接在瀏覽器端透過 API Key 與 Google Gemini 服務進行溝通。這確保了部署的簡易性與回應速度。

```mermaid
graph TD
    User[User / Browser] -->|Upload File / Input Text| App
    App -->|File Parsing (Mammoth/XLSX)| ContentProcessor
    App -->|Prompt Request| GeminiService
    GeminiService -->|API Call| GoogleGemini[Google Gemini API]
    GoogleGemini -->|JSON Response| GeminiService
    GeminiService -->|InfographicData| App
    App -->|Render Data| InfographicView
    InfographicView -->|Style Config| CSS/Tailwind
    User -->|Edit Request| EditModal
    EditModal -->|Refine Prompt| GeminiService
```

## 2. 核心模組 (Core Modules)

### A. 數據處理層 (`App.tsx` & File Parsers)
*   **職責**: 處理使用者輸入與檔案上傳。
*   **邏輯**:
    *   判斷檔案類型。
    *   若是 DOCX/XLSX，在前端解析為純文字。
    *   若是 PDF，保留 Base64 格式，直接傳送給 Gemini (Multimodal capability)。

### B. AI 服務層 (`services/geminiService.ts`)
這是系統的大腦，包含三個主要功能：

1.  **結構化生成 (`generateInfographic`)**:
    *   使用 `gemini-2.5-flash`。
    *   配置 `responseSchema` 以確保回傳穩定的 JSON 格式 (`InfographicData`)。
    *   包含排版判斷邏輯 (Layout Decision)。
    
2.  **圖像生成 (`generateSectionImage` & `generateFullInfographicImage`)**:
    *   使用 `gemini-2.5-flash-image` 進行局部插圖繪製。
    *   使用 `gemini-3-pro-image-preview` 進行全頁海報生成。
    *   **Style Injection**: 根據使用者選擇的風格 (e.g., Watercolor)，在 Prompt 後端動態附加對應的藝術風格描述詞。

3.  **內容修正 (`refineInfographicSection`)**:
    *   接收當前區塊內容與使用者指令。
    *   回傳修正後的 JSON 片段並更新 State。

### C. 視圖渲染層 (`components/InfographicView.tsx`)
*   **動態樣式系統**: 使用 TypeScript Object 定義不同風格 (`styles` config)，控制 Tailwind CSS Class。
*   **佈局引擎**: 根據 `data.layout` ('grid' | 'timeline' | 'process') 條件渲染不同的 DOM 結構。
    *   **Timeline**: 左右交錯排列，中間貫穿時間線。
    *   **Process**: 垂直流程圖，帶有箭頭連接。
    *   **Grid**: 響應式網格卡片。

## 3. Data Structure (`types.ts`)

核心資料結構 `InfographicData` 驅動整個 UI：

```typescript
interface InfographicData {
  mainTitle: string;
  subtitle: string;
  layout: 'grid' | 'timeline' | 'process'; // 決定渲染佈局
  style: 'professional' | 'comic' | ...;   // 決定配色與 CSS
  themeColor: string;
  sections: Array<{
    title: string;
    content: string;
    iconType: string;
    imageUrl?: string; // AI 生成的插圖 URL
  }>;
  statistics: Array<{ value: string; label: string }>;
  conclusion: string;
}
```

## 4. 未來擴充考量

*   **PDF 解析優化**: 目前依賴 Gemini 直接讀取 PDF。若遇到極大檔案，可能需要在前端引入 `pdf.js` 先行提取文字以節省 Token 或進行預處理。
*   **狀態管理**: 目前使用 React Local State (`useState`)。若功能變複雜（如多頁編輯），可考慮引入 Context API 或 Redux。
