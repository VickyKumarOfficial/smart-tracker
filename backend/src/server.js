import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const AVATAR_BUCKET = 'avatars';
let avatarBucketReady = false;

const isGoogleAvatarUrl = (value) => {
  if (!value) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.hostname.endsWith('googleusercontent.com');
  } catch {
    return false;
  }
};

const isHostedAvatarUrl = (value) => {
  if (!value) {
    return false;
  }
  return value.startsWith(`${SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/`);
};

const getAvatarExtension = (contentType) => {
  if (!contentType) {
    return 'jpg';
  }
  const normalized = contentType.toLowerCase();
  if (normalized.includes('png')) {
    return 'png';
  }
  if (normalized.includes('webp')) {
    return 'webp';
  }
  if (normalized.includes('gif')) {
    return 'gif';
  }
  return 'jpg';
};

const ensureAvatarBucket = async () => {
  if (avatarBucketReady) {
    return;
  }

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    throw error;
  }

  const existing = (buckets || []).find((bucket) => bucket.name === AVATAR_BUCKET);
  if (!existing) {
    const { error: createError } = await supabase.storage.createBucket(AVATAR_BUCKET, { public: true });
    if (createError) {
      throw createError;
    }
  } else if (!existing.public) {
    const { error: updateError } = await supabase.storage.updateBucket(AVATAR_BUCKET, { public: true });
    if (updateError) {
      throw updateError;
    }
  }

  avatarBucketReady = true;
};

const resolveAvatarUrl = async (avatarUrl, userId) => {
  if (!avatarUrl || !userId) {
    return avatarUrl;
  }
  if (isHostedAvatarUrl(avatarUrl) || !isGoogleAvatarUrl(avatarUrl)) {
    return avatarUrl;
  }

  try {
    await ensureAvatarBucket();

    const response = await fetch(avatarUrl);
    if (!response.ok) {
      throw new Error(`Avatar download failed (${response.status}).`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = getAvatarExtension(contentType);
    const filePath = `${userId}.${extension}`;
    const buffer = Buffer.from(await response.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, buffer, { contentType, upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
    return data?.publicUrl || avatarUrl;
  } catch (error) {
    console.warn('Avatar rehost failed:', error?.message || error);
    return avatarUrl;
  }
};

app.use(cors());
app.use(express.json());

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.post('/api/users', asyncHandler(async (req, res) => {
  const { id, email, name, dob, vendor_name, field_of_work, location, avatar_url } = req.body || {};

  if (!email || !name || !dob || !Array.isArray(field_of_work) || field_of_work.length === 0 || !location) {
    return res.status(400).json({ error: 'Missing required user fields.' });
  }

  const resolvedAvatarUrl = id
    ? await resolveAvatarUrl(avatar_url, id)
    : avatar_url;

  const payload = {
    email,
    name,
    dob,
    vendor_name,
    field_of_work,
    location,
    avatar_url: resolvedAvatarUrl,
  };
  if (id) {
    payload.id = id;
  }

  const conflictTarget = id ? 'id' : 'email';
  const { data, error } = await supabase
    .from('users')
    .upsert(payload, { onConflict: conflictTarget })
    .select('*')
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json(data);
}));

app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    const status = error.code === 'PGRST116'
      ? 404
      : (typeof error.status === 'number' ? error.status : 500);
    return res.status(status).json({ error: error.message });
  }

  return res.json(data);
}));

app.post('/api/users/:id/avatar', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { avatar_url } = req.body || {};

  if (!id || !avatar_url) {
    return res.status(400).json({ error: 'Missing avatar_url.' });
  }

  const resolvedAvatarUrl = await resolveAvatarUrl(avatar_url, id);

  const { data, error } = await supabase
    .from('users')
    .update({ avatar_url: resolvedAvatarUrl })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json(data);
}));

