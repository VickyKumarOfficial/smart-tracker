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

  const payload = {
    email,
    name,
    dob,
    vendor_name,
    field_of_work,
    location,
    avatar_url,
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

app.post('/api/products', asyncHandler(async (req, res) => {
  const { user_id, name, type, quantity, price, status, image_url } = req.body || {};

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
    .select('id, name, type, quantity, price, created_at')
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
