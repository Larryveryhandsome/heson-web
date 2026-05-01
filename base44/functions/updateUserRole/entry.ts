import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, role } = await req.json();
    
    // Get user details to get email
    const targetUser = await base44.asServiceRole.entities.User.filter({ id: userId });
    const userEmail = targetUser?.[0]?.email;
    
    // Update role
    await base44.asServiceRole.entities.User.update(userId, { role });
    
    // If role is "banned", automatically ban all associated devices
    if (role === 'banned' && userEmail) {
      const allDevices = await base44.asServiceRole.entities.BannedDevice.list();
      const matched = (allDevices || []).filter(d => (d.associated_emails || []).includes(userEmail));
      if (matched.length === 0) {
        await base44.asServiceRole.entities.BannedDevice.create({
          fingerprint: 'email:' + userEmail,
          reason: '帳號狀態為封禁',
          banned_by: user.email,
          user_agent: '',
          is_active: true,
          notes: '',
          associated_emails: [userEmail],
        });
      } else {
        for (const d of matched) {
          await base44.asServiceRole.entities.BannedDevice.update(d.id, {
            is_active: true,
            reason: '帳號狀態為封禁',
            banned_by: user.email,
          });
        }
      }
    }
    
    // If role is NOT "banned", deactivate all bans for this email
    if (role !== 'banned' && userEmail) {
      const allDevices = await base44.asServiceRole.entities.BannedDevice.list();
      const matched = (allDevices || []).filter(d => (d.associated_emails || []).includes(userEmail));
      for (const d of matched) {
        await base44.asServiceRole.entities.BannedDevice.update(d.id, { is_active: false });
      }
    }
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});