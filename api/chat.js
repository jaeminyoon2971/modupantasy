export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed', deductCount: false });

  const { model, max_tokens, system, messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages 필드가 필요해요', deductCount: false });
  }

  try {
    // [1순위] Claude Haiku 시도
    try {
      const claudeRes = await callClaude(model, max_tokens, system, messages);
      return res.status(200).json({ ...claudeRes, provider: 'claude' });
    } catch (claudeErr) {
      console.error('[API Fallback] Claude 실패, GPT로 전환:', claudeErr.message);
    }

    // [2순위] GPT-4o mini 시도
    try {
      const gptRes = await callGPT(max_tokens, system, messages);
      return res.status(200).json({ ...gptRes, provider: 'gpt' });
    } catch (gptErr) {
      console.error('[API Fallback] GPT도 실패:', gptErr.message);
    }

    // [전부 실패] 친절한 에러 + 횟수 미차감
    return res.status(503).json({
      error: 'AI 서버가 일시적으로 불안정해요. 사용 횟수는 차감되지 않았어요 🙏',
      deductCount: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API Server Error]', error);
    return res.status(500).json({
      error: '서버 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
      deductCount: false,
    });
  }
}

/**
 * Claude API 호출
 */
async function callClaude(model, max_tokens, system, messages) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: max_tokens || 2000,
      ...(system ? { system } : {}),
      messages,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Claude: ${data.error?.message || JSON.stringify(data)}`);
  }

  return data;
}

/**
 * GPT-4o mini API 호출
 */
async function callGPT(max_tokens, system, messages) {
  // Claude 메시지 형식을 GPT 형식으로 변환
  const gptMessages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    ...messages.map(m => ({
      role: m.role, // "user" 또는 "assistant"
      content: m.content,
    })),
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
      max_tokens: max_tokens || 2000,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`GPT: ${data.error?.message || JSON.stringify(data)}`);
  }

  // GPT 응답을 Claude 응답 형식으로 변환
  return {
    content: [
      {
        type: 'text',
        text: data.choices[0].message.content,
      },
    ],
    usage: {
      input_tokens: data.usage.prompt_tokens,
      output_tokens: data.usage.completion_tokens,
    },
  };
}
