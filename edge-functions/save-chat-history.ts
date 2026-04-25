// 채팅 이력 저장
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function extractUserKey(req: Request): string | null {
  const authHeader = req.headers.get('authorization') || ''
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  return parts[1]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const userKey = extractUserKey(req)
    if (!userKey) {
      return new Response(JSON.stringify({ error: '인증 필요' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // users 테이블에서 사용자 확인
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', userKey)
      .single()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: '사용자를 찾을 수 없음' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { episode_id, role, content } = await req.json()

    if (!episode_id || !role || !content) {
      return new Response(
        JSON.stringify({ error: 'episode_id, role, content가 필요함' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 채팅 이력 저장
    const { data: chatRecord, error } = await supabase
      .from('chat_history')
      .insert({
        id: crypto.randomUUID(),
        episode_id,
        role,
        content,
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ data: chatRecord }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('오류:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '오류 발생' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
