import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SPREADSHEET_ID = '1AgmwQLTTtslxU8Fn5GNdF9IjDAf4ih7ea5zmCUbuWWs';
const SHEET_NAME = 'H／民宿案件';

function mapBookingToSheetRow(booking, index) {
  return [
    index,                         // 編號
    booking.cleaner_name || '',    // 清潔人員
    '',                            // 目前進度
    booking.client_name || '',     // 姓名
    '',                            // 收款情況
    '',                            // 聯絡電話
    booking.address || '',         // 需要服務地址
    '',                            // 服務地區
    '',                            // 空間型態
    '',                            // 需求清潔坪數
    '',                            // 是否有寵物
    booking.status || '',          // 目前狀態
    booking.service_type || '',    // 想要的時長×次數/訂閱制
    '',                            // 現場掃具
    '',                            // 您想申請的服務類型
    '',                            // 加強清潔
    booking.notes || '',           // 特殊需求/備注
    booking.scheduled_date || '',  // 預計開始日期
    booking.time_slot || '',       // 偏好時段
    '',                            // 偏好的星期
    '',                            // 我已閱讀並同意
    '',                            // 您是從哪裡知道赫頌家事管理
    '',                            // 電子郵件地址
    booking.created_date || '',    // 時間戳記
  ];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // 使用 service role 讀取所有 Booking（自動化觸發時無登入用戶）
    const bookings = await base44.asServiceRole.entities.Booking.list('-created_date', 1000);

    if (bookings.length === 0) {
      return Response.json({ success: true, synced: 0, message: '沒有預約資料' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    const values = bookings.map((b, idx) => mapBookingToSheetRow(b, idx + 1));
    const range = `${SHEET_NAME}!A2:X${values.length + 1}`;

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return Response.json({ error: 'Failed to sync to Google Sheets', details: error }, { status: 500 });
    }

    const result = await response.json();

    return Response.json({
      success: true,
      synced: bookings.length,
      updatedCells: result.updatedCells,
      message: `已同步 ${bookings.length} 筆預約到 Google Sheet`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});