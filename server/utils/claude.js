// 智慧模型路由 + FAQ 靜態快取
// 雙模式：
//   1. 本機 Claude Code CLI（claude -p "..."）→ 不需 API Key
//   2. Anthropic API（ANTHROPIC_API_KEY）→ 網咖/無 CLI 環境備援

const { spawn } = require('child_process');
const https = require('https');

// ============================
// FAQ 靜態快取（0 token cost）
// ============================
const FAQ_CACHE = [
  {
    patterns: ['費用', '價格', '多少錢', '收費', '定價', '報價'],
    answer: `我們的服務定價如下：

💰 定期方案
• 基礎月護（4次/月）：$8,400
• 進階月安（8次/月）：$16,000
• 尊榮月恆（12次/月）：$24,600

✨ 單次服務
• 單次清潔：起價 $2,000（依坪數報價）
• 家電清洗：起價 $1,200
• 整理收納：起價 $1,800
• 辦公室清潔：起價 $2,400

首次預約享 85 折優惠！`,
  },
  {
    patterns: ['服務區域', '哪些地方', '服務哪裡', '可以去', '哪個縣市'],
    answer: '我們服務全台本島 22 縣市，以宜蘭、雙北、台中、高雄為主要重點服務區域。如需確認您所在地區是否可服務，歡迎聯絡客服！',
  },
  {
    patterns: ['退款', '取消', '退費', '取消政策'],
    answer: '服務前 24 小時取消可全額退費。如需取消，請聯絡：\n📞 0906-991-023\n💬 LINE：https://lin.ee/xKVxq7Y',
  },
  {
    patterns: ['電話', '聯絡', '客服', '怎麼聯繫', '聯絡方式'],
    answer: `歡迎透過以下方式聯絡我們：

📞 電話：0906-991-023
📧 Email：service@heson.tw
💬 LINE：https://lin.ee/xKVxq7Y
📍 地址：宜蘭縣羅東鎮中正南路131號5樓

服務時間：週一至週六 08:00-21:00`,
  },
  {
    patterns: ['服務時間', '幾點', '營業時間', '開放時間'],
    answer: '我們的服務時間為週一至週六 08:00-21:00。',
  },
  {
    patterns: ['寵物', '有貓', '有狗', '毛小孩', '貓咪', '狗狗'],
    answer: '我們完全接受有寵物的家庭！預約時請在備註說明寵物類型，我們會安排有寵物服務經驗的管理師。',
  },
  {
    patterns: ['良民證', '身份驗證', '安全', '信任', '審核'],
    answer: '所有服務人員都必須通過良民證審查及身份證驗證，並定期接受專業培訓。您可以放心讓我們的管理師進入您的家中！',
  },
  {
    patterns: ['首次', '第一次', '新客', '優惠', '折扣'],
    answer: '首次預約享 85 折優惠！歡迎體驗赫頌的專業服務，讓您的家煥然一新。',
  },
  {
    patterns: ['預約方式', '怎麼預約', '如何預約', '預約流程'],
    answer: `預約流程：

1️⃣ 官網或 AI 助理填寫預約表單
2️⃣ 客服確認時間（通常1小時內回覆）
3️⃣ 完成付款
4️⃣ 管理師準時上門服務

直接點「我要預約服務」，讓小赫引導您！`,
  },
  {
    patterns: ['公司', '赫頌', 'HESON', '關於'],
    answer: 'HESON 赫頌家事管理是專業居家清潔服務公司，服務全台本島。我們的管理師均通過嚴格審核，讓您享有安心、專業的服務體驗。',
  },
];

function checkFAQ(message) {
  const msg = message.toLowerCase();
  for (const faq of FAQ_CACHE) {
    if (faq.patterns.some((p) => msg.includes(p.toLowerCase()))) {
      return faq.answer;
    }
  }
  return null;
}

// ============================
// 模式偵測：有真實 API Key → 用 API；否則用 CLI
// ============================
function useApiMode() {
  const key = process.env.ANTHROPIC_API_KEY || '';
  return key.startsWith('sk-ant-') && !key.includes('xxxxx');
}

// ============================
// 模式 A：Anthropic API（網咖 / 無 CLI 環境）
// ============================
function callAnthropicAPI(systemPrompt, userMessage) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const tokens = (parsed.usage?.input_tokens || 0) + (parsed.usage?.output_tokens || 0);
            resolve({ text: parsed.content[0].text, model: 'claude-haiku-api', tokens });
          } else {
            reject(new Error(`API 錯誤 ${res.statusCode}: ${parsed.error?.message || data}`));
          }
        } catch (e) {
          reject(new Error(`解析回應失敗: ${e.message}`));
        }
      });
    });
    req.on('error', err => reject(new Error(`API 連線失敗：${err.message}`)));
    req.write(body);
    req.end();
  });
}

// ============================
// 模式 B：本機 Claude Code CLI（主機環境）
// ============================
function callClaudeCLI(systemPrompt, userMessage) {
  return new Promise((resolve, reject) => {
    const fullPrompt = `${systemPrompt}\n\nHuman: ${userMessage}\n\nAssistant:`;

    const proc = spawn('claude', ['-p', fullPrompt], {
      timeout: 60000,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.stdin.end();

    let output = '';
    let errOutput = '';

    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { errOutput += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0 && output.trim()) {
        resolve({ text: output.trim(), model: 'claude-cli', tokens: 0 });
      } else {
        reject(new Error(errOutput.trim() || `Claude CLI 執行失敗（exit: ${code}）`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`無法執行 claude CLI：${err.message}`));
    });
  });
}

// ============================
// 統一入口：自動選擇模式
// ============================
async function callClaude(systemPrompt, userMessage) {
  if (useApiMode()) {
    console.log('[AI] 使用 Anthropic API 模式');
    return callAnthropicAPI(systemPrompt, userMessage);
  }
  return callClaudeCLI(systemPrompt, userMessage);
}

// ============================
// 智慧路由：客服問答
// ============================
async function routeChat(system, message, historyText) {
  const faqAnswer = checkFAQ(message);
  if (faqAnswer) {
    return { reply: faqAnswer, model: 'FAQ快取', tokens: 0 };
  }

  const userMessage = historyText
    ? `【對話記錄】\n${historyText}\n\n客戶：${message}`
    : `客戶：${message}`;

  const result = await callClaude(system, userMessage);
  return { reply: result.text, model: result.model, tokens: result.tokens };
}

// ============================
// 智慧路由：試算表分析
// ============================
async function routeSpreadsheet(system, message) {
  const result = await callClaude(system, message);
  return { text: result.text, model: result.model, tokens: result.tokens };
}

module.exports = { checkFAQ, routeChat, routeSpreadsheet, callClaudeCLI, callClaude };
