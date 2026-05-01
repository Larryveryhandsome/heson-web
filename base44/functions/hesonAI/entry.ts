const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

const SYSTEM_PROMPT = `你是「小赫」，HESON 赫頌家事管理平台的 AI 客服助理。
個性：親切、專業、有溫度，回覆簡潔（不超過150字）。
使用繁體中文回答。

【HESON 基本資訊】
- 公司：HESON 赫頌家事管理
- 地址：宜蘭縣羅東鎮中正南路131號5樓
- 電話：0906-991-023
- Email：service@heson.tw
- LINE：https://lin.ee/xKVxq7Y
- 服務時間：週一至週六 08:00–21:00

【服務項目與定價】
- 單次清潔：依坪數報價，起價 $2,000
- 基礎月護（4次/月）：$8,400/月
- 進階月安（8次/月）：$16,000/月
- 尊榮月恆（12次/月）：$24,600/月
- 家電清洗（冷氣/洗衣機/抽油煙機）：起價 $1,200
- 整理收納：起價 $1,800
- 辦公室/商業清潔：起價 $2,400

【常見問題】
- 預約方式：官網填表 → 客服確認 → 完成付款 → 管理師上門
- 首次預約：享85折優惠
- 服務人員：均通過良民證、身份證驗證，定期培訓
- 退款政策：24小時前取消可全額退費
- 有寵物：可接受，預約時請備註
- 服務區域：全台本島，宜蘭、雙北、台中、高雄為主

【智慧預約引導】
當客戶有預約意圖時，你需要逐步收集以下必填資訊（一次問一項，不要一次問全部）：
1. 姓名
2. 聯絡電話
3. 服務地址
4. 服務類型（單次清潔 / 基礎月護-4次 / 進階月安-8次 / 尊榮月恆-12次）
5. 希望服務日期（格式：YYYY-MM-DD，需為今天以後）
6. 希望時段（上午 08:00-12:00 / 下午 13:00-17:00 / 晚間 18:00-21:00）

【重要！預約資訊追蹤】
- 仔細查看對話歷史，不要重複要求已經提供的資訊
- 如果客戶輸入「早上」「上午」→ 對應「上午 08:00-12:00」
- 如果客戶輸入「下午」→ 對應「下午 13:00-17:00」
- 如果客戶輸入「晚上」「晚間」→ 對應「晚間 18:00-21:00」
- 只問尚未收集的資訊，不要重複提問

當你已收集到全部6項資訊後，請在回覆末尾加上以下 JSON 標記（不要換行，直接接在最後）：
<<<BOOKING_DATA:{"client_name":"姓名","phone":"電話","address":"地址","service_type":"服務類型","scheduled_date":"日期","time_slot":"時段"}>>>

超出知識範圍時，請引導客戶撥打電話或加LINE聯絡真人客服。`;

Deno.serve(async (req) => {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return Response.json({ error: '請輸入問題' }, { status: 400 });
    }

    // Build conversation context string
    const historyText = (history || []).slice(-8)
      .map(m => `${m.role === 'user' ? '客戶' : '小赫'}：${m.content}`)
      .join('\n');

    const result = await callClaude(SYSTEM_PROMPT, historyText ? `【對話記錄】\n${historyText}\n\n客戶：${message}` : `客戶：${message}`);
    let reply = result;
    let booking_data = null;

    // Extract booking data if AI collected all required fields
    const match = reply.match(/<<<BOOKING_DATA:(\{.*?\})>>>/);
    if (match) {
      try {
        booking_data = JSON.parse(match[1]);
        reply = reply.replace(/<<<BOOKING_DATA:\{.*?\}>>>/, '').trim();
      } catch (e) {
        // ignore parse error
      }
    }

    return Response.json({ reply, booking_data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});