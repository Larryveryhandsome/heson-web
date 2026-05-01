import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SPREADSHEET_ID = '1lQc70QbKE0U_BvG7LNa_iR9AymWzO4y5g4SkDo0LtHY';
const SHEET_NAME = '排班表';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const schedules = await base44.entities.PartTimeSchedule.list('-date', 1000);

    if (schedules.length === 0) {
      return Response.json({ success: true, synced: 0, message: '沒有排班資料' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // 先確保工作表存在，若不存在則建立
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets(properties(title))`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (metaRes.ok) {
      const metaData = await metaRes.json();
      const sheetExists = metaData.sheets?.some(s => s.properties?.title === SHEET_NAME);
      if (!sheetExists) {
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: SHEET_NAME } } }]
          })
        });
      }
    }

    // 標題列
    const header = [['日期', '時段', '工讀生姓名', '工作地點', '工作類型', '狀態', '備註', '建立時間']];

    // 資料列
    const rows = schedules.map(s => [
      s.date || '',
      s.time_slot || '',
      s.worker_name || '',
      s.location || '',
      s.work_type || '',
      s.status || '',
      s.notes || '',
      s.created_date || ''
    ]);

    const values = [...header, ...rows];
    const range = `${SHEET_NAME}!A1:H${values.length}`;

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
      return Response.json({ error: 'Failed to sync', details: error }, { status: 500 });
    }

    const result = await response.json();
    return Response.json({
      success: true,
      synced: schedules.length,
      updatedCells: result.updatedCells,
      message: `已同步 ${schedules.length} 筆排班到 Google Sheet`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});