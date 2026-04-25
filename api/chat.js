// 허용된 Origin 목록
const ALLOWED_ORIGINS = [
  'https://modupantasy.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

// 서버사이드 상한선
const MAX_TOKENS_LIMIT = 4500;
const MAX_MESSAGE_LENGTH = 20000; // 메시지 하나당 최대 글자수
const MAX_MESSAGES_COUNT = 30;    // 메시지 배열 최대 개수
const ALLOWED_MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-3-haiku-20240307',
  'claude-3-5-haiku-20241022',
];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  // CORS - 허용된 Origin만
  res.setHeader('Access-Control-Allow-Origin', isAllowedOrigin ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 허용되지 않은 Origin 차단
  if (!isAllowedOrigin) {
    return res.status(403).json({ error: '접근이 거부됐어요.', deductCount: false });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', deductCount: false });
  }

  const { model, max_tokens, system, messages } = req.body;

  // 입력 검증
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages 필드가 필요해요', deductCount: false });
  }
  if (messages.length > MAX_MESSAGES_COUNT) {
    return res.status(400).json({ error: '메시지 수가 너무 많아요', deductCount: false });
  }
  for (const m of messages) {
    if (!m || typeof m.content !== 'string') {
      return res.status(400).json({ error: '잘못된 메시지 형식이에요', deductCount: false });
    }
    if (m.content.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: '메시지가 너무 길어요', deductCount: false });
    }
    if (!['user', 'assistant'].includes(m.role)) {
      return res.status(400).json({ error: '잘못된 role 값이에요', deductCount: false });
    }
  }
  if (system && typeof system === 'string' && system.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: 'system 프롬프트가 너무 길어요', deductCount: false });
  }

  // 서버사이드에서 max_tokens 상한 강제 적용
  const safeMaxTokens = Math.min(Number(max_tokens) || 2000, MAX_TOKENS_LIMIT);

  // 모델 허용 목록 검증
  const safeModel = ALLOWED_MODELS.includes(model) ? model : 'claude-haiku-4-5-20251001';

  try {
    // [1순위] Claude Haiku 시도
    try {
      const claudeRes = await callClaude(safeModel, safeMaxTokens, system, messages);
      return res.status(200).json({ ...claudeRes, provider: 'claude' });
    } catch (claudeErr) {
      console.error('[API Fallback] Claude 실패, GPT로 전환');
    }

    // [2순위] GPT-4o mini 시도
    try {
      const gptRes = await callGPT(safeMaxTokens, system, messages);
      return res.status(200).json({ ...gptRes, provider: 'gpt' });
    } catch (gptErr) {
      console.error('[API Fallback] GPT도 실패');
    }

    return res.status(503).json({
      error: 'AI 서버가 일시적으로 불안정해요',
      deductCount: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API Server Error]', error.message);
    return res.status(500).json({
      error: '서버 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
      deductCount: false,
    });
  }
}

async function callClaude(model, max_tokens, system, messages) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens,
      ...(system ? { system } : {}),
      messages,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Claude: ${data.error?.message || 'API 오류'}`);
  }
  return data;
}

async function callGPT(max_tokens, system, messages) {
  const gptMessages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: gptMessages,
      max_tokens,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`GPT: ${data.error?.message || 'API 오류'}`);
  }

  return {
    content: [{ type: 'text', text: data.choices[0].message.content }],
    usage: {
      input_tokens: data.usage.prompt_tokens,
      output_tokens: data.usage.completion_tokens,
    },
  };
}
