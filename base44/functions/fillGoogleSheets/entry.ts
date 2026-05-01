import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { 
      spreadsheet_id, 
      spreadsheet_name,
      sheet_name = 'Sheet1',
      prompt,
      data_format,
      cells_to_fill 
    } = await req.json();

    if (!spreadsheet_id || !prompt) {
      return Response.json({ error: 'Missing spreadsheet_id or prompt' }, { status: 400 });
    }

    // 獲得 Google Sheets 連接器的 access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // 1. 調用 AI 根據格式要求生成資料
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `你是一個專業的資料格式化助手。根據以下要求填寫資料：\n\n${prompt}\n\n${data_format ? `資料格式要求：${data_format}` : ''}\n\n請返回 JSON 格式的資料，確保欄位名稱和內容符合要求。`,
      response_json_schema: {
        type: "object",
        properties: {
          data: { type: "object", description: "填寫的資料內容" },
          cellMapping: { 
            type: "object", 
            description: "儲存格對應，如 {A1: '名稱', B1: '值'}"
          }
        }
      }
    });

    const { data, cellMapping } = aiResponse;

    // 2. 將資料寫入 Google Sheets
    const updateRequest = {
      values: [Object.values(cellMapping || data)]
    };

    const rangeToUpdate = cells_to_fill || `${sheet_name}!A1`;

    const sheetsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${rangeToUpdate}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateRequest)
      }
    );

    if (!sheetsResponse.ok) {
      throw new Error(`Google Sheets API error: ${sheetsResponse.statusText}`);
    }

    const sheetsResult = await sheetsResponse.json();

    // 3. 記錄操作日誌（用於追蹤和復原）
    const logEntry = await base44.asServiceRole.entities.GoogleSheetLog.create({
      spreadsheet_id,
      spreadsheet_name,
      sheet_name,
      operation_type: 'ai_fill',
      data_filled: data,
      cells_affected: [rangeToUpdate],
      ai_prompt: prompt,
      ai_response: JSON.stringify(aiResponse),
      status: 'success',
      approval_required: true,
      notes: `AI 自動填寫 - 更新了 ${sheetsResult.updatedCells || 0} 個儲存格`
    });

    return Response.json({
      success: true,
      log_id: logEntry.id,
      spreadsheet_id,
      cells_updated: sheetsResult.updatedCells,
      data_filled: data,
      message: '資料已填寫到 Google 表格，請審核操作日誌'
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});