import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

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

const PASSWORD = 'Yamato@123';
const VENDOR_EMAIL = 'doitac@yamatoshop.vn';
const VENDOR_NAME = 'Đối tác Test Yamato';
const VENDOR_STORE_CODE = 'Gian hàng #0192';
const BUYER_EMAIL = 'khachhang@yamatoshop.vn';
const BUYER_NAME = 'Khách Test Yamato';
const BUYER_BALANCE = 2000000;

const VENDOR_PRODUCTS = [
  {
    name: 'Via Facebook cổ 2016 - 2FA đầy đủ',
    category: 'facebook',
    basePrice: 185000,
    description:
      'Via Facebook cổ 2016, đã xác minh danh tính, có 2FA.\nBàn giao đầy đủ: user | pass | 2fa | mail gốc.\nBảo hành theo shop, đổi mới nếu lỗi đăng nhập.',
    image:
      'https://readdy.ai/api/search-image?width=800&height=600&seq=yamato-fb-01&orientation=landscape&query=clean minimalist product photo of a smartphone showing a social media profile screen, soft studio lighting, light warm gray background, premium ecommerce style',
    stock: [
      'fb2016.an01|Pass@2016|JBSWY3DPEHPK3PXP|mail.an01@gmail.com',
      'fb2016.binh02|Pass@2016|KRUGKIDROVUWG2ZAM|mail.binh02@gmail.com',
      'fb2016.chi03|Pass@2016|MZXW6YTBOI======|mail.chi03@gmail.com',
    ],
  },
  {
    name: 'Tài khoản TikTok Business Center',
    category: 'tiktok',
    basePrice: 320000,
    description:
      'Tài khoản TikTok Business Center đã xác minh, không giới hạn chiến dịch.\nPhù hợp chạy quảng cáo thị trường Việt Nam.\nBảo hành theo shop.',
    image:
      'https://readdy.ai/api/search-image?width=800&height=600&seq=yamato-tt-01&orientation=landscape&query=modern minimal flat lay of a tablet showing short video app interface, pastel neutral background, soft daylight, premium product photography',
    stock: [
      'tt.ads01|Tt@2026pass|ABCD1234EFGH|ads01@gmail.com',
      'tt.ads02|Tt@2026pass|IJKL5678MNOP|ads02@gmail.com',
    ],
  },
  {
    name: 'Gmail cổ 2019 - bảo mật 2 lớp',
    category: 'gmail',
    basePrice: 45000,
    description:
      'Gmail tạo 2019, đã bật xác minh 2 lớp, có số điện thoại khôi phục.\nBàn giao: user | pass | 2fa | mail khôi phục.\nSố lượng lớn, nhập kho liên tục.',
    image:
      'https://readdy.ai/api/search-image?width=800&height=600&seq=yamato-gm-01&orientation=landscape&query=minimal clean desk with laptop showing email inbox, bright neutral background, soft shadows, editorial product photography',
    stock: [
      'gmail.cu01@gmail.com|Gm@2019pass|QWER1234ASDF|backup01@gmail.com',
      'gmail.cu02@gmail.com|Gm@2019pass|ZXCV5678TYUI|backup02@gmail.com',
      'gmail.cu03@gmail.com|Gm@2019pass|POIU9012LKJH|backup03@gmail.com',
      'gmail.cu04@gmail.com|Gm@2019pass|MNBV3456CXZA|backup04@gmail.com',
    ],
  },
];

async function findUser(admin: any, email: string) {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const users = data?.users ?? [];
    const found = users.find((item: { email?: string | null }) => (item.email ?? '').toLowerCase() === email);
    if (found) return found;
    if (users.length < 200) break;
    page += 1;
  }
  return null;
}

async function ensureAccount(admin: any, email: string, fullName: string) {
  const existing = await findUser(admin, email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    return existing.id as string;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data?.user?.id) {
    throw new Error(error?.message ?? 'CREATE_USER_FAILED');
  }
  return data.user.id as string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) {
    return json({ error: 'BACKEND_NOT_CONFIGURED' }, 500);
  }

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return json({ error: 'NOT_AUTHENTICATED' }, 401);
  }

  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData?.user) {
    return json({ error: 'NOT_AUTHENTICATED' }, 401);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (!callerProfile || (callerProfile as { role?: string }).role !== 'admin') {
    return json({ error: 'NOT_ALLOWED' }, 403);
  }

  try {
    const vendorId = await ensureAccount(admin, VENDOR_EMAIL, VENDOR_NAME);
    const buyerId = await ensureAccount(admin, BUYER_EMAIL, BUYER_NAME);

    const { error: vendorError } = await admin.from('profiles').upsert(
      {
        id: vendorId,
        email: VENDOR_EMAIL,
        full_name: VENDOR_NAME,
        role: 'vendor',
        store_code: VENDOR_STORE_CODE,
        store_name: 'Yamato Test Store',
        shop_description:
          'Gian hàng thử nghiệm của Yamato Shop: cung cấp via Facebook, TikTok Business Center và Gmail cổ, bảo hành theo shop hoàn toàn miễn phí.',
        store_warranty_days: 7,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
    if (vendorError) throw new Error(vendorError.message);

    const { error: buyerError } = await admin.from('profiles').upsert(
      {
        id: buyerId,
        email: BUYER_EMAIL,
        full_name: BUYER_NAME,
        role: 'user',
        balance: BUYER_BALANCE,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
    if (buyerError) throw new Error(buyerError.message);

    const { count } = await admin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendorId);

    if (!count) {
      for (const item of VENDOR_PRODUCTS) {
        const { data: created, error: productError } = await admin
          .from('products')
          .insert({
            vendor_id: vendorId,
            vendor_code: VENDOR_STORE_CODE,
            name: item.name,
            category: item.category,
            description: item.description,
            image_url: item.image,
            base_price: item.basePrice,
            warranty_options: [{ label: 'Không bảo hành', days: 0, extra_price: 0 }],
            delivery_format: 'user | pass | 2fa | mail',
            delivery_time: 'Tự động 24/7',
            stock_count: item.stock.length,
            sold_count: 0,
            is_active: true,
          })
          .select('id')
          .maybeSingle();

        if (productError || !created) continue;

        await admin.from('product_stock').insert(
          item.stock.map((line) => ({ product_id: (created as { id: string }).id, account_data: line })),
        );
      }
    }

    return json(
      {
        vendor: { email: VENDOR_EMAIL, password: PASSWORD, role: 'vendor' },
        buyer: { email: BUYER_EMAIL, password: PASSWORD, role: 'user', balance: BUYER_BALANCE },
      },
      200,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 400);
  }
});
