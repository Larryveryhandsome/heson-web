import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json();
    const { event, data } = body;

    if (!data) return Response.json({ ok: true });

    const booking = data;

    // === 新預約建立通知 ===
    if (event?.type === 'create') {
      const details = `
客戶姓名：${booking.client_name || '未填'}
服務方案：${booking.service_type || '未填'}
預約日期：${booking.scheduled_date || '未填'}
服務時段：${booking.time_slot || '未填'}
服務地址：${booking.address || '未填'}
備註：${booking.notes || '無'}
      `.trim();

      // 通知管理員
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'larry87tw@gmail.com',
        subject: `🔔 新預約通知 - ${booking.client_name}`,
        body: `您好，有新預約已建立：\n\n${details}\n\n請登入後台確認並安排派工。`,
      });

      // 通知客戶（若非訪客）
      if (booking.client_id && booking.client_id !== 'guest') {
        const users = await base44.asServiceRole.entities.User.filter({ id: booking.client_id });
        if (users?.[0]?.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: users[0].email,
            subject: '✅ HESON 預約確認通知',
            body: `${users[0].full_name || '您'} 您好！\n\n您的預約已成功建立，以下是您的預約資訊：\n\n${details}\n\n我們的客服人員將於 24 小時內與您確認服務細節。如有疑問，請透過 LINE 官方帳號 (lin.ee/xKVxq7Y) 聯繫我們。\n\nHESON 家事管理 敬上`,
          });
        }
      }
    }

    // === 預約狀態變更通知 ===
    if (event?.type === 'update' && booking.client_id && booking.client_id !== 'guest') {
      const users = await base44.asServiceRole.entities.User.filter({ id: booking.client_id });
      if (users?.[0]?.email) {
        const statusMessages = {
          '已確認': `您的預約（${booking.scheduled_date} ${booking.time_slot}）已由管理員確認，屆時請準備好服務環境。`,
          '已完成': `您的服務（${booking.scheduled_date}）已完成！感謝您使用 HESON 家事管理，歡迎為此次服務進行評價。`,
          '已取消': `您的預約（${booking.scheduled_date} ${booking.time_slot}）已被取消。如有疑問請聯繫我們。`,
        };
        const msg = statusMessages[booking.status];
        if (msg) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: users[0].email,
            subject: `📋 HESON 預約狀態更新 - ${booking.status}`,
            body: `${users[0].full_name || '您'} 您好！\n\n${msg}\n\nHESON 家事管理 敬上`,
          });
        }
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});