app.post('/api/products', asyncHandler(async (req, res) => {
  const { user_id, name, type, quantity, price, making_cost, transaction_date, due_date, status, image_url } = req.body || {};

  if (!user_id || !name) {
    return res.status(400).json({ error: 'Missing required product fields.' });
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      user_id,
      name,
      type,
      quantity: quantity ?? 1,
      price: price ?? 0,
      making_cost: making_cost ?? 0,
      transaction_date: transaction_date ?? null,
      due_date: due_date ?? null,
      status: status ?? 'not_sold',
      image_url,
    })
    .select('*')
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json(data);
}));

app.get('/api/products', asyncHandler(async (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    return res.status(400).json({ error: 'user_id is required.' });
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json(data);
}));

app.delete('/api/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.query.user_id || req.body?.user_id;

  if (!id || !userId) {
    return res.status(400).json({ error: 'product id and user_id are required.' });
  }

  const { error: transactionsError } = await supabase
    .from('transactions')
    .delete()
    .eq('product_id', id)
    .eq('user_id', userId);

  if (transactionsError) {
    return res.status(400).json({ error: transactionsError.message });
  }

  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }

  return res.json({ id: data.id });
}));

app.post('/api/transactions', asyncHandler(async (req, res) => {
  const { user_id, product_id, amount, payment_status, transaction_date, due_date } = req.body || {};

  if (!user_id || !product_id || !amount || !transaction_date) {
    return res.status(400).json({ error: 'Missing required transaction fields.' });
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id,
      product_id,
      amount,
      payment_status: payment_status ?? 'pending',
      transaction_date,
      due_date,
    })
    .select('*')
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json(data);
}));

app.get('/api/transactions', asyncHandler(async (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    return res.status(400).json({ error: 'user_id is required.' });
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json(data);
}));

app.delete('/api/transactions/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.query.user_id || req.body?.user_id;

  if (!id || !userId) {
    return res.status(400).json({ error: 'transaction id and user_id are required.' });
  }

  const { data, error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }

  return res.json({ id: data.id });
}));

app.get('/api/dashboard', asyncHandler(async (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    return res.status(400).json({ error: 'user_id is required.' });
  }

  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('amount, payment_status')
    .eq('user_id', userId);

  if (transactionsError) {
    return res.status(400).json({ error: transactionsError.message });
  }

  const totals = (transactions || []).reduce(
    (acc, tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.payment_status === 'completed') {
        acc.total_profit += amount;
      }
      if (tx.payment_status === 'pending' || tx.payment_status === 'overdue') {
        acc.due_amount += amount;
        acc.due_count += 1;
      }
      return acc;
    },
    {
      total_profit: 0,
      total_expenses: 0,
      due_amount: 0,
      due_count: 0,
    }
  );

  const { data: recentTransactions, error: recentError } = await supabase
    .from('transactions')
    .select('id, amount, payment_status, transaction_date, created_at, products(name)')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .limit(4);

  if (recentError) {
    return res.status(400).json({ error: recentError.message });
  }

  const { data: catalogHistory, error: catalogError } = await supabase
    .from('products')
    .select('id, name, type, quantity, price, making_cost, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(4);

  if (catalogError) {
    return res.status(400).json({ error: catalogError.message });
  }

  const recent = (recentTransactions || []).map((tx) => ({
    id: tx.id,
    amount: tx.amount,
    status: tx.payment_status,
    date: tx.transaction_date,
    time: tx.created_at,
    product: tx.products?.name ?? null,
  }));

  const catalog = (catalogHistory || []).map((entry) => ({
    id: entry.id,
    name: entry.name,
    material: entry.type,
    quantity: entry.quantity,
    price: entry.price,
    making_cost: entry.making_cost,
    created_at: entry.created_at,
  }));

  return res.json({
    total_profit: totals.total_profit,
    total_expenses: totals.total_expenses,
    due_amount: totals.due_amount,
    due_count: totals.due_count,
    recent_transactions: recent,
    catalog_history: catalog,
  });
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
