import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { fingerprint, userEmail, userAgent } = await req.json();

    if (!fingerprint) {
      return Response.json({ banned: false });
    }

    // Check if device is banned (service role to bypass RLS)
    const banned = await base44.asServiceRole.entities.BannedDevice.filter({
      fingerprint,
      is_active: true,
    });

    if (banned && banned.length > 0) {
      const record = banned[0];
      // If user email not already in associated_emails, add it and ban the account
      if (userEmail && !(record.associated_emails || []).includes(userEmail)) {
        const updated = [...(record.associated_emails || []), userEmail];
        await base44.asServiceRole.entities.BannedDevice.update(record.id, {
          associated_emails: updated,
        });
        // Auto-ban the account when detected from banned device
        try {
          await base44.asServiceRole.entities.User.update(userEmail, { role: 'banned' });
        } catch {
          // Ignore if user doesn't exist
        }
      }
      return Response.json({ banned: true, reason: record.reason || '此裝置已被封禁' });
    }

    // CRITICAL: Check if the email is associated with any active banned device
    // This prevents bypass via private browsing, incognito, or new tabs with same email
    if (userEmail) {
      const allBannedDevices = await base44.asServiceRole.entities.BannedDevice.filter({
        is_active: true,
      });
      
      for (const device of allBannedDevices) {
        if ((device.associated_emails || []).includes(userEmail)) {
          // Email is linked to a banned device — register this new device fingerprint too
          const existingRecord = await base44.asServiceRole.entities.BannedDevice.filter({ fingerprint });
          if (existingRecord && existingRecord.length === 0) {
            // This is a new device being used with a banned email — record it
            await base44.asServiceRole.entities.BannedDevice.create({
              fingerprint,
              reason: device.reason || '帳號關聯之新設備',
              banned_by: device.banned_by || 'system',
              user_agent: userAgent || '',
              is_active: true,
              associated_emails: [userEmail],
            });
          }
          return Response.json({ banned: true, reason: device.reason || '此帳號已被封禁' });
        }
      }
    }

    // Device not banned — register/update the device fingerprint log if user is logged in
    if (userEmail) {
      // Find any existing record for this fingerprint (even inactive) to track emails
      const existing = await base44.asServiceRole.entities.BannedDevice.filter({ fingerprint });
      if (existing && existing.length > 0) {
        const record = existing[0];
        if (!(record.associated_emails || []).includes(userEmail)) {
          await base44.asServiceRole.entities.BannedDevice.update(record.id, {
            associated_emails: [...(record.associated_emails || []), userEmail],
            user_agent: userAgent || record.user_agent,
          });
        }
      }
      // No else — we only create BannedDevice records when admin manually bans
    }

    return Response.json({ banned: false });
  } catch (error) {
    // On error, don't block the user
    return Response.json({ banned: false });
  }
});