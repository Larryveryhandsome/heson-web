import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SHEET_ID = '1lQc70QbKE0U_BvG7LNa_iR9AymWzO4y5g4SkDo0LtHY';

// 服務類型 → 子工作表名稱對應（使用試算表實際名稱）
function resolveSheetName(serviceType) {
  const s = (serviceType || '').toLowerCase();

  if (s.includes('民宿') || s.includes('退租') || s.includes('空屋') || s.includes('旅宿')) {
    return 'H／民宿清潔';
  }
  if (s.includes('毛坯') || s.includes('新成屋') || s.includes('裝潢後')) {
    return 'P／毛坯案件';
  }
  if (s.includes('大掃除') || s.includes('細清') || s.includes('深層') || s.includes('精緻')) {
    return 'D／細清案件';
  }
  if (
    s.includes('定期') || s.includes('月護') || s.includes('月安') || s.includes('月綻') ||
    s.includes('基礎月') || s.includes('進階月') || s.includes('尊綻') ||
    s.includes('4次') || s.includes('8次') || s.includes('12次')
  ) {
    return 'R／定清案件';
  }
  // 預設：單次清潔 / 居家清潔
  return 'L／輕量案件';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, bookingData } = body;

    if (!bookingId || !bookingData) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // 決定目標子工作表
    const targetSheetName = resolveSheetName(bookingData.service_type);
    console.log(`Service type: "${bookingData.service_type}" → Sheet: "${targetSheetName}"`);

    // 取得 spreadsheet 所有 sheet 資訊，找到目標 sheet 的數字 ID
    const spreadsheetInfoRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (!spreadsheetInfoRes.ok) {
      const err = await spreadsheetInfoRes.text();
      throw new Error(`Failed to fetch spreadsheet info: ${err}`);
    }
    const spreadsheetInfo = await spreadsheetInfoRes.json();

    const allSheets = spreadsheetInfo.sheets || [];
    console.log('Available sheets:', allSheets.map(s => s.properties.title).join(', '));

    const targetSheet = allSheets.find(s => s.properties.title === targetSheetName);
    if (!targetSheet) {
      const available = allSheets.map(s => s.properties.title).join(', ');
      throw new Error(`Sheet "${targetSheetName}" not found. Available: ${available}`);
    }
    const sheetNumericId = targetSheet.properties.sheetId;
    console.log(`Found sheet "${targetSheetName}" with sheetId: ${sheetNumericId}`);

    // 組裝列資料（T欄）
    const rowValues = [
      '',                                         // A: 編號（手動）
      '',                                         // B: 清潔人員（手動派）
      '',                                         // C: 清掃時間（手動）
      bookingData.client_name || '',              // D: 姓名
      bookingData.phone || '',                    // E: 電話
      bookingData.service_area || bookingData.address || '', // F: 場勘區域
      bookingData.cleaning_tools || '',           // G: 掃具數設
      bookingData.address || '',                  // H: 服務地址
      bookingData.housing_type || '',             // I: 空間型態
      String(bookingData.square_footage || ''),   // J: 坪數
      bookingData.service_type || '',             // K: 服務類型
      bookingData.scheduled_date || '',           // L: 預計日期
      bookingData.time_slot || '',                // M: 時段
      (bookingData.enhance_areas || []).join ? (bookingData.enhance_areas || []).join(', ') : (bookingData.enhance_areas || ''), // N: 加強清潔
      (bookingData.preferred_weekdays || []).join ? (bookingData.preferred_weekdays || []).join(', ') : (bookingData.preferred_weekdays || ''), // O: 偏好星期
      bookingData.notes || '',                    // P: 備註
      bookingData.referral_source || '',          // Q: 得知來源
      bookingData.referrer || '',                 // R: 推薦人
      new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }), // S: 建立時間
      bookingId,                                  // T: 訂單ID
    ];

    // 使用 batchUpdate + appendCells（透過 sheetId 數字，不受中文名稱解析限制）
    const batchRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [{
            appendCells: {
              sheetId: sheetNumericId,
              rows: [{
                values: rowValues.map(v => ({
                  userEnteredValue: { stringValue: String(v) }
                }))
              }],
              fields: 'userEnteredValue'
            }
          }]
        })
      }
    );

    if (!batchRes.ok) {
      const errBody = await batchRes.json();
      throw new Error(`Sheets batchUpdate error: ${JSON.stringify(errBody)}`);
    }

    const batchData = await batchRes.json();
    console.log('Appended successfully to:', targetSheetName);

    // 記錄 log
    try {
      await base44.entities.GoogleSheetLog.create({
        spreadsheet_id: SHEET_ID,
        spreadsheet_name: '內部試算表',
        sheet_name: targetSheetName,
        operation_type: 'ai_fill',
        status: 'success',
        data_filled: {
          booking_id: bookingId,
          client_name: bookingData.client_name,
          service_type: bookingData.service_type,
          target_sheet: targetSheetName,
        },
        cells_affected: [],
        notes: `新訂單 append → ${targetSheetName}`,
      });
    } catch (logErr) {
      console.warn('Log failed (non-critical):', logErr);
    }

    return Response.json({
      success: true,
      target_sheet: targetSheetName,
      booking_id: bookingId,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});