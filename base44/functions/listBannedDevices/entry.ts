import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const devices = await base44.asServiceRole.entities.BannedDevice.list('-created_date', 200);
    return Response.json({ devices });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});