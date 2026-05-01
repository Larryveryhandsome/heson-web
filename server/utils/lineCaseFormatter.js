/**
 * LINE 案件排班格式化
 * 將管理員貼上的案件清單，用 AI 整理成標準發布格式
 */

const { callClaudeCLI } = require('./claude');

const SYSTEM_PROMPT = `你是 HESON 赫頌家事管理的 LINE 排班助理。
管理員會貼上簡短的案件資訊，你必須整理成標準發布格式。

【標準格式範例】：
🌟最新案件總整理 @All

⚠️名額有限‼️招滿為止‼️

里奧東方｜民宿清潔
［需1人，缺1人］
📅 5/1(四)11:00
🏠 宜蘭縣礁溪鄉
📍 林尾路156-12號

⸻

森活慢慢｜民宿清潔
［需2人，缺2人］
📅 5/6(三)11:00
🏠 宜蘭縣冬山鄉
📍 寶慶二路129號

⸻

👇🏻接案需求請聯絡：
Line ➤ CONTACT_PLACEHOLDER

【規則】：
1. 每筆案件一個區塊，用 ⸻ 分隔
2. 案件名稱用｜分隔服務類型（民宿清潔/居家清潔/大掃除）
3. 如果有「私選」案件，格式改為：
   編號XX｜[服務類型]
   ［需X人，缺X人］
   📅 日期 時段
4. 日期換算星期幾（2026年：5/1=五, 5/6=三, 5/7=四，以此類推）
5. 地址/地點如不確定就省略 📍 那行
6. ［需X人，缺X人］：如果有寫人數就填，否則預設「需1人，缺1人」
7. 只輸出最終格式，不要解釋，不要加前言後語
8. 若是「私選」案件，統一標題改為 🌟最新私選案件 @All`;

async function formatCaseList(rawText, contact = '0906991023') {
  try {
    const prompt = rawText.trim();
    const system = SYSTEM_PROMPT.replace('CONTACT_PLACEHOLDER', contact);
    const { text } = await callClaudeCLI(system, prompt);
    return text.trim();
  } catch (err) {
    console.error('[lineCaseFormatter] AI 格式化失敗:', err.message);
    // Fallback：直接回傳原文加上提示
    return `⚠️ 格式化失敗，以下為原始內容：\n\n${rawText}`;
  }
}

module.exports = { formatCaseList };
