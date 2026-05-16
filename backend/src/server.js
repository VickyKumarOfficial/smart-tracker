import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

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

app.get('/api/ai/chats', asyncHandler(async (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    return res.status(400).json({ error: 'user_id is required.' });
  }

  const chats = await loadAiChatsForUser(userId);
  return res.json({ chats });
}));

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

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('price, making_cost')
    .eq('user_id', userId);

  if (productsError) {
    return res.status(400).json({ error: productsError.message });
  }

  const totals = (transactions || []).reduce(
    (acc, tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.payment_status === 'pending' || tx.payment_status === 'overdue') {
        acc.due_amount += amount;
        acc.due_count += 1;
      }
      return acc;
    },
    {
      total_profit:
        (products || []).reduce((sum, product) => sum + (Number(product.price) || 0), 0) -
        (products || []).reduce((sum, product) => sum + (Number(product.making_cost) || 0), 0),
      total_expenses: (products || []).reduce((sum, product) => sum + (Number(product.making_cost) || 0), 0),
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

// ── NVIDIA Nemotron AI Chat Endpoint ──────────────────────────────────────────
const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

/**
 * System prompt — instructs the model to act as a dedicated artisan business
 * advisor. Primary focus: product/inventory/finance analysis + actionable
 * suggestions specific to the artisan's trade. General assistance is secondary
 * and should only be offered when the user explicitly asks.
 */
const ARTISAN_SYSTEM_PROMPT = `You are SmartTracker AI, an expert business advisor embedded inside SmartTracker — a financial and inventory management application built exclusively for artisans and small craft-based businesses (potters, jewellers, woodworkers, textile makers, leatherworkers, metalworkers, candle makers, soap makers, and all other trades).

## Your Primary Mission
Help artisans grow their business, improve profitability, and manage their craft enterprise more effectively. Always lead with specific, actionable advice tied directly to what the user tells you about their products, inventory, expenses, and sales.

## Response Priority (strict order)
1. **Business & Product Advice (PRIMARY)** — Analyse product data, pricing, margins, material costs, inventory levels, and sales trends that the user shares. Provide concrete recommendations:
   - Pricing strategies tailored to the artisan's craft niche
   - Profit margin optimisation and cost reduction ideas
   - Inventory management and reorder suggestions
   - Cash flow and payment collection tips
   - Identifying best-selling vs slow-moving products
   - Seasonal demand patterns for their craft type
   - Supplier sourcing and material cost negotiation
   - Upselling, bundling, or product-line expansion ideas
2. **General Assistance (SECONDARY)** — Answer general questions (drafting emails, explaining business terms, writing descriptions, etc.) only when the user explicitly asks for something outside of business analysis.

## Behaviour Rules
- **Always ask clarifying questions** if the user's query is vague — e.g. "Which product are you referring to?" or "What is the material cost for this item?"
- **Use numbers wherever possible.** If the user gives you data, calculate margins, profits, or breakeven points.
- **Be concise and practical.** Artisans are busy makers — avoid long preambles. Lead with the answer.
- **Be craft-aware.** Understand that artisans deal with handmade variability, seasonal demand, commission work, material spoilage, and pricing challenges unique to handmade goods.
- **Never make up financial data.** If the user hasn't provided data, ask for it before giving specific figures.
- **Format responses clearly** using short paragraphs, bullet points, or numbered steps where appropriate.
- If asked something entirely unrelated to their business or craft, gently redirect: "That's a bit outside my specialty — I'm best at helping with your artisan business. But here's a quick answer…"

## Tone
Professional but warm, like a knowledgeable mentor who understands the artisan's world. Respect the craft. Never condescending.`;

const AI_CHAT_MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';

const toChatTitle = (text) => {
  const value = (text || '').trim();
  if (!value) {
    return 'New chat';
  }
  return value.length > 42 ? `${value.slice(0, 42)}…` : value;
};

const toChatPreview = (text) => {
  const value = (text || '').trim();
  if (!value) {
    return '…';
  }
  return value.length > 65 ? `${value.slice(0, 65)}…` : value;
};

const buildTranscriptMessage = (role, content, reasoning = '') => ({
  id: crypto.randomUUID(),
  role,
  content,
  reasoning,
});

const loadAiChatsForUser = async (userId) => {
  const { data, error } = await supabase
    .from('ai_chats')
    .select('*')
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((chat) => ({
    id: chat.id,
    title: chat.title,
    preview: chat.preview,
    time: new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    last_message_at: chat.last_message_at,
    messages: Array.isArray(chat.messages) ? chat.messages : [],
  }));
};

app.post('/api/ai/chat', asyncHandler(async (req, res) => {
  const { messages, user_id: userId, chat_id: chatId } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' });
  }

  if (!process.env.NVIDIA_API_KEY) {
    return res.status(500).json({ error: 'NVIDIA_API_KEY is not configured on the server.' });
  }

  // Set up Server-Sent Events headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Prepend the system prompt — strip any existing system message from the
  // client to prevent prompt injection overrides.
  const userMessages = messages.filter((m) => m.role !== 'system');
  const userMessage = userMessages.find((message) => message.role === 'user') || userMessages[0] || null;
  const userMessageText = userMessage?.content || '';
  const messagesWithSystem = [
    { role: 'system', content: ARTISAN_SYSTEM_PROMPT },
    ...userMessages,
  ];

  const persistChat = Boolean(userId);
  let currentChatId = chatId || null;
  let existingMessages = [];

  if (persistChat) {
    if (currentChatId) {
      const { data: chatRow, error: chatError } = await supabase
        .from('ai_chats')
        .select('*')
        .eq('id', currentChatId)
        .eq('user_id', userId)
        .single();

      if (chatError) {
        return res.status(404).json({ error: 'Chat not found.' });
      }

      existingMessages = Array.isArray(chatRow.messages) ? chatRow.messages : [];
    } else {
      const { data: createdChat, error: createError } = await supabase
        .from('ai_chats')
        .insert({
          user_id: userId,
          title: toChatTitle(userMessageText),
          preview: toChatPreview(userMessageText),
          messages: [],
          model: AI_CHAT_MODEL,
          status: 'active',
          last_message_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (createError) {
        return res.status(400).json({ error: createError.message });
      }

      currentChatId = createdChat.id;
      sendEvent({ type: 'chat_created', chat_id: currentChatId });
    }
  }

  let accContent = '';
  let accReasoning = '';

  try {
    const completion = await nvidiaClient.chat.completions.create({
      model: AI_CHAT_MODEL,
      messages: messagesWithSystem,
      temperature: 0.6,
      top_p: 0.95,
      max_tokens: 65536,
      reasoning_budget: 16384,
      chat_template_kwargs: { enable_thinking: true },
      stream: true,
    });

    for await (const chunk of completion) {
      const reasoning = chunk.choices[0]?.delta?.reasoning_content;
      const content = chunk.choices[0]?.delta?.content;
      const finishReason = chunk.choices[0]?.finish_reason;

      if (reasoning) {
        accReasoning += reasoning;
        sendEvent({ type: 'reasoning', text: reasoning });
      }
      if (content) {
        accContent += content;
        sendEvent({ type: 'content', text: content });
      }
      if (finishReason === 'stop') {
        sendEvent({ type: 'done' });
      }
    }

    if (persistChat && currentChatId) {
      const updatedMessages = [
        ...existingMessages,
        buildTranscriptMessage('user', userMessageText),
        buildTranscriptMessage('assistant', accContent, accReasoning),
      ];

      await supabase
        .from('ai_chats')
        .update({
          messages: updatedMessages,
          preview: toChatPreview(accContent || userMessageText),
          status: 'completed',
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentChatId)
        .eq('user_id', userId);
    }
  } catch (err) {
    console.error('NVIDIA API error:', err?.message || err);
    sendEvent({ type: 'error', message: err?.message || 'Unknown AI error.' });

    if (persistChat && currentChatId) {
      const updatedMessages = [
        ...existingMessages,
        buildTranscriptMessage('user', userMessageText),
        buildTranscriptMessage('assistant', accContent || `⚠️ ${err?.message || 'Unknown AI error.'}`, accReasoning),
      ];

      await supabase
        .from('ai_chats')
        .update({
          messages: updatedMessages,
          preview: toChatPreview(accContent || err?.message || userMessageText),
          status: 'failed',
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentChatId)
        .eq('user_id', userId);
    }
  } finally {
    res.end();
  }
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
