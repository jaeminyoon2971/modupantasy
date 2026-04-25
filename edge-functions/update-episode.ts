// 에피소드 업데이트
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://modupantasy.vercel.app',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function extractUserKey(req: Request): string | null {
  const authHeader = req.headers.get('authorization') || ''
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  const key = parts[1]
  if (key.length < 8 || key.length > 128) return null
  return key
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }

  try {
    const userKey = extractUserKey(req)
    if (!userKey) {
      return new Response(JSON.stringify({ error: '인증 필요' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const { data: user, error: userError } = await supabase
      .from('users').select('id').eq('user_id', userKey).single()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: '사용자를 찾을 수 없음' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const body = await req.json()
    const { episode_id, manuscript, status, title } = body

    if (!episode_id || typeof episode_id !== 'string') {
      return new Response(JSON.stringify({ error: 'episode_id가 필요함' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // 에피소드 소유권 확인
    const { data: episodeCheck, error: ownerError } = await supabase
      .from('episodes').select('id, project:projects(user_id)')
      .eq('id', episode_id).single()

    if (ownerError || !episodeCheck) {
      return new Response(JSON.stringify({ error: '에피소드를 찾을 수 없음' }), {
        status: 404, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    if ((episodeCheck.project as any)?.user_id !== user.id) {
      return new Response(JSON.stringify({ error: '권한 없음' }), {
        status: 403, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const { data: episode, error } = await supabase
      .from('episodes')
      .update({
        manuscript: typeof manuscript === 'string' ? manuscript : '',
        status: typeof status === 'string' ? status : 'writing',
        title: typeof title === 'string' ? title.slice(0, 200) : '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', episode_id)
      .select()

    if (error) throw error

    return new Response(JSON.stringify({ data: episode }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (error) {
    console.error('오류 발생')
    return new Response(JSON.stringify({ error: '서버 오류가 발생했어요' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
