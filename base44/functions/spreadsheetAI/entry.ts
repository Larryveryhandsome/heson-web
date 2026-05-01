import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SPREADSHEET_ID = '1AgmwQLTTtslxU8Fn5GNdF9IjDAf4ih7ea5zmCUbuWWs';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { message, bookings } = await req.json();

    // 準備本地資料摘要
    const bookingSummary = bookings.length > 0
      ? bookings.map((b, i) => {
          return `[${i + 1}] ID:${b.id} | ${b.client_name || '無'} | ${b.service_type || '無'} | ${b.scheduled_date || '無'} | 狀態:${b.status || '無'}`;
        }).join('\n')
      : '目前無本地資料';

    // 簡單版：嘗試讀取 Google Sheet 的基本信息
    let sheetInfo = 'Google Sheet 資料（讀取中...）';
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlesheets');
      const accessToken = conn.accessToken;
      
      // 只讀取 sheet 名稱和列數，不讀取全部數據
      const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets(properties(title,sheetId),data(rowData(values(userEnteredValue))))`;
      const metaRes = await fetch(metaUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        const sheets = metaData.sheets || [];
        const sheetTitles = sheets.map(s => s.properties?.title).join(', ');
        const rowCounts = sheets.map(s => s.data?.[0]?.rowData?.length || 0).join(', ');
        sheetInfo = `Google Sheet 包含 ${sheets.length} 個工作表：${sheetTitles}，各表列數：${rowCounts}`;
      }
    } catch (err) {
      console.error('Google Sheets 讀取失敗:', err.message);
      sheetInfo = 'Google Sheet 暫時無法讀取';
    }

    const systemPrompt = `你是赫頌家事管理系統的 AI 助理。用戶在內部試算表管理工具中與你對話。

【本地 Booking 資料（共 ${bookings.length} 筆）】
${bookingSummary}

【Google Sheet 資訊】
${sheetInfo}

【重要指令】
用戶可能要求你修改或填寫資料。如果用戶明確要求修改某筆資料，你應該在回應的最後加上以下格式的指令（用 JSON）：

\`\`\`json
{
  "mutations": [
    {
      "id": "booking_id",
      "fields": {
        "field_name": "new_value"
      }
    }
  ]
}
\`\`\`

例如，如果要把 ID 為 "abc123" 的狀態改成「已確認」：
\`\`\`json
{
  "mutations": [
    {
      "id": "abc123",
      "fields": {
        "status": "已確認"
      }
    }
  ]
}
\`\`\`

【你的角色】
- 回答用戶的任何問題
- 幫助分析或搜尋數據
- 當用戶要求修改時，解析要求並在回應中附加修改指令（JSON）
- 用繁體中文、友善且專業的語氣回覆

用戶訊息：${message}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt,
      model: 'gemini_3_flash'
    });

    // 嘗試從 LLM 回應中提取 JSON 指令
    const reply = result;
    let mutations = [];

    try {
      const jsonMatch = reply.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const parsed = JSON.parse(jsonStr);
        if (parsed.mutations && Array.isArray(parsed.mutations)) {
          mutations = parsed.mutations;
          console.log('Parsed mutations:', mutations);

          // 執行修改
          const conn = await base44.asServiceRole.connectors.getConnection('googlesheets');
          const accessToken = conn.accessToken;

          for (const m of mutations) {
            if (m.id && m.fields) {
              // 更新本地 Booking
              await base44.entities.Booking.update(m.id, m.fields);
              console.log('Updated booking:', m.id, m.fields);

              // 同時更新 Google Sheet
              const booking = bookings.find(b => b.id === m.id);
              if (booking) {
                // 找到 booking 在列表中的行號（+2 因為 Sheet 有表頭和編號列）
                const rowIndex = bookings.indexOf(booking) + 2;
                const updates = [];

                // 對應欄位與 Google Sheet 欄位的映射
                const fieldToCol = {
                  'client_name': 'D',      // 姓名
                  'service_type': 'M',     // 想要的時長×次數/訂閱制
                  'scheduled_date': 'Q',   // 預計開始日期
                  'time_slot': 'R',        // 偏好時段
                  'status': 'K',           // 目前狀態
                  'address': 'F',          // 需要服務地址
                  'cleaner_name': 'B',     // 清潔人員
                  'notes': 'P'             // 特殊需求/備注
                };

                // 準備 Google Sheet 更新
                for (const [field, value] of Object.entries(m.fields)) {
                  const col = fieldToCol[field];
                  if (col) {
                    const cell = `表單回應 1!${col}${rowIndex}`;
                    updates.push({ range: cell, values: [[value]] });
                  }
                }

                // 執行 Google Sheet 批量更新
                if (updates.length > 0) {
                  try {
                    for (const update of updates) {
                      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(update.range)}?valueInputOption=USER_ENTERED`;
                      const res = await fetch(url, {
                        method: 'PUT',
                        headers: {
                          'Authorization': `Bearer ${accessToken}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ values: update.values })
                      });
                      if (!res.ok) {
                        console.error('Failed to update Google Sheet:', update.range, res.status);
                      } else {
                        console.log('Updated Google Sheet:', update.range);
                      }
                    }
                  } catch (err) {
                    console.error('Google Sheet update error:', err.message);
                  }
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.log('No mutations found or JSON parse error:', err.message);
    }

    // 清理回應中的 JSON 塊（用戶不需要看到）
    const cleanReply = reply.replace(/```json\n?([\s\S]*?)\n?```/g, '').trim();

    return Response.json({
      reply: cleanReply,
      mutations: mutations.length > 0 ? mutations : undefined,
      success: true
    });
  } catch (err) {
    console.error('Function error:', err.message);
    return Response.json({
      reply: '❌ 發生錯誤，請稍後再試。',
      success: false
    }, { status: 500 });
  }
});