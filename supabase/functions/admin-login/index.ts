import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Yamato@123';
const ADMIN_EMAIL = 'admin@accmarket.vn';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const username = String(payload.username ?? '').trim().toLowerCase();
  const password = String(payload.password ?? '');

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return json({ error: 'INVALID_CREDENTIALS' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    return json({ error: 'BACKEND_NOT_CONFIGURED' }, 500);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    let userId: string | null = null;
    let page = 1;

    while (!userId && page <= 10) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      const users = data?.users ?? [];
      const found = users.find((u) => (u.email ?? '').toLowerCase() === ADMIN_EMAIL);
      if (found) {
        userId = found.id;
      }
      if (users.length < 200) break;
      page += 1;
    }

    if (!userId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Quản trị viên AccMarket' },
      });
      if (createError) {
        return json({ error: createError.message }, 400);
      }
      userId = created.user?.id ?? null;
    } else {
      await admin.auth.admin.updateUserById(userId, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
    }

    if (!userId) {
      return json({ error: 'ADMIN_ACCOUNT_FAILED' }, 500);
    }

    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: userId,
        email: ADMIN_EMAIL,
        full_name: 'Quản trị viên AccMarket',
        role: 'admin',
        is_active: true,
      },
      { onConflict: 'id' },
    );

    if (profileError) {
      return json({ error: profileError.message }, 400);
    }

    return json({ email: ADMIN_EMAIL, user_id: userId, role: 'admin' }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 500);
  }
});
