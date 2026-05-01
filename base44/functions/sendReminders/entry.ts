import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Calculate tomorrow's date in Asia/Taipei
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowStr = `${yyyy}-${mm}-${dd}`;

    // Find all confirmed bookings for tomorrow
    const bookings = await base44.asServiceRole.entities.Booking.filter({
      scheduled_date: tomorrowStr,
      status: '已確認',
    });

    let sent = 0;
    for (const booking of bookings) {
      // Try to get client email from User entity
      let clientEmail = null;
      if (booking.client_id && booking.client_id !== 'guest') {
        try {
          const users = await base44.asServiceRole.entities.User.filter({ id: booking.client_id });
          if (users.length > 0) clientEmail = users[0].email;
        } catch {}
      }

      if (clientEmail) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: clientEmail,
          subject: `【HESON 赫頌】明日服務提醒 - ${booking.time_slot}`,
          body: `親愛的 ${booking.client_name || '客戶'} 您好，

溫馨提醒您，明天（${tomorrowStr}）HESON 赫頌的清潔服務即將到來！

📅 服務日期：${tomorrowStr}
⏰ 服務時段：${booking.time_slot}
🏠 服務地址：${booking.address || '（請確認地址）'}
🧹 服務類型：${booking.service_type}
${booking.cleaner_name ? `👩 服務管理師：${booking.cleaner_name}` : ''}

請提前確保服務地點可正常進入，如有任何疑問請聯繫：
📞 客服電話：0906-991-023
💬 LINE：@heson

感謝您選擇 HESON 赫頌家事管理，期待為您帶來整潔舒適的居家環境！

HESON 赫頌家事管理`,
        });
        sent++;
      }

      // Also send admin summary email for all tomorrow's bookings
    }

    // Send admin daily summary
    if (bookings.length > 0) {
      const list = bookings.map(b =>
        `• ${b.client_name || '未知客戶'} - ${b.time_slot} - ${b.address || '無地址'} - ${b.service_type}${b.cleaner_name ? ` [${b.cleaner_name}]` : ' [未派單]'}`
      ).join('\n');

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'larry87tw@gmail.com',
        subject: `【HESON】明日服務排程彙整 (${tomorrowStr})`,
        body: `您好，以下是明天（${tomorrowStr}）的服務排程：\n\n${list}\n\n共 ${bookings.length} 筆預約，已成功發送 ${sent} 封客戶提醒信。\n\nHESON 赫頌系統自動通知`,
      });
    }

    return Response.json({
      success: true,
      date: tomorrowStr,
      bookings_found: bookings.length,
      reminders_sent: sent,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});