import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { spreadsheet_id } = body;

    if (!spreadsheet_id) {
      return Response.json({ error: 'Missing spreadsheet_id' }, { status: 400 });
    }

    // 獲取 Google Sheets 訪問令牌
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // 讀取整個表格資料
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/'清潔預約'!A:X`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return Response.json({
        success: false,
        error: `Sheet API error: ${error.error?.message || 'Unknown error'}`
      }, { status: 500 });
    }

    const data = await response.json();
    const allValues = data.values || [];

    // 第一行是表頭
    const headers = allValues[0] || [];
    // 從第二行開始是實際資料
    const rows = allValues.slice(1);

    return Response.json({
      success: true,
      headers: headers,
      rows: rows,
      totalRows: rows.length
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});