import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: '需要管理員權限' }, { status: 403 });
  }

  const { bookingId, cleanerId } = await req.json();

  // 取得管理師資料
  const cleaners = await base44.asServiceRole.entities.CleanerProfile.filter({ id: cleanerId });
  const cleaner = cleaners[0];
  if (!cleaner) {
    return Response.json({ error: '找不到管理師' }, { status: 404 });
  }

  // 取得預約資料
  const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
  const booking = bookings[0];
  if (!booking) {
    return Response.json({ error: '找不到預約' }, { status: 404 });
  }

  // 更新預約：指派管理師、確認狀態
  await base44.asServiceRole.entities.Booking.update(bookingId, {
    cleaner_id: cleanerId,
    cleaner_name: cleaner.nickname,
    status: '已確認',
  });

  // 取得管理師對應 User Email（透過 user_id）
  let cleanerEmail = null;
  if (cleaner.user_id) {
    const users = await base44.asServiceRole.entities.User.filter({ id: cleaner.user_id });
    if (users[0]) cleanerEmail = users[0].email;
  }

  // 發送 Email 通知給管理師
  if (cleanerEmail) {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: cleanerEmail,
      subject: `【HESON 赫頌】您有新的派單任務`,
      body: `親愛的 ${cleaner.nickname} 管理師您好，\n\n您已被指派以下服務任務：\n\n` +
        `客戶姓名：${booking.client_name || '未知'}\n` +
        `服務類型：${booking.service_type}\n` +
        `服務日期：${booking.scheduled_date}\n` +
        `服務時段：${booking.time_slot}\n` +
        `服務地址：${booking.address || '未填'}\n\n` +
        `備註：${booking.notes || '無'}\n\n` +
        `請準時到達，如有疑問請聯繫管理員。\n\nHESON 赫頌家事管理平台 敬上`,
    });
  }

  // 同時通知管理員
  await base44.asServiceRole.integrations.Core.SendEmail({
    to: 'larry87tw@gmail.com',
    subject: `【HESON】派單完成通知 - ${booking.client_name}`,
    body: `派單已完成：\n\n客戶：${booking.client_name}\n指派管理師：${cleaner.nickname}\n服務日期：${booking.scheduled_date} ${booking.time_slot}\n服務地址：${booking.address}`,
  });

  return Response.json({
    success: true,
    message: `已指派 ${cleaner.nickname}，通知 Email 已發送`,
    cleanerEmail,
  });
});